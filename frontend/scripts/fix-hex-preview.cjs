const fs = require('fs')
const file = 'frontend/src/components/product/PreviewFrame.jsx'
let s = fs.readFileSync(file, 'utf8')

// import forceCircularPhotoSlot
if (!s.includes('forceCircularPhotoSlot')) {
  s = s.replace(
    "import { HEX_PHOTO_FILL_SCALE, isHexClipPath } from '../../utils/mockupSlotShapes'",
    "import { HEX_PHOTO_FILL_SCALE, isHexClipPath, forceCircularPhotoSlot } from '../../utils/mockupSlotShapes'",
  )
}

// photoBoxesList — always strip hex on circular dials (even when slotsFromMockup)
const oldList = `const photoBoxesList = useMemo(() => {
    const boxes = resolvePreviewPhotoBoxes(product, variant, options)
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

const newList = `const photoBoxesList = useMemo(() => {
    const boxes = resolvePreviewPhotoBoxes(product, variant, options)
    const uploaded = resolveUploadedFrameImage(product)
    if (!uploaded || !boxes?.length) return boxes
    const shape = String(options?.shape || product?.defaultOptions?.shape || '').toLowerCase()
    const circular = boxes.length === 1 && (shape.includes('circle') || shape.includes('round') || !shape)

    // Round frames must never keep a hexagonal photo window
    if (circular) {
      const rounded = boxes.map((b) => forceCircularPhotoSlot(b))
      if (product?.mockup?.slotsFromMockup) return rounded
      const mockupCanvas = product?.mockup?.canvas || { width: 1000, height: 1000 }
      return fitPhotoBoxesToMockupOpening(rounded, mockupCanvas, {
        circular: true,
        expandRatio: -0.03,
      })
    }

    // Admin-tuned mockup slots — use exactly as saved (acrylic-style adjust)
    if (product?.mockup?.slotsFromMockup) return boxes
    const mockupCanvas = product?.mockup?.canvas || { width: 1000, height: 1000 }
    // Slight INSET so photo stays inside the opening and never bleeds under frame anti-alias edges
    return fitPhotoBoxesToMockupOpening(boxes, mockupCanvas, {
      circular: false,
      expandRatio: boxes.length > 1 ? -0.02 : -0.03,
    })
  }, [product, variant, options])`

if (!s.includes(oldList)) {
  console.log('MISS photoBoxesList — trying softer match')
  if (!s.includes('Admin-tuned mockup slots')) throw new Error('photoBoxesList not found')
} else {
  s = s.replace(oldList, newList)
  console.log('OK photoBoxesList')
}

// Skip clip inference for circular dials
const oldFx = `  useEffect(() => {
    const boxes = layoutBoxesRef.current
    if (!frameImage || !photosUnderFrame || !boxes.length || useCollageSlots) {
      setClippedLayoutBoxes(null)
      return undefined
    }
    if (boxes.every((entry) => entry.clipPath)) {
      setClippedLayoutBoxes(null)
      return undefined
    }

    let cancelled = false
    inferSlotClipPathsFromFrame(frameImage, boxes, layoutCanvasRef.current)`

const newFx = `  useEffect(() => {
    const boxes = layoutBoxesRef.current
    if (!frameImage || !photosUnderFrame || !boxes.length || useCollageSlots) {
      setClippedLayoutBoxes(null)
      return undefined
    }
    // Circular dials: never derive polygon clips (sparse rays look hexagonal)
    const shapeText = String(options?.shape || product?.defaultOptions?.shape || '').toLowerCase()
    const circularDial =
      boxes.length === 1 &&
      (shapeText.includes('circle') ||
        shapeText.includes('round') ||
        !shapeText ||
        isCircularPhotoBox(boxes[0]))
    if (circularDial) {
      setClippedLayoutBoxes(null)
      return undefined
    }
    if (boxes.every((entry) => entry.clipPath)) {
      setClippedLayoutBoxes(null)
      return undefined
    }

    let cancelled = false
    inferSlotClipPathsFromFrame(frameImage, boxes, layoutCanvasRef.current)`

if (s.includes(oldFx)) {
  s = s.replace(oldFx, newFx)
  console.log('OK clip inference skip')
} else {
  console.log('MISS clip inference block')
}

s = s.replace(
  '}, [frameImage, photosUnderFrame, layoutBoxesKey, useCollageSlots])',
  '}, [frameImage, photosUnderFrame, layoutBoxesKey, useCollageSlots, options?.shape, product?.defaultOptions?.shape])',
)

// Suppress hex clipPath on non-hex products when rendering single photo slot
if (s.includes('clipPath={effectiveLayoutBox?.clipPath}')) {
  s = s.replace(
    'clipPath={effectiveLayoutBox?.clipPath}',
    `clipPath={(() => {
                  const shapeText = String(options?.shape || product?.defaultOptions?.shape || '').toLowerCase()
                  if (shapeText.includes('circle') || shapeText.includes('round') || !shapeText) return undefined
                  if (isHexClipPath(effectiveLayoutBox?.clipPath) && !shapeText.includes('hex')) return undefined
                  return effectiveLayoutBox?.clipPath
                })()}`,
  )
  console.log('OK single clipPath')
}

if (s.includes('clipPath={pb.clipPath}')) {
  s = s.replace(
    'clipPath={pb.clipPath}',
    `clipPath={(() => {
                      const shapeText = String(options?.shape || product?.defaultOptions?.shape || '').toLowerCase()
                      if (isHexClipPath(pb.clipPath) && !shapeText.includes('hex')) return undefined
                      return pb.clipPath
                    })()}`,
  )
  console.log('OK collage clipPath')
}

fs.writeFileSync(file, s)
console.log('saved')
