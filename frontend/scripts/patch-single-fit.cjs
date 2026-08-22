const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..', 'src')

// PreviewFrame: always fit uploaded mockup openings (fixes existing products with white gaps)
{
  const file = path.join(root, 'components/product/PreviewFrame.jsx')
  let src = fs.readFileSync(file, 'utf8')
  const re = /const photoBoxesList = useMemo\(\(\) => \{[\s\S]*?\}, \[product, variant, options\]\)/
  if (!re.test(src)) {
    console.log('MISS PreviewFrame block')
  } else {
    const callName = (src.match(/const photoBoxesList = useMemo\(\(\) => \{[\s\S]*?(resolve\w+PhotoBoxes)\(/) || [])[1] || 'resolvePreviewPhotoBoxes'
    const replacement = `const photoBoxesList = useMemo(() => {
    const boxes = ${callName}(product, variant, options)
    const uploaded = resolveUploadedFrameImage(product)
    if (!uploaded || !boxes?.length) return boxes
    const mockupCanvas = product?.mockup?.canvas || { width: 1000, height: 1000 }
    const shape = String(options?.shape || product?.defaultOptions?.shape || '').toLowerCase()
    const circular = boxes.length === 1 && (shape.includes('circle') || shape.includes('round') || !shape)
    // Fill mockup opening and tuck under bezel — removes white crescent gaps
    return fitPhotoBoxesToMockupOpening(boxes, mockupCanvas, {
      circular,
      expandRatio: boxes.length > 1 ? 0.035 : 0.08,
    })
  }, [product, variant, options])`
    src = src.replace(re, replacement)
    fs.writeFileSync(file, src)
    console.log('UPDATED PreviewFrame', callName)
  }
}

// enrich: remove fit block so PreviewFrame is the single expand pass
{
  const file = path.join(root, 'utils/enrichProductMockup.js')
  let src = fs.readFileSync(file, 'utf8')
  const re = /\n\s*\/\/ Expand slots to fill mockup opening[\s\S]*?\n\s*\}\n(?=\s*const slotCount)/
  if (re.test(src)) {
    src = src.replace(re, '\n')
    console.log('REMOVED enrich expand block')
  } else {
    // alternate comment text
    const re2 = /\n\s*\/\/ Expand slots to fill[\s\S]*?\n\s*\}\n\n(?=\s*const slotCount)/
    if (re2.test(src)) {
      src = src.replace(re2, '\n\n')
      console.log('REMOVED enrich expand block (alt)')
    } else {
      const idx = src.indexOf('fitPhotoBoxesToMockupOpening(')
      console.log('enrich fit idx', idx)
      if (idx > 0) {
        // find block start: previous blank line / comment
        let start = src.lastIndexOf('\n    {', idx)
        const comment = src.lastIndexOf('Expand slots', idx)
        if (comment > 0) start = src.lastIndexOf('\n', comment)
        const end = src.indexOf('\n    const slotCount', idx)
        if (start > 0 && end > start) {
          src = src.slice(0, start + 1) + src.slice(end + 1)
          console.log('REMOVED enrich expand by slice')
        }
      }
    }
  }
  if (!src.includes('fitPhotoBoxesToMockupOpening(')) {
    src = src.replace(/\nimport \{ fitPhotoBoxesToMockupOpening \} from '\.\/mockupLayout'/, '')
    console.log('REMOVED unused fit import')
  }
  fs.writeFileSync(file, src)
  console.log('UPDATED enrich')
}

console.log('DONE')
