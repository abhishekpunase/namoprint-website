const fs = require('fs')
const path = require('path')
const file = path.join(__dirname, '..', 'src', 'pages', 'admin', 'AdminWallWatchProductsPage.jsx')
let src = fs.readFileSync(file, 'utf8')

// 1) imports
if (!src.includes("MockupEditor")) {
  src = src.replace(
    "import { useEffect, useState } from 'react'",
    "import { useEffect, useMemo, useState } from 'react'",
  )
  src = src.replace(
    "import { ProductSeoFields } from '../../components/admin/products/ProductSeoFields'",
    "import { MockupEditor } from '../../components/admin/MockupEditor'\nimport { ProductSeoFields } from '../../components/admin/products/ProductSeoFields'",
  )
}

// 2) emptyForm fields
if (!src.includes('canvasWidth:')) {
  src = src.replace(
    `  frameImage: '',
  variants: [emptyVariant('Circle')],`,
    `  frameImage: '',
  canvasWidth: '1000',
  canvasHeight: '1000',
  photoBox: { x: 145, y: 145, width: 710, height: 710, rotate: 0, borderRadius: 355 },
  photoBoxes: [],
  multiSlot: false,
  variants: [emptyVariant('Circle')],`,
  )
}

// 3) mockupValue + handlers after uploading state
if (!src.includes('mockupEditorValue')) {
  const anchor = '  const [saving, setSaving] = useState(false)\n'
  const block = `  const [saving, setSaving] = useState(false)

  const mockupEditorValue = useMemo(
    () => ({
      canvasWidth: String(form.canvasWidth || 1000),
      canvasHeight: String(form.canvasHeight || 1000),
      frameImage: form.frameImage || '',
      photoBox: form.photoBox || { x: 145, y: 145, width: 710, height: 710, rotate: 0, borderRadius: 355 },
      photoBoxes: form.photoBoxes || [],
      multiSlot: Boolean(form.multiSlot || (form.photoBoxes || []).length > 1),
    }),
    [form.canvasWidth, form.canvasHeight, form.frameImage, form.photoBox, form.photoBoxes, form.multiSlot],
  )

  const handleMockupEditorChange = (patch) => {
    setForm((prev) => {
      const next = { ...prev }
      if (patch.canvasWidth != null) next.canvasWidth = String(patch.canvasWidth)
      if (patch.canvasHeight != null) next.canvasHeight = String(patch.canvasHeight)
      if (patch.frameImage != null) next.frameImage = patch.frameImage
      if (patch.photoBox) next.photoBox = patch.photoBox
      if (patch.photoBoxes) next.photoBoxes = patch.photoBoxes
      if (patch.multiSlot != null) next.multiSlot = Boolean(patch.multiSlot)
      return next
    })
  }

  const handleMockupFrameUpload = async (file) => {
    const payload = await api.uploadImage(file)
    const url = payload.asset?.url || payload.asset?.optimizedUrl || ''
    if (url) setForm((prev) => ({ ...prev, frameImage: url }))
    return url
  }

`
  if (src.includes(anchor)) {
    src = src.replace(anchor, block)
    console.log('HIT handlers')
  } else {
    console.log('MISS saving anchor')
  }
}

// 4) load product into form — include mockup slots
if (!src.includes('canvasWidth: String(product.mockup')) {
  src = src.replace(
    `      frameImage: product.mockup?.frameImage || '',
      variants:`,
    `      frameImage: product.mockup?.frameImage || '',
      canvasWidth: String(product.mockup?.canvas?.width || 1000),
      canvasHeight: String(product.mockup?.canvas?.height || 1000),
      photoBox: product.mockup?.photoBox || { x: 145, y: 145, width: 710, height: 710, rotate: 0, borderRadius: 355 },
      photoBoxes: product.mockup?.photoBoxes || [],
      multiSlot: Boolean(product.mockup?.photoBoxes?.length > 1),
      variants:`,
  )
  console.log('HIT edit load')
}

// 5) Replace simple mockup upload UI with MockupEditor section
const oldImagesHint = `              <p className="admin-panel-desc">
                Listing/card image (shown on wall watches page). Optional mockup frame for designer overlay.
              </p>`
const newImagesHint = `              <p className="admin-panel-desc">
                Listing/card image (shown on wall watches page). Use Mockup adjust below (acrylic-style) so photos fit inside the frame opening.
              </p>`
src = src.replace(oldImagesHint, newImagesHint)

// Remove standalone "Mockup frame (optional)" upload button — MockupEditor handles it
src = src.replace(
  /\s*<label className="btn btn-ghost admin-upload-btn">\s*<FiUploadCloud \/> Mockup frame \(optional\)\s*<input type="file" accept="image\/\*" hidden onChange=\{\(e\) => handleImageUpload\(e, 'frameImage'\)\} disabled=\{uploading\} \/>\s*<\/label>/,
  '',
)

// Remove small mockup frame thumb preview block for frameImage only — keep thumbnail
// Replace the dual preview section
const dualPreview = `              {(form.thumbnail || form.frameImage) && (
                <div className="admin-form-cols-2">
                  {form.thumbnail && (
                    <div>
                      <small>Card thumbnail</small>
                      <img src={resolveMediaUrl(form.thumbnail)} alt="" className="admin-image-thumb admin-image-thumb-lg" />
                    </div>
                  )}
                  {form.frameImage && (
                    <div>
                      <small>Mockup frame</small>
                      <img src={resolveMediaUrl(form.frameImage)} alt="" className="admin-image-thumb admin-image-thumb-lg" />
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="admin-form-section admin-seo-section">`
const dualReplacement = `              {form.thumbnail && (
                <div>
                  <small>Card thumbnail</small>
                  <img src={resolveMediaUrl(form.thumbnail)} alt="" className="admin-image-thumb admin-image-thumb-lg" />
                </div>
              )}
            </div>

            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Mockup adjust (like acrylic)</h3>
              <p className="admin-panel-desc">
                Upload the PNG frame, then drag / resize the photo window so the customer photo sits inside the opening — no overlap, no tear on the bezel.
              </p>
              <MockupEditor
                value={mockupEditorValue}
                onChange={handleMockupEditorChange}
                onUploadFrame={handleMockupFrameUpload}
                uploading={uploading}
              />
            </div>

            <div className="admin-form-section admin-seo-section">`

if (src.includes('Mockup frame</small>')) {
  src = src.replace(dualPreview, dualReplacement)
  console.log('HIT mockup editor section')
} else if (!src.includes('Mockup adjust (like acrylic)')) {
  // insert before SEO section
  src = src.replace(
    `<div className="admin-form-section admin-seo-section">
              <h3 className="admin-form-section__title">SEO</h3>`,
    `<div className="admin-form-section">
              <h3 className="admin-form-section__title">Mockup adjust (like acrylic)</h3>
              <p className="admin-panel-desc">
                Upload the PNG frame, then drag / resize the photo window so the customer photo sits inside the opening — no overlap, no tear on the bezel.
              </p>
              <MockupEditor
                value={mockupEditorValue}
                onChange={handleMockupEditorChange}
                onUploadFrame={handleMockupFrameUpload}
                uploading={uploading}
              />
            </div>

            <div className="admin-form-section admin-seo-section">
              <h3 className="admin-form-section__title">SEO</h3>`,
  )
  console.log('HIT mockup editor insert before SEO')
}

// Fix upload API method name if needed — check what wall watch page uses
if (src.includes('api.uploadImage') && !src.includes('uploadImage')) {
  // check existing upload method in file
}
const uploadCall = (src.match(/api\.(upload\w+)\(/) || [])[1]
console.log('existing upload method', uploadCall)
if (uploadCall && src.includes('api.uploadImage') && uploadCall !== 'uploadImage') {
  src = src.replace(/api\.uploadImage\(file\)/g, `api.${uploadCall}(file)`)
  console.log('fixed upload method to', uploadCall)
}

fs.writeFileSync(file, src)
console.log('AdminWallWatchProductsPage patched')
