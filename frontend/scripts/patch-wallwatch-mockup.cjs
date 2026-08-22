const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..', 'src')

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}
function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content)
  console.log('UPDATED', rel)
}
function replace(src, oldStr, newStr, label) {
  if (!src.includes(oldStr)) {
    console.log('MISS', label)
    return src
  }
  console.log('HIT', label)
  return src.replace(oldStr, newStr)
}

// 1) wallWatchFrameUtils — correct product types + uploaded mockup always overlays
{
  let src = read('utils/wallWatchFrameUtils.js')
  src = replace(
    src,
    `export function isGenericSquareFrameUrl(url = '') {
  return /frame-square\\.svg/i.test(String(url))
}

export function wallWatchShouldUseSvgFrame(product, options = {}, variant = {}, frameImage = '') {
  if (!frameImage) return false
  const productType = product?.productType || ''
  if (productType !== 'custom-wall-watch' && productType !== 'photo-clock') return true

  const shape = options?.shape || product?.defaultOptions?.shape || variant?.frameType || 'Circle'
  const savedFrame = product?.mockup?.frameImage || ''

  if (savedFrame && !isGenericSquareFrameUrl(savedFrame) && !/\\/products\\/mockups\\//i.test(savedFrame)) {
    return true
  }
  if (isGenericSquareFrameUrl(frameImage) && !WALL_CLOCK_SVG_FRAME_SHAPES.has(shape)) return false

  return true
}`,
    `export function isGenericSquareFrameUrl(url = '') {
  return /frame[-_]?square\\.svg/i.test(String(url))
}

export function wallWatchShouldUseSvgFrame(product, options = {}, variant = {}, frameImage = '') {
  if (!frameImage) return false
  const productType = product?.productType || ''
  // Acrylic / other framed products — always overlay when a frame image exists
  if (productType !== 'custom-wall-watch' && productType !== 'photo-clock') return true

  const shape = options?.shape || product?.defaultOptions?.shape || variant?.frameType || 'Circle'
  const savedFrame = product?.mockup?.frameImage || ''

  // Admin-uploaded mockup — always overlay so photos sit inside the opening (acrylic-style)
  if (savedFrame && !isGenericSquareFrameUrl(savedFrame) && !/\\/products\\/mockups\\//i.test(savedFrame)) {
    return true
  }
  if (frameImage && !isGenericSquareFrameUrl(frameImage) && !/\\/products\\/mockups\\//i.test(frameImage)) {
    return true
  }
  if (isGenericSquareFrameUrl(frameImage) && !WALL_CLOCK_SVG_FRAME_SHAPES.has(shape)) return false

  return true
}`,
    'wallWatchFrameUtils',
  )
  write('utils/wallWatchFrameUtils.js', src)
}

// 2) collage inset helper
{
  let src = read('utils/wallWatchCollageLayouts.js')
  if (!src.includes('insetCollageBoxesInWindow')) {
    src = `${src.trimEnd()}

/** Keep collage slots inside the analyzed mockup window so photos never overlap the frame ring */
export function insetCollageBoxesInWindow(count, windowBox, canvas = DEFAULT_CANVAS) {
  if (!windowBox || !(Number(windowBox.width) > 0) || !(Number(windowBox.height) > 0)) {
    return buildCollagePhotoBoxes(count, canvas)
  }
  const pad = Math.max(8, Math.round(Math.min(windowBox.width, windowBox.height) * 0.04))
  const inner = {
    width: Math.max(40, Number(windowBox.width) - pad * 2),
    height: Math.max(40, Number(windowBox.height) - pad * 2),
  }
  const local = buildCollagePhotoBoxes(count, inner)
  const radius = Number(windowBox.borderRadius) || 0
  const circular = radius >= Math.min(windowBox.width, windowBox.height) * 0.45

  return local.map((box) => ({
    ...box,
    x: Math.round(Number(windowBox.x) + pad + box.x),
    y: Math.round(Number(windowBox.y) + pad + box.y),
    borderRadius: circular ? Math.round(Math.min(box.width, box.height) / 2) : box.borderRadius,
  }))
}
`
    write('utils/wallWatchCollageLayouts.js', src)
  } else console.log('SKIP inset helper')
}

// 3) normalize
{
  let src = read('utils/wallWatchProductDefaults.js')
  src = replace(
    src,
    `  if (collageEnabled) {
    mockup.photoBoxes = built.photoBoxes
    delete mockup.photoBox
  } else if (!existingMockup.photoBox && built.photoBox) {
    mockup.photoBox = built.photoBox
    delete mockup.photoBoxes
  }`,
    `  // Uploaded mockup: acrylic-style — photos only in analyzed inner opening, never overlap frame ring
  if (uploadedFrame) {
    if (existingMockup.slotsFromMockup && existingMockup.photoBoxes?.length > 1) {
      mockup.photoBoxes = existingMockup.photoBoxes
      delete mockup.photoBox
    } else if (existingMockup.slotsFromMockup && existingMockup.photoBox) {
      mockup.photoBox = existingMockup.photoBox
      delete mockup.photoBoxes
    } else {
      delete mockup.photoBoxes
      delete mockup.photoBox
      mockup.slotsFromMockup = false
    }
  } else if (collageEnabled) {
    mockup.photoBoxes = built.photoBoxes
    delete mockup.photoBox
  } else if (!existingMockup.photoBox && built.photoBox) {
    mockup.photoBox = built.photoBox
    delete mockup.photoBoxes
  }`,
    'normalize photoBoxes',
  )
  write('utils/wallWatchProductDefaults.js', src)
}

// 4) enrich
{
  let src = read('utils/enrichProductMockup.js')
  src = replace(
    src,
    `import { normalizeWallWatchProduct } from './wallWatchProductDefaults'`,
    `import { normalizeWallWatchProduct, getCollagePhotoCount, isCollageWallWatchProduct } from './wallWatchProductDefaults'
import { insetCollageBoxesInWindow } from './wallWatchCollageLayouts'`,
    'enrich imports',
  )

  src = replace(
    src,
    `function hasConfiguredMockup(product) {
  const mockup = product?.mockup
  const frameImage = resolveUploadedFrameImage(product) || mockup?.frameImage
  if (!frameImage || isBuiltInCatalogMockup(frameImage)) return false
  if (mockup.photoBoxes?.length > 1) return true
  const box = mockup.photoBox
  return Boolean(box && Number(box.width) > 0 && Number(box.height) > 0)
}`,
    `function hasConfiguredMockup(product) {
  const mockup = product?.mockup
  const frameImage = resolveUploadedFrameImage(product) || mockup?.frameImage
  if (!frameImage || isBuiltInCatalogMockup(frameImage)) return false
  // Wall-watch uploaded mockup must be analyzed so photo sits inside the frame opening
  if (isWallWatchProduct(product) && resolveUploadedFrameImage(product) && !mockup?.slotsFromMockup) {
    return false
  }
  if (mockup.photoBoxes?.length > 1) return true
  const box = mockup.photoBox
  return Boolean(box && Number(box.width) > 0 && Number(box.height) > 0)
}`,
    'hasConfiguredMockup',
  )

  if (!src.includes('slotsFromMockup: true')) {
    const tryIdx = src.indexOf('  try {')
    const catchIdx = src.indexOf('  } catch', tryIdx)
    if (tryIdx >= 0 && catchIdx > tryIdx) {
      const newTry = `  try {
    const analysis = await analyzeMockupFromUrl(frameUrl)
    let multiBoxes = analysis.photoBoxes?.length > 1 ? analysis.photoBoxes : []
    let photoBox = analysis.photoBox
    const canvas = {
      width: Number(analysis.canvasWidth) || 1000,
      height: Number(analysis.canvasHeight) || 1000,
    }

    // Collage wall watch + single detected window → nest slots inside the window only
    if (
      isWallWatchProduct(product) &&
      isCollageWallWatchProduct(product) &&
      multiBoxes.length <= 1 &&
      photoBox &&
      Number(photoBox.width) > 0
    ) {
      const count = getCollagePhotoCount(product) || 4
      multiBoxes = insetCollageBoxesInWindow(count, photoBox, canvas)
      photoBox = multiBoxes[0]
    }

    const slotCount = multiBoxes.length > 1 ? multiBoxes.length : 1
    const nextMockup = {
      ...(product.mockup || {}),
      frameImage: resolveUploadedFrameImage(product) || product.mockup?.frameImage || frameUrl,
      canvas,
      photoBox,
      slotsFromMockup: true,
    }
    if (multiBoxes.length > 1) nextMockup.photoBoxes = multiBoxes
    else delete nextMockup.photoBoxes

    return {
      ...product,
      mockup: nextMockup,
      personalization: {
        ...(product.personalization || {}),
        allowPhotoUpload: true,
        maxPhotos: slotCount,
      },
    }
`
      src = src.slice(0, tryIdx) + newTry + src.slice(catchIdx)
      console.log('HIT enrich try block')
    } else console.log('MISS enrich try block')
  }

  write('utils/enrichProductMockup.js', src)
}

// 5) punch white centers + allow PNG
{
  let src = read('utils/frameImageUtils.js')
  src = replace(
    src,
    `export function shouldPunchFrameHoles(frameUrl) {
  const url = String(resolveMediaUrl(frameUrl) || frameUrl || '').toLowerCase()
  if (url.includes('.svg')) return false
  if (url.includes('.png')) return false
  if (url.includes('.webp')) return false
  return true
}`,
    `export function shouldPunchFrameHoles(frameUrl) {
  const url = String(resolveMediaUrl(frameUrl) || frameUrl || '').toLowerCase()
  // Bundled SVG mockups already have transparent windows
  if (url.includes('.svg')) return false
  // JPG/PNG/WebP admin mockups (white-center gold frames) need holes punched so photos show through
  return true
}`,
    'shouldPunchFrameHoles',
  )
  src = replace(
    src,
    `        if (a < 140 || (r < 75 && g < 75 && b < 75)) {
          data[i + 3] = 0
        }`,
    `        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const sat = Math.max(r, g, b) - Math.min(r, g, b)
        const isDark = r < 75 && g < 75 && b < 75
        const isWhiteCenter = lum >= 200 && sat < 55
        if (a < 140 || isDark || isWhiteCenter) {
          data[i + 3] = 0
        }`,
    'punch white+dark',
  )
  write('utils/frameImageUtils.js', src)
}

// 6) PreviewFrame punch for all overlay mockups
{
  let src = read('components/product/PreviewFrame.jsx')
  src = replace(
    src,
    `    const needsPunch = useCollageSlots && boxes?.length && shouldPunchFrameHoles(frameImage)`,
    `    // Acrylic-style: punch photo window(s) so image sits inside mockup, never over the frame
    const needsPunch = Boolean(photosUnderFrame && boxes?.length && shouldPunchFrameHoles(frameImage))`,
    'needsPunch',
  )
  write('components/product/PreviewFrame.jsx', src)
}

console.log('DONE')
