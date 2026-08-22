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

// 1) enrich — import + apply fit
{
  let src = read('utils/enrichProductMockup.js')
  if (!src.includes('fitPhotoBoxesToMockupOpening')) {
    if (src.includes("from './wallWatchCollageLayouts'")) {
      src = src.replace(
        /(import \{[^}]+\} from '\.\/wallWatchCollageLayouts')/,
        "$1\nimport { fitPhotoBoxesToMockupOpening } from './mockupLayout'",
      )
    } else {
      src = src.replace(
        /(import \{[^}]+\} from '\.\/wallWatchProductDefaults')/,
        "$1\nimport { fitPhotoBoxesToMockupOpening } from './mockupLayout'",
      )
    }
  }

  if (!src.includes('Expand slots to fill mockup opening')) {
    const fitBlock = `    // Expand slots to fill mockup opening (tuck under bezel — no white gaps)
    {
      const circular =
        String(product?.defaultOptions?.shape || product?.mockup?.shape || 'Circle')
          .toLowerCase()
          .includes('circle') && multiBoxes.length <= 1
      const fitted = fitPhotoBoxesToMockupOpening(
        multiBoxes.length > 1 ? multiBoxes : photoBox ? [photoBox] : [],
        canvas,
        { circular, expandRatio: multiBoxes.length > 1 ? 0.03 : 0.07 },
      )
      if (fitted.length > 1) {
        multiBoxes = fitted
        photoBox = fitted[0]
      } else if (fitted.length === 1) {
        photoBox = fitted[0]
        multiBoxes = []
      }
    }

`
    if (/const slotCount = multiBoxes\.length/.test(src)) {
      src = src.replace(/const slotCount = multiBoxes\.length[^\n]*/, (m) => fitBlock + m)
      console.log('HIT enrich fit block')
    } else {
      console.log('MISS enrich slotCount')
    }
  }
  write('utils/enrichProductMockup.js', src)
}

// 2) PreviewFrame — runtime fit for uploaded mockups
{
  let src = read('components/product/PreviewFrame.jsx')
  if (!src.includes('fitPhotoBoxesToMockupOpening')) {
    src = src.replace(
      /import \{([^}]+)\} from '\.\.\/\.\.\/utils\/mockupLayout'/,
      (m, inner) => {
        if (inner.includes('fitPhotoBoxesToMockupOpening')) return m
        return `import { ${inner.trim().replace(/,$/, '')}, fitPhotoBoxesToMockupOpening } from '../../utils/mockupLayout'`
      },
    )
  }

  if (!src.includes('expandRatio: boxes.length > 1')) {
    const re =
      /const photoBoxesList = useMemo\(\s*\(\) => resolve\w+PhotoBoxes\(product, variant, options\),\s*\[product, variant, options\],\s*\)/
    const replacement = `const photoBoxesList = useMemo(() => {
    const boxes = resolvePreviewPhotoBoxes(product, variant, options)
    const uploaded = resolveUploadedFrameImage(product)
    if (!uploaded || !boxes?.length) return boxes
    const mockupCanvas = product?.mockup?.canvas || { width: 1000, height: 1000 }
    const shape = String(options?.shape || product?.defaultOptions?.shape || '').toLowerCase()
    const circular = boxes.length === 1 && (shape.includes('circle') || shape.includes('round'))
    return fitPhotoBoxesToMockupOpening(boxes, mockupCanvas, {
      circular,
      expandRatio: boxes.length > 1 ? 0.03 : 0.07,
    })
  }, [product, variant, options])`

    if (re.test(src)) {
      // Keep the actual resolve* function name from the file
      const callName = (src.match(/const photoBoxesList = useMemo\(\s*\(\) => (resolve\w+PhotoBoxes)\(/) || [])[1]
      const finalReplacement = replacement.replace('resolvePreviewPhotoBoxes', callName || 'resolvePreviewPhotoBoxes')
      src = src.replace(re, finalReplacement)
      console.log('HIT PreviewFrame photoBoxesList', callName)
    } else {
      const i = src.indexOf('photoBoxesList = useMemo')
      console.log('MISS PreviewFrame photoBoxesList', JSON.stringify(src.slice(Math.max(0, i), i + 200)))
    }
  }
  write('components/product/PreviewFrame.jsx', src)
}

// 3) collage layouts — fill mockup opening better + borderRadius consistency
{
  let src = read('utils/wallWatchCollageLayouts.js')
  // Ensure property is borderRadius (canonical in this codebase)
  // If file incorrectly used a different key for radius on boxes, normalize push()
  src = src.replace(
    /borderRadius,/g,
    'borderRadius,',
  )

  if (!src.includes('Expand window slightly')) {
    const oldFnStart = src.indexOf('export function insetCollageBoxesInWindow')
    if (oldFnStart < 0) {
      console.log('MISS insetCollageBoxesInWindow')
    } else {
      const oldFn = `export function insetCollageBoxesInWindow(count, windowBox, canvas = DEFAULT_CANVAS) {
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
}`

      const newFn = `export function insetCollageBoxesInWindow(count, windowBox, canvas = DEFAULT_CANVAS) {
  if (!windowBox || !(Number(windowBox.width) > 0) || !(Number(windowBox.height) > 0)) {
    return buildCollagePhotoBoxes(count, canvas)
  }
  // Expand window slightly under the frame bezel so collage fills the mockup opening
  const expand = Math.max(6, Math.round(Math.min(windowBox.width, windowBox.height) * 0.03))
  const opened = {
    x: Number(windowBox.x) - expand / 2,
    y: Number(windowBox.y) - expand / 2,
    width: Number(windowBox.width) + expand,
    height: Number(windowBox.height) + expand,
    borderRadius: Number(windowBox.borderRadius) || 0,
  }
  const pad = Math.max(3, Math.round(Math.min(opened.width, opened.height) * 0.01))
  const inner = {
    width: Math.max(40, Number(opened.width) - pad * 2),
    height: Math.max(40, Number(opened.height) - pad * 2),
  }
  const local = buildCollagePhotoBoxes(count, inner)
  const radius = Number(opened.borderRadius) || 0
  const circular = radius >= Math.min(opened.width, opened.height) * 0.45

  return local.map((box) => ({
    ...box,
    x: Math.round(Number(opened.x) + pad + box.x),
    y: Math.round(Number(opened.y) + pad + box.y),
    borderRadius: circular ? Math.round(Math.min(box.width, box.height) / 2) : box.borderRadius,
  }))
}`

      // Normalize CRLF for replace
      const norm = src.replace(/\r\n/g, '\n')
      if (norm.includes(oldFn.replace(/\r\n/g, '\n'))) {
        src = norm.replace(oldFn.replace(/\r\n/g, '\n'), newFn)
        if (fs.readFileSync(path.join(root, 'utils/wallWatchCollageLayouts.js'), 'utf8').includes('\r\n')) {
          src = src.replace(/\n/g, '\r\n')
        }
        console.log('HIT collage inset rewrite')
      } else {
        // Fuzzy: replace from export function to next export or EOF
        const re = /export function insetCollageBoxesInWindow\([\s\S]*?\n\}/
        if (re.test(norm)) {
          src = norm.replace(re, newFn)
          console.log('HIT collage inset fuzzy rewrite')
        } else {
          console.log('MISS collage inset body')
        }
      }
    }
  }
  write('utils/wallWatchCollageLayouts.js', src)
}

// 4) Ensure resolveMockupLayout also fits boxes under opening when single circular-ish
{
  let src = read('utils/mockupLayout.js')
  if (!src.includes('fitPhotoBoxesToMockupOpening(scaledBoxes') && src.includes('const scaledBoxes = scalePhotoBoxes')) {
    src = src.replace(
      'const scaledBoxes = scalePhotoBoxes(boxes, sourceCanvas, frameCanvas)',
      `const scaledBoxes = fitPhotoBoxesToMockupOpening(
      scalePhotoBoxes(boxes, sourceCanvas, frameCanvas),
      frameCanvas,
      { expandRatio: boxes.length > 1 ? 0.025 : 0.06 },
    )`,
    )
    console.log('HIT resolveMockupLayout fit')
    write('utils/mockupLayout.js', src)
  } else {
    console.log('SKIP resolveMockupLayout fit', src.includes('fitPhotoBoxesToMockupOpening(scaledBoxes'))
  }
}

console.log('ALL DONE')
