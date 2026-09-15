import { resolveMediaUrl } from './mediaUrl'

const ALPHA_WINDOW = 128
const CLIP_MIN_FILL = 0.12
const CLIP_MAX_FILL = 0.995
const CLIP_RAY_STEPS = 180
const clipPathCache = new Map()
const silhouetteMaskCache = new Map()
const openingMaskCache = new Map()

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load frame image'))
    img.src = url
  })
}

/** SVG/PNG/WebP frames usually already have transparent photo windows — don't rasterize/punch */
export function shouldPunchFrameHoles(frameUrl) {
  const url = String(resolveMediaUrl(frameUrl) || frameUrl || '').toLowerCase()
  // Transparent PNG/WebP/SVG frames already have clean openings — punching tears/jagged edges on the bezel
  if (url.includes('.svg')) return false
  if (url.includes('.png')) return false
  if (url.includes('.webp')) return false
  // JPG mockups with white/black placeholders still need holes cut
  return true
}

/**
 * Cut transparent holes in frame overlay where customer photos go.
 * Handles JPG mockups with black placeholder boxes (not just PNG transparency).
 */
export async function punchFrameHoles(frameUrl, photoBoxes = [], canvas = { width: 1000, height: 1000 }) {
  const resolved = resolveMediaUrl(frameUrl)
  if (!resolved || !photoBoxes?.length) return resolved

  const img = await loadImage(resolved)
  const w = img.naturalWidth || Number(canvas.width) || 1000
  const h = img.naturalHeight || Number(canvas.height) || 1000
  const refW = Number(canvas.width) || w
  const refH = Number(canvas.height) || h
  const scaleX = w / refW
  const scaleY = h / refH

  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const ctx = el.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)

  const { data } = ctx.getImageData(0, 0, w, h)
  const pad = 2

  for (const box of photoBoxes) {
    const x0 = Math.max(0, Math.floor((Number(box.x) || 0) * scaleX) + pad)
    const y0 = Math.max(0, Math.floor((Number(box.y) || 0) * scaleY) + pad)
    const x1 = Math.min(w, Math.ceil(((Number(box.x) || 0) + (Number(box.width) || 0)) * scaleX) - pad)
    const y1 = Math.min(h, Math.ceil(((Number(box.y) || 0) + (Number(box.height) || 0)) * scaleY) - pad)

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const sat = Math.max(r, g, b) - Math.min(r, g, b)
        const isDark = r < 75 && g < 75 && b < 75
        const isWhiteCenter = lum >= 200 && sat < 55
        if (a < 140 || isDark || isWhiteCenter) {
          data[i + 3] = 0
        }
      }
    }
  }

  ctx.putImageData(new ImageData(data, w, h), 0, 0)
  return el.toDataURL('image/png')
}

function isCanvasBackgroundPixel(data, w, x, y) {
  const i = (y * w + x) * 4
  const a = data[i + 3]
  if (a < ALPHA_WINDOW) return true
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  // Page / export canvas behind the mockup (not the inner white bezel, which is enclosed)
  return lum >= 236 && sat < 30
}

function floodFillExterior(data, w, h) {
  const exterior = new Uint8Array(w * h)
  const stack = []

  for (let x = 0; x < w; x += 1) {
    if (isCanvasBackgroundPixel(data, w, x, 0)) stack.push(x, 0)
    if (isCanvasBackgroundPixel(data, w, x, h - 1)) stack.push(x, h - 1)
  }
  for (let y = 0; y < h; y += 1) {
    if (isCanvasBackgroundPixel(data, w, 0, y)) stack.push(0, y)
    if (isCanvasBackgroundPixel(data, w, w - 1, y)) stack.push(w - 1, y)
  }

  while (stack.length) {
    const y = stack.pop()
    const x = stack.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const idx = y * w + x
    if (exterior[idx]) continue
    if (!isCanvasBackgroundPixel(data, w, x, y)) continue
    exterior[idx] = 1
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }

  return exterior
}

function dilateMask(mask, w, h, passes, allowed) {
  const cur = new Uint8Array(mask)
  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Uint8Array(cur)
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const idx = y * w + x
        if (cur[idx]) continue
        if (allowed && !allowed[idx]) continue
        if (cur[idx - 1] || cur[idx + 1] || cur[idx - w] || cur[idx + w]) {
          next[idx] = 1
        }
      }
    }
    cur.set(next)
  }
  return cur
}

function maskToDataUrl(mask, w, h) {
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const ctx = el.getContext('2d')
  const image = ctx.createImageData(w, h)
  const out = image.data
  for (let i = 0; i < mask.length; i += 1) {
    const p = i * 4
    const on = mask[i]
    out[p] = 255
    out[p + 1] = 255
    out[p + 2] = 255
    out[p + 3] = on ? 255 : 0
  }
  ctx.putImageData(image, 0, 0)
  return el.toDataURL('image/png')
}

/** CSS mask aligned with object-contain frame overlays. */
export function framePhotoMaskStyle(maskUrl) {
  if (!maskUrl) return {}
  return {
    WebkitMaskImage: `url("${maskUrl}")`,
    maskImage: `url("${maskUrl}")`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskMode: 'alpha',
    maskMode: 'alpha',
  }
}

async function readFrameImageData(frameUrl) {
  const resolved = resolveMediaUrl(frameUrl)
  if (!resolved) return null
  const img = await loadImage(resolved)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  if (!w || !h) return null
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const ctx = el.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)
  return { data: imageData.data, width: imageData.width, height: imageData.height }
}

function buildSilhouetteMask(data, w, h) {
  const exterior = floodFillExterior(data, w, h)
  let exteriorCount = 0
  for (let i = 0; i < exterior.length; i += 1) {
    if (exterior[i]) exteriorCount += 1
  }
  if (exteriorCount < w * h * 0.008) return null

  const inside = new Uint8Array(w * h)
  for (let i = 0; i < inside.length; i += 1) {
    inside[i] = exterior[i] ? 0 : 1
  }
  // Pull the silhouette 1px off the outer edge so photo cannot paint past the bezel.
  const allowed = inside
  const erodedExterior = dilateMask(exterior, w, h, 1, allowed)
  const clipped = new Uint8Array(w * h)
  for (let i = 0; i < clipped.length; i += 1) {
    clipped[i] = erodedExterior[i] ? 0 : 1
  }
  return maskToDataUrl(clipped, w, h)
}

function buildOpeningMask(data, w, h) {
  const exterior = floodFillExterior(data, w, h)
  const allowed = new Uint8Array(w * h)
  const opening = new Uint8Array(w * h)
  let openingCount = 0
  let interiorCount = 0

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x
      if (exterior[idx]) continue
      allowed[idx] = 1
      interiorCount += 1
      if (isPhotoWindowPixel(data, w, x, y)) {
        opening[idx] = 1
        openingCount += 1
      }
    }
  }

  if (interiorCount < w * h * 0.008) return null

  // Enclosed hole in the PNG — this is the exact custom frame shape.
  // If the mockup has no hole (solid JPG), fall back to the full silhouette.
  const source = openingCount >= interiorCount * 0.04 && openingCount >= w * h * 0.01
    ? opening
    : allowed

  // Tuck 2px under the bezel, never into the canvas around the frame.
  const dilated = dilateMask(source, w, h, 2, allowed)
  return maskToDataUrl(dilated, w, h)
}

/**
 * Mask of the mockup silhouette: opaque inside the frame (opening + bezel),
 * transparent in the canvas around it. Photos cannot paint outside the frame.
 */
export async function createFrameSilhouetteMask(frameUrl) {
  const resolved = resolveMediaUrl(frameUrl)
  if (!resolved) return ''

  if (silhouetteMaskCache.has(resolved)) return silhouetteMaskCache.get(resolved)

  const pending = (async () => {
    const frame = await readFrameImageData(resolved)
    if (!frame) return ''
    return buildSilhouetteMask(frame.data, frame.width, frame.height) || ''
  })()

  silhouetteMaskCache.set(resolved, pending)
  try {
    const url = await pending
    silhouetteMaskCache.set(resolved, url)
    return url
  } catch {
    silhouetteMaskCache.delete(resolved)
    return ''
  }
}

/**
 * Pixel-perfect photo window: only pixels inside the irregular opening.
 * Exterior canvas around a blob/heart/pebble stays fully hidden.
 */
export async function createFrameOpeningMask(frameUrl) {
  const resolved = resolveMediaUrl(frameUrl)
  if (!resolved) return ''

  if (openingMaskCache.has(resolved)) return openingMaskCache.get(resolved)

  const pending = (async () => {
    const frame = await readFrameImageData(resolved)
    if (!frame) return ''
    return (
      buildOpeningMask(frame.data, frame.width, frame.height) ||
      buildSilhouetteMask(frame.data, frame.width, frame.height) ||
      ''
    )
  })()

  openingMaskCache.set(resolved, pending)
  try {
    const url = await pending
    openingMaskCache.set(resolved, url)
    return url
  } catch {
    openingMaskCache.delete(resolved)
    return ''
  }
}

function isTransparentWindow(data, canvasW, x, y) {
  const i = (y * canvasW + x) * 4
  return data[i + 3] < ALPHA_WINDOW
}

function isLightBlankWindow(data, canvasW, x, y) {
  const i = (y * canvasW + x) * 4
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const a = data[i + 3]
  if (a < ALPHA_WINDOW) return false

  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  if (lum < 155) return false

  const maxC = Math.max(r, g, b)
  const minC = Math.min(r, g, b)
  const sat = maxC - minC

  if (lum >= 220 && sat < 55) return true
  if (lum >= 165 && sat < 120 && g >= r - 12 && g >= b - 12) return true
  return lum >= 248 && sat < 28
}

function isPhotoWindowPixel(data, canvasW, x, y) {
  return isTransparentWindow(data, canvasW, x, y) || isLightBlankWindow(data, canvasW, x, y)
}

function findWindowCentroid(data, canvasW, x0, y0, x1, y1) {
  let sumX = 0
  let sumY = 0
  let count = 0

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      if (isPhotoWindowPixel(data, canvasW, x, y)) {
        sumX += x
        sumY += y
        count += 1
      }
    }
  }

  if (!count) return null
  return { x: sumX / count, y: sumY / count }
}

/** Main photo window only — excludes corner gaps outside an organic frame outline. */
function buildConnectedWindowMask(data, canvasW, x0, y0, x1, y1, seedX, seedY) {
  const bw = x1 - x0
  const bh = y1 - y0
  const mask = new Uint8Array(bw * bh)
  if (!isPhotoWindowPixel(data, canvasW, seedX, seedY)) return mask

  const stack = [[seedX, seedY]]
  const visited = new Uint8Array(bw * bh)

  while (stack.length) {
    const [x, y] = stack.pop()
    if (x < x0 || y < y0 || x >= x1 || y >= y1) continue

    const local = (y - y0) * bw + (x - x0)
    if (visited[local]) continue
    if (!isPhotoWindowPixel(data, canvasW, x, y)) continue

    visited[local] = 1
    mask[local] = 1
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  return mask
}

function maskPixel(mask, bw, x, y, x0, y0, x1, y1) {
  if (x < x0 || y < y0 || x >= x1 || y >= y1) return false
  return mask[(y - y0) * bw + (x - x0)] === 1
}

function findWindowSeed(data, canvasW, x0, y0, x1, y1, preferred) {
  const candidates = []
  if (preferred) candidates.push([Math.round(preferred.x), Math.round(preferred.y)])
  candidates.push([Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2)])

  for (const [sx, sy] of candidates) {
    if (sx >= x0 && sy >= y0 && sx < x1 && sy < y1 && isPhotoWindowPixel(data, canvasW, sx, sy)) {
      return { x: sx, y: sy }
    }
  }

  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      if (isPhotoWindowPixel(data, canvasW, x, y)) return { x, y }
    }
  }
  return null
}

/** Trace the photo window outline when the slot bbox is non-rectangular (pebble, heart, etc.). */
export function inferSlotClipPathFromPixels(data, canvasW, canvasH, box) {
  const x0 = Math.max(0, Math.floor(Number(box.x) || 0))
  const y0 = Math.max(0, Math.floor(Number(box.y) || 0))
  const x1 = Math.min(canvasW, Math.ceil((Number(box.x) || 0) + (Number(box.width) || 0)))
  const y1 = Math.min(canvasH, Math.ceil((Number(box.y) || 0) + (Number(box.height) || 0)))
  const bw = x1 - x0
  const bh = y1 - y0
  if (bw < 12 || bh < 12) return null

  const centroid = findWindowCentroid(data, canvasW, x0, y0, x1, y1)
  const seed = findWindowSeed(data, canvasW, x0, y0, x1, y1, centroid)
  if (!seed) return null

  const seedX = seed.x
  const seedY = seed.y
  const windowMask = buildConnectedWindowMask(data, canvasW, x0, y0, x1, y1, seedX, seedY)

  let windowCount = 0
  for (let i = 0; i < windowMask.length; i += 1) {
    if (windowMask[i]) windowCount += 1
  }

  const fillRatio = windowCount / (bw * bh)
  if (fillRatio < CLIP_MIN_FILL) return null

  return clipPathFromWindowMask(windowMask, canvasW, x0, y0, x1, y1, seedX, seedY, fillRatio)
}

function isNearlyRectangularPolygon(points) {
  if (points.length < 8) return true
  let onEdge = 0
  for (const [px, py] of points) {
    if (px <= 3 || px >= 97 || py <= 3 || py >= 97) onEdge += 1
  }
  return onEdge / points.length >= 0.82
}

function clipPathFromWindowMask(windowMask, canvasW, x0, y0, x1, y1, seedX, seedY, fillRatio = 0) {
  const bw = x1 - x0
  const bh = y1 - y0
  if (bw < 12 || bh < 12) return null

  const points = []
  const maxR = Math.ceil(Math.hypot(bw, bh) / 2) + 4

  for (let i = 0; i < CLIP_RAY_STEPS; i += 1) {
    const angle = (i / CLIP_RAY_STEPS) * Math.PI * 2
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    let edgeX = seedX
    let edgeY = seedY

    for (let r = 1; r <= maxR; r += 1) {
      const x = Math.round(seedX + dx * r)
      const y = Math.round(seedY + dy * r)
      if (x < x0 || y < y0 || x >= x1 || y >= y1) break
      if (!maskPixel(windowMask, bw, x, y, x0, y0, x1, y1)) {
        edgeX = Math.round(seedX + dx * (r - 1))
        edgeY = Math.round(seedY + dy * (r - 1))
        break
      }
      edgeX = x
      edgeY = y
    }

    points.push([((edgeX - x0) / bw) * 100, ((edgeY - y0) / bh) * 100])
  }

  if (points.length < 8) return null
  if (fillRatio >= CLIP_MAX_FILL && isNearlyRectangularPolygon(points)) return null
  if (isNearlyRectangularPolygon(points) && fillRatio >= 0.9) return null

  // Keep the traced opening. Dilation already tucks the photo under the bezel.
  const pct = points
    .map(([px, py]) => {
      const nx = Math.min(100, Math.max(0, px))
      const ny = Math.min(100, Math.max(0, py))
      return `${nx.toFixed(1)}% ${ny.toFixed(1)}%`
    })
    .join(', ')

  return `polygon(${pct})`
}

/**
 * Enclosed photo windows from a mockup PNG: interior hole (and inner white
 * bezel), never the canvas around the frame. Boxes include an organic clipPath.
 */
export function detectEnclosedPhotoWindows(data, w, h) {
  if (!data?.length || !w || !h) return []

  const exterior = floodFillExterior(data, w, h)
  const opening = new Uint8Array(w * h)
  const allowed = new Uint8Array(w * h)
  let openingCount = 0

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x
      if (exterior[idx]) continue
      allowed[idx] = 1
      if (isPhotoWindowPixel(data, w, x, y)) {
        opening[idx] = 1
        openingCount += 1
      }
    }
  }

  if (openingCount < w * h * 0.008) return []

  const dilatePasses = Math.max(3, Math.round(Math.min(w, h) * 0.01))
  const dilated = dilateMask(opening, w, h, dilatePasses, allowed)

  const visited = new Uint8Array(w * h)
  const boxes = []
  const minPixels = Math.max(280, Math.round(w * h * 0.012))

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const start = y * w + x
      if (visited[start] || !dilated[start]) continue

      let minX = x
      let maxX = x
      let minY = y
      let maxY = y
      let count = 0
      let sumX = 0
      let sumY = 0
      let touchesBorder = false
      const stack = [x, y]

      while (stack.length) {
        const cy = stack.pop()
        const cx = stack.pop()
        if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue
        const idx = cy * w + cx
        if (visited[idx] || !dilated[idx]) continue
        visited[idx] = 1
        count += 1
        sumX += cx
        sumY += cy
        minX = Math.min(minX, cx)
        maxX = Math.max(maxX, cx)
        minY = Math.min(minY, cy)
        maxY = Math.max(maxY, cy)
        if (cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1) touchesBorder = true
        stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1)
      }

      if (count < minPixels || touchesBorder) continue

      const width = maxX - minX + 1
      const height = maxY - minY + 1
      const coverage = (width * height) / (w * h)
      const fillRatio = count / Math.max(1, width * height)
      if (coverage > 0.96) continue
      if (coverage > 0.72 && fillRatio < 0.42) continue

      const localMask = new Uint8Array(width * height)
      for (let py = minY; py <= maxY; py += 1) {
        for (let px = minX; px <= maxX; px += 1) {
          if (dilated[py * w + px]) localMask[(py - minY) * width + (px - minX)] = 1
        }
      }

      const seedX = Math.round(sumX / count)
      const seedY = Math.round(sumY / count)
      const clipPath = clipPathFromWindowMask(
        localMask,
        width,
        0,
        0,
        width,
        height,
        seedX - minX,
        seedY - minY,
        fillRatio,
      )

      boxes.push({
        x: minX,
        y: minY,
        width,
        height,
        rotate: 0,
        borderRadius: 0,
        fillRatio,
        slotShape: clipPath ? 'organic' : 'rect',
        ...(clipPath ? { clipPath } : {}),
      })
    }
  }

  return boxes.sort((a, b) => b.width * b.height - a.width * a.height)
}

async function readFramePixels(frameUrl, canvas) {
  const resolved = resolveMediaUrl(frameUrl)
  const img = await loadImage(resolved)
  const refW = Number(canvas?.width) || img.naturalWidth || 1000
  const refH = Number(canvas?.height) || img.naturalHeight || 1000
  const el = document.createElement('canvas')
  el.width = refW
  el.height = refH
  const ctx = el.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, refW, refH)
  return ctx.getImageData(0, 0, refW, refH)
}

/** Add clipPath to photo slots that follow irregular frame windows (pebble, organic shapes). */
export async function inferSlotClipPathsFromFrame(frameUrl, photoBoxes = [], canvas = { width: 1000, height: 1000 }) {
  if (!frameUrl || !photoBoxes?.length) return photoBoxes

  const cacheKey = `${resolveMediaUrl(frameUrl)}|${canvas.width}x${canvas.height}|${photoBoxes
    .map((b) => `${b.x},${b.y},${b.width},${b.height}`)
    .join(';')}`
  if (clipPathCache.has(cacheKey)) return clipPathCache.get(cacheKey)

  try {
    const { data, width, height } = await readFramePixels(frameUrl, canvas)
    const enhanced = photoBoxes.map((box) => {
      const clipPath = inferSlotClipPathFromPixels(data, width, height, box)
      return clipPath ? { ...box, borderRadius: 0, clipPath } : box
    })
    clipPathCache.set(cacheKey, enhanced)
    return enhanced
  } catch {
    return photoBoxes
  }
}

/**
 * Prepare frame overlay for cart/order export — clears entire photo slot rects
 * so customer photos show through even when the template JPG has sample images inside.
 */
export async function prepareFrameOverlayForExport(frameUrl, photoBoxes = [], canvas = { width: 1000, height: 1000 }) {
  const resolved = resolveMediaUrl(frameUrl)
  if (!resolved || !photoBoxes?.length) return resolved

  if (!shouldPunchFrameHoles(frameUrl)) {
    return resolved
  }

  const img = await loadImage(resolved)
  const w = img.naturalWidth || Number(canvas.width) || 1000
  const h = img.naturalHeight || Number(canvas.height) || 1000
  const refW = Number(canvas.width) || w
  const refH = Number(canvas.height) || h
  const scaleX = w / refW
  const scaleY = h / refH

  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const ctx = el.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)

  const { data } = ctx.getImageData(0, 0, w, h)
  const pad = 1

  for (const box of photoBoxes) {
    const x0 = Math.max(0, Math.floor((Number(box.x) || 0) * scaleX) + pad)
    const y0 = Math.max(0, Math.floor((Number(box.y) || 0) * scaleY) + pad)
    const x1 = Math.min(w, Math.ceil(((Number(box.x) || 0) + (Number(box.width) || 0)) * scaleX) - pad)
    const y1 = Math.min(h, Math.ceil(((Number(box.y) || 0) + (Number(box.height) || 0)) * scaleY) - pad)

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4
        data[i + 3] = 0
      }
    }
  }

  ctx.putImageData(new ImageData(data, w, h), 0, 0)
  return el.toDataURL('image/png')
}
