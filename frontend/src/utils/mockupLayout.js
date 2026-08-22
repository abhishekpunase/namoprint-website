import { parseSvgDimensions } from './mockupAnalyzer'
import { resolveMediaUrl } from './mediaUrl'

const frameDimensionCache = new Map()

export function loadImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width || 1000,
        height: img.naturalHeight || img.height || 1000,
      })
    }
    img.onerror = () => reject(new Error('Could not read frame dimensions'))
    img.src = resolveMediaUrl(url)
  })
}

/** Authoritative frame size — SVG viewBox (not browser naturalWidth which can differ). */
export async function getFrameDimensions(url) {
  const resolved = resolveMediaUrl(url)
  if (!resolved) return { width: 1000, height: 1000 }

  const cached = frameDimensionCache.get(resolved)
  if (cached) return cached

  const pending = (async () => {
    const isSvg = resolved.toLowerCase().includes('.svg')
    if (isSvg) {
      try {
        const res = await fetch(resolved)
        if (!res.ok) throw new Error(`Frame SVG ${res.status}`)
        const svgText = await res.text()
        return parseSvgDimensions(svgText)
      } catch {
        /* fall through to raster probe */
      }
    }

    return loadImageDimensions(resolved)
  })()

  frameDimensionCache.set(resolved, pending)
  try {
    const dims = await pending
    frameDimensionCache.set(resolved, dims)
    return dims
  } catch (error) {
    frameDimensionCache.delete(resolved)
    throw error
  }
}

export function scalePhotoBox(box, sourceCanvas, targetCanvas) {
  if (!box) return box
  const sw = Number(sourceCanvas?.width) || Number(targetCanvas?.width) || 1
  const sh = Number(sourceCanvas?.height) || Number(targetCanvas?.height) || 1
  const tw = Number(targetCanvas?.width) || sw
  const th = Number(targetCanvas?.height) || sh
  const sx = tw / sw
  const sy = th / sh
  const scaleRadius = Math.min(sx, sy)

  return {
    ...box,
    x: (Number(box.x) || 0) * sx,
    y: (Number(box.y) || 0) * sy,
    width: (Number(box.width) || 0) * sx,
    height: (Number(box.height) || 0) * sy,
    borderRadius: box.borderRadius ? Number(box.borderRadius) * scaleRadius : box.borderRadius,
    rotate: box.rotate || 0,
  }
}

export function scalePhotoBoxes(boxes = [], sourceCanvas, targetCanvas) {
  return boxes.map((box) => scalePhotoBox(box, sourceCanvas, targetCanvas))
}

/** Where object-contain draws the frame inside a canvas-aspect stage (% of stage). */
export function getObjectContainFit(stageCanvas, frameCanvas) {
  const sw = Number(stageCanvas?.width) || 1
  const sh = Number(stageCanvas?.height) || 1
  const fw = Number(frameCanvas?.width) || sw
  const fh = Number(frameCanvas?.height) || sh
  const stageAspect = sw / sh
  const frameAspect = fw / fh

  if (Math.abs(stageAspect - frameAspect) < 0.002) {
    return { left: 0, top: 0, width: 100, height: 100 }
  }

  if (frameAspect > stageAspect) {
    const heightPct = (stageAspect / frameAspect) * 100
    return { left: 0, top: (100 - heightPct) / 2, width: 100, height: heightPct }
  }

  const widthPct = (frameAspect / stageAspect) * 100
  return { left: (100 - widthPct) / 2, top: 0, width: widthPct, height: 100 }
}

/**
 * Grow photo slots so they fill the mockup opening and tuck slightly under the frame bezel.
 * Prevents white crescent gaps (common on circular gold/black frames).
 */
export function fitPhotoBoxesToMockupOpening(boxes = [], canvas = { width: 1000, height: 1000 }, options = {}) {
  const list = Array.isArray(boxes) ? boxes.filter((b) => b && Number(b.width) > 0 && Number(b.height) > 0) : []
  if (!list.length) return list

  const cw = Number(canvas?.width) || 1000
  const ch = Number(canvas?.height) || 1000
  const expandRatio = Number(options.expandRatio)
  const grow = Number.isFinite(expandRatio) ? expandRatio : list.length > 1 ? 0.02 : 0.055
  const forceCircular = Boolean(options.circular)

  return list.map((box) => {
    let x = Number(box.x) || 0
    let y = Number(box.y) || 0
    let width = Number(box.width) || 0
    let height = Number(box.height) || 0
    let borderRadius = Number(box.borderRadius) || 0

    const growX = width * grow
    const growY = height * grow
    x = x - growX / 2
    y = y - growY / 2
    width = width + growX
    height = height + growY

    const nearCircular =
      forceCircular ||
      borderRadius >= Math.min(width, height) * 0.4

    if (nearCircular) {
      // Fill the full circular opening (use max side) so no crescent gap remains under the frame
      const fill = Math.max(width, height)
      const cx = x + width / 2
      const cy = y + height / 2
      x = cx - fill / 2
      y = cy - fill / 2
      width = fill
      height = fill
      borderRadius = fill / 2
    }

    // Clamp to canvas while keeping as much coverage as possible
    if (x < 0) {
      width += x
      x = 0
    }
    if (y < 0) {
      height += y
      y = 0
    }
    if (x + width > cw) width = cw - x
    if (y + height > ch) height = ch - y
    width = Math.max(8, width)
    height = Math.max(8, height)
    if (nearCircular) {
      // Prefer covering the opening: use max side when both still fit; otherwise min after clamp
      let fill = Math.max(width, height)
      if (x + fill > cw || y + fill > ch) fill = Math.min(width, height)
      const cx = Math.min(cw - fill / 2, Math.max(fill / 2, x + width / 2))
      const cy = Math.min(ch - fill / 2, Math.max(fill / 2, y + height / 2))
      x = cx - fill / 2
      y = cy - fill / 2
      width = fill
      height = fill
      borderRadius = fill / 2
    }

    return {
      ...box,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
      borderRadius: Math.round(borderRadius),
    }
  })
}

/** Align photo slots with object-contain frame rendering (matches admin MockupEditor). */
export async function resolveMockupLayout(frameImage, mockupCanvas, photoBoxes) {
  const boxes = photoBoxes?.length ? photoBoxes : []
  const sourceCanvas = mockupCanvas?.width
    ? mockupCanvas
    : { width: 1000, height: 1000 }

  if (!frameImage) {
    const fit = getObjectContainFit(sourceCanvas, sourceCanvas)
    return { canvas: sourceCanvas, photoBoxes: boxes, frameCanvas: sourceCanvas, fit }
  }

  try {
    const frameCanvas = await getFrameDimensions(frameImage)
    // Keep slots in the same pixel space as the frame image so object-contain overlay aligns 1:1
    // Scale only here — opening fill is applied once in PreviewFrame / enrichProductMockup
    const scaledBoxes = scalePhotoBoxes(boxes, sourceCanvas, frameCanvas)
    const fit = getObjectContainFit(frameCanvas, frameCanvas)
    return {
      canvas: frameCanvas,
      frameCanvas,
      photoBoxes: scaledBoxes,
      fit,
    }
  } catch {
    const fit = getObjectContainFit(sourceCanvas, sourceCanvas)
    return { canvas: sourceCanvas, frameCanvas: sourceCanvas, photoBoxes: boxes, fit }
  }
}

export function photoBoxToStyle(box, canvas, options = {}) {
  const cw = Number(canvas?.width) || 1
  const ch = Number(canvas?.height) || 1
  const radius = Number(box.borderRadius) || 0

  const style = {
    position: 'absolute',
    left: `${((Number(box.x) || 0) / cw) * 100}%`,
    top: `${((Number(box.y) || 0) / ch) * 100}%`,
    width: `${((Number(box.width) || 0) / cw) * 100}%`,
    height: `${((Number(box.height) || 0) / ch) * 100}%`,
    borderRadius: radius ? `${radius}px` : undefined,
    transform: box.rotate ? `rotate(${box.rotate}deg)` : undefined,
    transformOrigin: 'center center',
    overflow: 'hidden',
    isolation: 'isolate',
    contain: 'paint',
    background: options.transparent ? 'transparent' : '#f3f4f6',
    ...(box.clipPath ? { clipPath: box.clipPath, WebkitClipPath: box.clipPath } : {}),
  }

  return applyObjectContainFit(style, options.fit)
}

/** Map canvas-percent slot coords into the letterboxed object-contain frame area */
export function applyObjectContainFit(style, fit) {
  if (!fit || (fit.left === 0 && fit.top === 0 && fit.width === 100 && fit.height === 100)) {
    return style
  }

  const leftPct = parseFloat(style.left) || 0
  const topPct = parseFloat(style.top) || 0
  const widthPct = parseFloat(style.width) || 0
  const heightPct = parseFloat(style.height) || 0

  return {
    ...style,
    left: `${fit.left + (leftPct / 100) * fit.width}%`,
    top: `${fit.top + (topPct / 100) * fit.height}%`,
    width: `${(widthPct / 100) * fit.width}%`,
    height: `${(heightPct / 100) * fit.height}%`,
  }
}

/** Pixel equivalent of applyObjectContainFit — used when drawing the cart/admin JPEG. */
export function applyFitToPhotoBoxes(boxes = [], canvas, fit) {
  if (!Array.isArray(boxes) || !boxes.length) return boxes
  if (!fit || (fit.left === 0 && fit.top === 0 && fit.width === 100 && fit.height === 100)) {
    return boxes
  }

  const cw = Number(canvas?.width) || 1
  const ch = Number(canvas?.height) || 1
  const originX = (Number(fit.left) / 100) * cw
  const originY = (Number(fit.top) / 100) * ch
  const scaleX = Number(fit.width) / 100
  const scaleY = Number(fit.height) / 100
  const radiusScale = Math.min(scaleX, scaleY)

  return boxes.map((box) => ({
    ...box,
    x: originX + (Number(box.x) || 0) * scaleX,
    y: originY + (Number(box.y) || 0) * scaleY,
    width: (Number(box.width) || 0) * scaleX,
    height: (Number(box.height) || 0) * scaleY,
    borderRadius: box.borderRadius ? Number(box.borderRadius) * radiusScale : box.borderRadius,
  }))
}
