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
  // Normalize CRLF for matching, keep original EOL when writing
  const norm = src.replace(/\r\n/g, '\n')
  const oldN = oldStr.replace(/\r\n/g, '\n')
  if (!norm.includes(oldN)) {
    console.log('MISS', label)
    return src
  }
  console.log('HIT', label)
  const next = norm.replace(oldN, newStr.replace(/\r\n/g, '\n'))
  // restore CRLF if file was CRLF
  return src.includes('\r\n') ? next.replace(/\n/g, '\r\n') : next
}

// 1) frame utils product types + uploaded overlay
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

// 2) normalize
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

// 3) hasConfiguredMockup + fix analyze import name if broken
{
  let src = read('utils/enrichProductMockup.js')
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

  // Fix analyze function name to match mockupAnalyzer export
  if (src.includes('analyzeMockupFromUrl') && !src.includes("import { analyzeMockupFromUrl }")) {
    src = src.replace(/analyzeMockupFromUrl/g, 'analyzeMockupFromUrl')
  }
  // If import says analyzeMockupFromUrl but call says analyzeMockupFromUrl or vice versa
  if (src.includes("import { analyzeMockupFromUrl }") && src.includes('await analyzeMockupFromUrl')) {
    src = src.replace(/await analyzeMockupFromUrl/g, 'await analyzeMockupFromUrl')
  }
  if (src.includes("import { analyzeMockupFromUrl }") && src.includes('await analyzeMockupFromUrl')) {
    // mismatch: import FromUrl, call FromUrl — unify to analyzeMockupFromUrl
    src = src.replace("import { analyzeMockupFromUrl }", "import { analyzeMockupFromUrl }")
    src = src.replace(/await analyzeMockupFromUrl/g, 'await analyzeMockupFromUrl')
  }
  if (src.includes("import { analyzeMockupFromUrl }") && src.includes('await analyzeMockupFromUrl')) {
    src = src.replace(/await analyzeMockupFromUrl/g, 'await analyzeMockupFromUrl')
  }

  write('utils/enrichProductMockup.js', src)
}

// 4) punch
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

// 5) fix collage inset default const name if broken
{
  let src = read('utils/wallWatchCollageLayouts.js')
  if (src.includes('DEFAULT_CANVAS') && src.includes('= DEFAULT_CANVAS') === false) {
    // ok
  }
  // Ensure inset uses same DEFAULT_CANVAS as file
  if (src.includes('insetCollageBoxesInWindow') && src.includes('DEFAULT_CANVAS') && !src.includes('canvas = DEFAULT_CANVAS')) {
    src = src.replace('canvas = DEFAULT_CANVAS', 'canvas = DEFAULT_CANVAS')
  }
  if (src.includes('canvas = DEFAULT_CANVAS') && src.includes('const DEFAULT_CANVAS')) {
    src = src.replace(/canvas = DEFAULT_CANVAS/g, 'canvas = DEFAULT_CANVAS')
  }
  write('utils/wallWatchCollageLayouts.js', src)
}

console.log('DONE2')
