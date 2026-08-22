/**
 * Hex clip was auto-applied from fillRatio (~0.78), which also matches
 * circular openings (π/4). Hex must only apply on real hex/honeycomb frames.
 */
const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..', 'src')

function patch(rel, fn) {
  const file = path.join(root, rel)
  let src = fs.readFileSync(file, 'utf8')
  const next = fn(src)
  if (next === src) {
    console.log('NO CHANGE', rel)
    return false
  }
  fs.writeFileSync(file, next)
  console.log('OK', rel)
  return true
}

// 1) mockupSlotShapes — never auto-hex from fillRatio alone
patch('utils/mockupSlotShapes.js', (src) => {
  // Replace finalizePhotoSlot body logic
  const old = `export function finalizePhotoSlot(box, { forceHex = false } = {}) {
  if (!box) return box
  if (box.clipPath && isHexClipPath(box.clipPath)) return box

  const fillRatio = Number(box.fillRatio)
  const shouldHex =
    forceHex ||
    box.slotShape === 'hex' ||
    (Number.isFinite(fillRatio) && fillRatio > 0 && isHexLikeFillRatio(fillRatio))

  if (shouldHex) {
    return applyHexSlotClip(box, fillRatio ? 0.03 : 0.05)
  }

  return normalizeRectPhotoSlot(box)
}`

  const neu = `export function finalizePhotoSlot(box, { forceHex = false } = {}) {
  if (!box) return box

  // Never keep a hex clip unless this product/slot is explicitly hexagonal.
  // (Circular openings fill ~0.78 of their bbox — same band as hex — so fillRatio alone is unsafe.)
  if (box.clipPath && isHexClipPath(box.clipPath)) {
    if (forceHex || box.slotShape === 'hex') return box
    return normalizeRectPhotoSlot(box)
  }

  const shouldHex = forceHex || box.slotShape === 'hex'
  if (shouldHex) {
    return applyHexSlotClip(box, 0.03)
  }

  return normalizeRectPhotoSlot(box)
}

/** Round dial: drop polygon clips so photo fills the circular opening only. */
export function forceCircularPhotoSlot(box) {
  if (!box) return box
  const { clipPath: _c, fillRatio: _f, slotShape: _s, ...rest } = box
  const minSide = Math.min(Number(rest.width) || 0, Number(rest.height) || 0)
  return {
    ...rest,
    rotate: rest.rotate || 0,
    borderRadius: Math.max(Number(rest.borderRadius) || 0, Math.round(minSide / 2)),
  }
}`

  if (!src.includes(old)) {
    // try with Windows newlines already normalized
    console.log('finalizePhotoSlot block not exact, trying flexible…')
    if (src.includes('isHexLikeFillRatio(fillRatio)')) {
      src = src.replace(
        /export function finalizePhotoSlot\([\s\S]*?\n\}\n\nexport function finalizePhotoSlots/,
        `${neu}\n\nexport function finalizePhotoSlots`,
      )
      return src
    }
    return src
  }
  return src.replace(old, neu)
})

// 2) mockupAnalyzer — do not stamp hex clips from fillRatio
patch('utils/mockupAnalyzer.js', (src) => {
  const old = `function regionToBox(region) {
  const { area, pixelCount, fillRatio, ...box } = region
  const isHex = isHexLikeFillRatio(fillRatio)
  const pad = isHex ? 6 : 2

  const raw = {
    x: box.x + pad,
    y: box.y + pad,
    width: Math.max(8, box.width - pad * 2),
    height: Math.max(8, box.height - pad * 2),
    rotate: 0,
    borderRadius: 0,
    fillRatio,
  }

  if (isHex) {
    return applyHexSlotClip(raw, 0.03)
  }

  return normalizeRectPhotoSlot(raw)
}`

  const neu = `function regionToBox(region) {
  const { area, pixelCount, fillRatio, ...box } = region
  // Do NOT auto-apply hex from fillRatio — circles (~0.785) look "hex-like" by that metric.
  // Hex clips are applied later only for hex/honeycomb products via finalizePhotoSlots.
  const pad = 2

  const raw = {
    x: box.x + pad,
    y: box.y + pad,
    width: Math.max(8, box.width - pad * 2),
    height: Math.max(8, box.height - pad * 2),
    rotate: 0,
    borderRadius: 0,
    fillRatio,
  }

  return normalizeRectPhotoSlot(raw)
}`

  if (src.includes(old)) return src.replace(old, neu)

  // alternate naming from other copy
  const alt = src.match(/function regionToBox\([\s\S]*?\n\}/)
  if (alt && alt[0].includes('applyHexSlotClip')) {
    return src.replace(alt[0], neu)
  }
  console.log('regionToBox not found as expected')
  return src
})

// 3) enrichProductMockup — strip hex clip on circle wall watches
patch('utils/enrichProductMockup.js', (src) => {
  if (!src.includes("forceCircularPhotoSlot") && src.includes("finalizePhotoSlots")) {
    src = src.replace(
      "import { finalizePhotoSlots } from './mockupSlotShapes'",
      "import { finalizePhotoSlots, forceCircularPhotoSlot, isHexClipPath } from './mockupSlotShapes'",
    )
  }

  // Strengthen circle branch to also strip clipPath
  const circleOld = `    // Circle wall watches: clip photo to round inner opening so it never overlaps the mockup ring
    if (
      isWallWatchProduct(product) &&
      String(product?.defaultOptions?.shape || 'Circle').toLowerCase().includes('circle') &&
      photoBox &&
      Number(photoBox.width) > 0
    ) {
      const minSide = Math.min(Number(photoBox.width), Number(photoBox.height))
      photoBox = {
        ...photoBox,
        borderRadius: Math.max(Number(photoBox.borderRadius) || 0, Math.round(minSide / 2)),
      }
    }`

  const circleNew = `    // Circle wall watches: round opening only — never keep a hex/polygon clip on a round frame
    if (
      isWallWatchProduct(product) &&
      String(product?.defaultOptions?.shape || product?.mockup?.shape || 'Circle').toLowerCase().includes('circle') &&
      photoBox &&
      Number(photoBox.width) > 0
    ) {
      photoBox = forceCircularPhotoSlot(photoBox)
      if (multiBoxes.length > 1) {
        multiBoxes = multiBoxes.map((b) => forceCircularPhotoSlot(b))
      }
    }`

  if (src.includes(circleOld)) {
    src = src.replace(circleOld, circleNew)
  } else if (src.includes('borderRadius: Math.max(Number(photoBox.borderRadius)') && !src.includes('forceCircularPhotoSlot(photoBox)')) {
    src = src.replace(
      /\/\/ Circle wall watches:[\s\S]*?photoBox = \{[\s\S]*?\}[\s\S]*?\}/,
      circleNew.trim(),
    )
  }

  // Also when hasConfiguredMockup returns early with single photoBox that has hex clip on circle product
  if (!src.includes('forceCircular on configured') && src.includes('hasConfiguredMockup(product)')) {
    src = src.replace(
      `if (hasConfiguredMockup(product)) {
    const mockup = product.mockup || {}
    const uploaded = resolveUploadedFrameImage(product)
    const clippedBoxes =
      mockup.photoBoxes?.length > 1 ? finalizePhotoSlots(mockup.photoBoxes, product) : mockup.photoBoxes

    return {
      ...product,
      mockup: {
        ...mockup,
        frameImage: resolveMediaUrl(uploaded || mockup.frameImage),
        ...(clippedBoxes?.length ? { photoBoxes: clippedBoxes } : {}),
        photoBox: clippedBoxes?.[0] || mockup.photoBox,
      },
    }
  }`,
      `if (hasConfiguredMockup(product)) {
    const mockup = product.mockup || {}
    const uploaded = resolveUploadedFrameImage(product)
    let clippedBoxes =
      mockup.photoBoxes?.length > 1 ? finalizePhotoSlots(mockup.photoBoxes, product) : mockup.photoBoxes
    let photoBox = clippedBoxes?.[0] || mockup.photoBox
    // forceCircular on configured — circle dial must not keep hex clip from old analysis
    const shapeText = String(product?.defaultOptions?.shape || mockup?.shape || 'Circle').toLowerCase()
    if (isWallWatchProduct(product) && shapeText.includes('circle') && photoBox) {
      photoBox = forceCircularPhotoSlot(photoBox)
      if (clippedBoxes?.length) clippedBoxes = clippedBoxes.map((b) => forceCircularPhotoSlot(b))
    } else if (photoBox?.clipPath && isHexClipPath(photoBox.clipPath) && !String(product?.title || '').toLowerCase().includes('hex')) {
      // Non-hex products: drop mistaken hex clips
      photoBox = forceCircularPhotoSlot
        ? { ...photoBox, clipPath: undefined, borderRadius: Math.round(Math.min(photoBox.width, photoBox.height) / 2) }
        : photoBox
      const { clipPath: _c, ...clean } = photoBox
      photoBox = {
        ...clean,
        borderRadius: Math.max(Number(clean.borderRadius) || 0, Math.round(Math.min(Number(clean.width), Number(clean.height)) / 2)),
      }
    }

    return {
      ...product,
      mockup: {
        ...mockup,
        frameImage: resolveMediaUrl(uploaded || mockup.frameImage),
        ...(clippedBoxes?.length ? { photoBoxes: clippedBoxes } : {}),
        photoBox,
      },
    }
  }`,
    )
  }

  return src
})

console.log('done')
