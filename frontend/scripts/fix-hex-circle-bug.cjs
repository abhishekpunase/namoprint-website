const fs = require('fs')

function patchFile(file, replacer) {
  if (!fs.existsSync(file)) throw new Error('Missing file: ' + file)
  const before = fs.readFileSync(file, 'utf8')
  const after = replacer(before)
  if (after === before) throw new Error('No change: ' + file)
  fs.writeFileSync(file, after)
  console.log('OK', file)
}

patchFile('frontend/src/utils/mockupSlotShapes.js', (s) => {
  const start = s.indexOf('export function finalizePhotoSlot')
  const end = s.indexOf('export function finalizePhotoSlots', start)
  if (start < 0 || end < 0) throw new Error('finalizePhotoSlot block missing')

  const neu = `export function finalizePhotoSlot(box, { forceHex = false } = {}) {
  if (!box) return box

  // Hex only when product/slot is explicitly hexagonal.
  // Circular openings fill ~0.785 of bbox — same band as hex — so fillRatio alone is unsafe.
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

/** Round dial: drop polygon/hex clips so photo fills the circular opening only. */
export function forceCircularPhotoSlot(box) {
  if (!box) return box
  const { clipPath: _c, fillRatio: _f, slotShape: _s, ...rest } = box
  const minSide = Math.min(Number(rest.width) || 0, Number(rest.height) || 0)
  return {
    ...rest,
    rotate: rest.rotate || 0,
    borderRadius: Math.max(Number(rest.borderRadius) || 0, Math.round(minSide / 2)),
  }
}

`
  return s.slice(0, start) + neu + s.slice(end)
})

patchFile('frontend/src/utils/mockupAnalyzer.js', (s) => {
  const start = s.indexOf('function regionToBox')
  if (start < 0) throw new Error('regionToBox missing')
  const end = s.indexOf('\nfunction ', start + 1)
  if (end < 0) throw new Error('regionToBox end missing')

  const neu = `function regionToBox(region) {
  const { area, pixelCount, fillRatio, ...box } = region
  // Do NOT auto-apply hex from fillRatio — circles (~0.785) look hex-like by that metric.
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
}
`
  let out = s.slice(0, start) + neu + s.slice(end)
  if (!out.includes('applyHexSlotClip(')) {
    out = out.replace(/\r?\n\s*applyHexSlotClip,/, '')
  }
  if (!out.includes('isHexLikeFillRatio(')) {
    out = out.replace(/\r?\n\s*isHexLikeFillRatio,/, '')
  }
  return out
})

patchFile('frontend/src/utils/enrichProductMockup.js', (s) => {
  let out = s
  if (!out.includes('forceCircularPhotoSlot')) {
    if (out.includes("from './mockupSlotShapes'")) {
      out = out.replace(
        /import \{([^}]+)\} from '\.\/mockupSlotShapes'/,
        (m, inner) => {
          if (inner.includes('forceCircularPhotoSlot')) return m
          return `import {${inner.replace(/\s*$/, '')}, forceCircularPhotoSlot } from './mockupSlotShapes'`
        },
      )
    } else {
      throw new Error('mockupSlotShapes import missing')
    }
  }

  // Analysis path: circle wall watches
  const marker = 'Circle wall watches'
  if (out.includes(marker) || out.includes(".includes('circle')")) {
    // Replace any photoBox borderRadius-only circle fix with forceCircularPhotoSlot
    out = out.replace(
      /photoBox = \{\s*\.\.\.photoBox,\s*borderRadius: Math\.max\([^}]+\),\s*\}/m,
      'photoBox = forceCircularPhotoSlot(photoBox)',
    )
  }

  // Ensure after analysis assigns photoBox we force circular for circle products
  if (!out.includes('forceCircularPhotoSlot(photoBox)')) {
    // Insert before `const slotCount`
    const insertAt = out.indexOf('const slotCount = multiBoxes.length')
    if (insertAt < 0) throw new Error('slotCount marker missing')
    const inject = `
    // Circle / round wall watches must never keep a hex clip on a round gold frame
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
    }

`
    out = out.slice(0, insertAt) + inject + out.slice(insertAt)
  }

  // Configured mockup early return — also strip hex on circle
  if (out.includes('hasConfiguredMockup(product)') && !out.includes('forceCircularPhotoSlot(clipped')) {
    out = out.replace(
      /photoBox: clippedBoxes\?\.\[0\] \|\| mockup\.photoBox/,
      `photoBox: (() => {
        let pb = clippedBoxes?.[0] || mockup.photoBox
        const shapeText = String(product?.defaultOptions?.shape || mockup?.shape || 'Circle').toLowerCase()
        if (isWallWatchProduct(product) && shapeText.includes('circle') && pb) {
          pb = forceCircularPhotoSlot(pb)
        }
        return pb
      })()`,
    )
  }

  return out
})

console.log('done')
