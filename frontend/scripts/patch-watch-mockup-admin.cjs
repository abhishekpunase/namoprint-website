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

// 1) Don't punch PNG/WebP — hard punch tears gold frame edges
{
  let src = read('utils/frameImageUtils.js')
  const old = `export function shouldPunchFrameHoles(frameUrl) {
  const url = String(resolveMediaUrl(frameUrl) || frameUrl || '').toLowerCase()
  // Bundled SVG mockups already have transparent windows
  if (url.includes('.svg')) return false
  // JPG/PNG/WebP admin mockups (white-center gold frames) need holes punched so photos show through
  return true
}`
  const neu = `export function shouldPunchFrameHoles(frameUrl) {
  const url = String(resolveMediaUrl(frameUrl) || frameUrl || '').toLowerCase()
  // Transparent PNG/WebP/SVG frames already have clean openings — punching tears/jagged edges on the bezel
  if (url.includes('.svg')) return false
  if (url.includes('.png')) return false
  if (url.includes('.webp')) return false
  // JPG mockups with white/black placeholders still need holes cut
  return true
}`
  if (src.includes(old.replace(/\r\n/g, '\n')) || src.replace(/\r\n/g, '\n').includes(old.replace(/\r\n/g, '\n'))) {
    src = src.replace(/\r\n/g, '\n').replace(old.replace(/\r\n/g, '\n'), neu)
    write('utils/frameImageUtils.js', src)
  } else {
    // fuzzy
    const re = /export function shouldPunchFrameHoles\(frameUrl\) \{[\s\S]*?\n\}/
    if (re.test(src.replace(/\r\n/g, '\n'))) {
      src = src.replace(/\r\n/g, '\n').replace(re, neu)
      write('utils/frameImageUtils.js', src)
      console.log('HIT punch fuzzy')
    } else console.log('MISS shouldPunchFrameHoles')
  }
}

// 2) PreviewFrame: trust admin slots; otherwise slight INSET (not expand) so photo never overlaps frame
{
  let src = read('components/product/PreviewFrame.jsx')
  const re = /const photoBoxesList = useMemo\(\(\) => \{[\s\S]*?\}, \[product, variant, options\]\)/
  const callName =
    (src.match(/const photoBoxesList = useMemo\(\(\) => \{[\s\S]*?(resolve\w+PhotoBoxes)\(/) || [])[1] ||
    'resolvePreviewPhotoBoxes'
  const replacement = `const photoBoxesList = useMemo(() => {
    const boxes = ${callName}(product, variant, options)
    const uploaded = resolveUploadedFrameImage(product)
    if (!uploaded || !boxes?.length) return boxes
    // Admin-tuned mockup slots — use exactly as saved (acrylic-style adjust)
    if (product?.mockup?.slotsFromMockup) return boxes
    const mockupCanvas = product?.mockup?.canvas || { width: 1000, height: 1000 }
    const shape = String(options?.shape || product?.defaultOptions?.shape || '').toLowerCase()
    const circular = boxes.length === 1 && (shape.includes('circle') || shape.includes('round') || !shape)
    // Slight INSET so photo stays inside the opening and never bleeds under frame anti-alias edges
    return fitPhotoBoxesToMockupOpening(boxes, mockupCanvas, {
      circular,
      expandRatio: boxes.length > 1 ? -0.02 : -0.03,
    })
  }, [product, variant, options])`
  if (re.test(src)) {
    src = src.replace(re, replacement)
    write('components/product/PreviewFrame.jsx', src)
  } else console.log('MISS PreviewFrame photoBoxesList')
}

// 3) wallWatchProductDefaults — honor admin mockup overrides
{
  let src = read('utils/wallWatchProductDefaults.js')
  const oldBuild = `export function buildWallWatchMockup(shape, uploadedFrameImage = '', collageOptions = {}) {
  const { collageEnabled = false, collagePhotoCount = 4 } = collageOptions
  const safeShape = resolveWallWatchShape(shape)
  const preset = BASE_SHAPE_MOCKUPS[safeShape] || BASE_SHAPE_MOCKUPS.Circle
  const canvas = { ...preset.canvas }

  if (collageEnabled && isCollagePhotoCount(collagePhotoCount)) {
    return {
      canvas,
      photoBoxes: buildCollagePhotoBoxes(collagePhotoCount, canvas),
      frameImage: uploadedFrameImage || preset.frameImage || null,
    }
  }

  return {
    canvas,
    ...(preset.photoBox ? { photoBox: { ...preset.photoBox } } : {}),
    frameImage: uploadedFrameImage || preset.frameImage || null,
  }
}`

  const newBuild = `export function buildWallWatchMockup(shape, uploadedFrameImage = '', collageOptions = {}, mockupOverrides = {}) {
  const { collageEnabled = false, collagePhotoCount = 4 } = collageOptions
  const safeShape = resolveWallWatchShape(shape)
  const preset = BASE_SHAPE_MOCKUPS[safeShape] || BASE_SHAPE_MOCKUPS.Circle
  const canvas = mockupOverrides.canvas?.width
    ? { width: Number(mockupOverrides.canvas.width), height: Number(mockupOverrides.canvas.height) }
    : { ...preset.canvas }

  const frameImage = uploadedFrameImage || mockupOverrides.frameImage || preset.frameImage || null
  const adminBoxes = Array.isArray(mockupOverrides.photoBoxes)
    ? mockupOverrides.photoBoxes.filter((b) => b && Number(b.width) > 0)
    : []
  const adminBox =
    mockupOverrides.photoBox && Number(mockupOverrides.photoBox.width) > 0
      ? mockupOverrides.photoBox
      : null

  // Admin MockupEditor slots win (acrylic-style adjust)
  if (adminBoxes.length > 1) {
    return {
      canvas,
      photoBoxes: adminBoxes,
      frameImage,
      slotsFromMockup: true,
    }
  }
  if (adminBox) {
    return {
      canvas,
      photoBox: { ...adminBox },
      frameImage,
      slotsFromMockup: true,
    }
  }

  if (collageEnabled && isCollagePhotoCount(collagePhotoCount)) {
    return {
      canvas,
      photoBoxes: buildCollagePhotoBoxes(collagePhotoCount, canvas),
      frameImage,
    }
  }

  return {
    canvas,
    ...(preset.photoBox ? { photoBox: { ...preset.photoBox } } : {}),
    frameImage,
  }
}`

  const norm = src.replace(/\r\n/g, '\n')
  if (norm.includes(oldBuild.replace(/\r\n/g, '\n'))) {
    src = norm.replace(oldBuild.replace(/\r\n/g, '\n'), newBuild)
    console.log('HIT buildWallWatchMockup')
  } else {
    const re = /export function buildWallWatchMockup\([\s\S]*?\n\}/
    if (re.test(norm)) {
      src = norm.replace(re, newBuild)
      console.log('HIT buildWallWatchMockup fuzzy')
    } else console.log('MISS buildWallWatchMockup')
  }

  // Update admin payload to pass overrides
  src = src.replace(
    /mockup: buildWallWatchMockup\(shape, form\.frameImage, collageOptions\),/,
    `mockup: buildWallWatchMockup(shape, form.frameImage, collageOptions, {
      frameImage: form.frameImage,
      canvas: {
        width: Number(form.canvasWidth) || 1000,
        height: Number(form.canvasHeight) || 1000,
      },
      photoBox: form.photoBox,
      photoBoxes: form.photoBoxes,
    }),`,
  )
  write('utils/wallWatchProductDefaults.js', src)
}

console.log('PHASE1 DONE')
