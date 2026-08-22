const fs = require('fs')
const file = 'frontend/src/components/product/PreviewFrame.jsx'
let s = fs.readFileSync(file, 'utf8')

const start = s.indexOf('  useEffect(() => {\n    const boxes = layoutBoxesRef.current\n    if (!frameImage || !photosUnderFrame || !boxes.length || useCollageSlots)')
if (start < 0) {
  // try CRLF
  const start2 = s.indexOf('  useEffect(() => {\r\n    const boxes = layoutBoxesRef.current\r\n    if (!frameImage || !photosUnderFrame || !boxes.length || useCollageSlots)')
  if (start2 < 0) throw new Error('useEffect not found')
}

const marker = 'inferSlotClipPathsFromFrame(frameImage, boxes, layoutCanvasRef.current)'
const callAt = s.indexOf(marker, s.indexOf('setClippedLayoutBoxes] = useState'))
if (callAt < 0) throw new Error('infer call not found')

// Find start of this useEffect
const fxStart = s.lastIndexOf('  useEffect(() => {', callAt)
const earlyReturn = s.indexOf('if (boxes.every((entry) => entry.clipPath))', fxStart)
if (fxStart < 0 || earlyReturn < 0) throw new Error('markers missing')

if (s.slice(fxStart, callAt).includes('circularDial')) {
  console.log('already patched')
  process.exit(0)
}

const inject = `    // Circular dials: never derive polygon clips (sparse rays look hexagonal)
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
`
s = s.slice(0, earlyReturn) + inject + s.slice(earlyReturn)

s = s.replace(
  '}, [frameImage, photosUnderFrame, layoutBoxesKey, useCollageSlots])',
  '}, [frameImage, photosUnderFrame, layoutBoxesKey, useCollageSlots, options?.shape, product?.defaultOptions?.shape])',
)

fs.writeFileSync(file, s)
console.log('OK inference skip')
