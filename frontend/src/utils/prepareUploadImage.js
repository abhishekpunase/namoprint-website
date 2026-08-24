const PRINT_MAX_EDGE = 3600
const PRINT_MAX_BYTES = 8 * 1024 * 1024
const PROXY_SAFE_MAX_EDGE = 2000
const PROXY_SAFE_MAX_BYTES = 900 * 1024

function blobToFile(blob, original, nameSuffix = '') {
  const baseName = String(original.name || 'photo').replace(/\.[^.]+$/, '')
  const ext = blob.type === 'image/png' ? 'png' : 'jpg'
  return new File([blob], `${baseName}${nameSuffix}.${ext}`, {
    type: blob.type,
    lastModified: Date.now(),
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not compress this image'))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}

function sampleHasAlpha(ctx, width, height) {
  const sw = Math.min(width, 80)
  const sh = Math.min(height, 80)
  const { data } = ctx.getImageData(0, 0, sw, sh)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true
  }
  return false
}

async function renderToCanvas(file, maxEdge) {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: true })
    ctx.drawImage(bitmap, 0, 0, width, height)
    return { canvas, ctx, width, height, scale }
  } finally {
    bitmap.close?.()
  }
}

/**
 * Downscale / compress a photo before multipart upload so reverse proxies
 * (nginx default 1MB) and Express/multer limits do not return 413.
 */
export async function prepareUploadImage(file, options = {}) {
  const maxBytes = options.maxBytes ?? PRINT_MAX_BYTES
  const maxEdge = options.maxEdge ?? PRINT_MAX_EDGE

  if (!(file instanceof Blob) || file.type === 'image/svg+xml') return file
  if (file.type && !file.type.startsWith('image/')) return file

  if (file.size <= maxBytes && typeof createImageBitmap !== 'function') {
    return file
  }

  try {
    const { canvas, ctx, width, height, scale } = await renderToCanvas(file, maxEdge)
    const keepPng = file.type === 'image/png' || file.type === 'image/webp'
      ? sampleHasAlpha(ctx, width, height)
      : false

    if (scale === 1 && file.size <= maxBytes && !options.force) {
      return file
    }

    if (keepPng) {
      let blob = await canvasToBlob(canvas, 'image/png')
      if (blob.size > maxBytes && maxEdge > 1200) {
        const tighter = await renderToCanvas(file, Math.round(maxEdge * 0.7))
        blob = await canvasToBlob(tighter.canvas, 'image/png')
      }
      return blob.size < file.size ? blobToFile(blob, file) : file
    }

    let quality = 0.86
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    while (blob.size > maxBytes && quality > 0.62) {
      quality -= 0.08
      blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    }

    if (blob.size > maxBytes && maxEdge > 1400) {
      const tighter = await renderToCanvas(file, Math.round(maxEdge * 0.72))
      blob = await canvasToBlob(tighter.canvas, 'image/jpeg', 0.78)
    }

    return blob.size < file.size || file.size > maxBytes ? blobToFile(blob, file) : file
  } catch {
    return file
  }
}

export function prepareProxySafeUploadImage(file) {
  return prepareUploadImage(file, {
    maxBytes: PROXY_SAFE_MAX_BYTES,
    maxEdge: PROXY_SAFE_MAX_EDGE,
    force: true,
  })
}
