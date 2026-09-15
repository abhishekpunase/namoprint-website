import {
  clipPathFromPolygonPoints,
  normalizeRectPhotoSlot,
} from './mockupSlotShapes'
import { filterSignificantPhotoBoxes } from '../data/collageFrameMockup'
import { inferSlotClipPathFromPixels } from './frameImageUtils'

const ALPHA_THRESHOLD = 128
/** Minimum transparent pixels inside a slot (scales with image size) */
const MIN_REGION_PIXEL_RATIO = 0.0015
/** Slot bounding box must be at least this fraction of canvas */
const MIN_BBOX_RATIO = 0.008
/** Transparent fill must cover at least this much of the slot bbox */
const MIN_FILL_RATIO = 0.3
const MAX_REGIONS = 24
const MAX_ANALYZE_DIMENSION = 2000

function pixelAt(imageData, width, x, y) {
  const i = (y * width + x) * 4
  return {
    r: imageData[i],
    g: imageData[i + 1],
    b: imageData[i + 2],
    a: imageData[i + 3],
  }
}

function isWhitePlaceholderPixel(imageData, width, x, y) {
  const { r, g, b, a } = pixelAt(imageData, width, x, y)
  if (a < ALPHA_THRESHOLD) return false
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  if (lum >= 228 && sat < 48) return true
  if (lum >= 248 && sat < 28) return true
  return false
}

function isLightGreenPlaceholderPixel(imageData, width, x, y) {
  const { r, g, b, a } = pixelAt(imageData, width, x, y)
  if (a < ALPHA_THRESHOLD) return false
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  if (lum < 168 || lum > 245) return false
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  return sat < 115 && g >= r - 10 && g >= b - 10
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load mockup image'))
    img.src = url
  })
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image file'))
    }
    img.src = url
  })
}

function loadSvgAsImage(svgText) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not rasterize SVG'))
    }
    img.src = url
  })
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read SVG file'))
    reader.readAsText(file)
  })
}

function defaultInsetBox(width, height, insetRatio = 0.12) {
  const insetX = Math.round(width * insetRatio)
  const insetY = Math.round(height * insetRatio)
  return {
    x: insetX,
    y: insetY,
    width: Math.max(1, width - insetX * 2),
    height: Math.max(1, height - insetY * 2),
    rotate: 0,
    borderRadius: 0,
  }
}

/** How far the opening is inset from each bbox corner — rounded-rect / circle radius. */
function estimateRoundedRectRadius(isSlotPixel, minX, minY, maxX, maxY) {
  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const maxR = Math.floor(Math.min(width, height) * 0.49)
  if (maxR < 4) return 0

  const cornerInset = (cx, cy, dirX, dirY) => {
    let alongX = maxR
    let alongY = maxR
    for (let i = 0; i <= maxR; i += 1) {
      if (isSlotPixel(cx + dirX * i, cy)) {
        alongX = i
        break
      }
    }
    for (let i = 0; i <= maxR; i += 1) {
      if (isSlotPixel(cx, cy + dirY * i)) {
        alongY = i
        break
      }
    }
    return Math.round((alongX + alongY) / 2)
  }

  const samples = [
    cornerInset(minX, minY, 1, 1),
    cornerInset(maxX, minY, -1, 1),
    cornerInset(minX, maxY, 1, -1),
    cornerInset(maxX, maxY, -1, -1),
  ].filter((radius) => radius > 2)

  if (samples.length < 2) return 0
  samples.sort((a, b) => a - b)
  const mid = samples[Math.floor(samples.length / 2)]
  return mid < 6 ? 0 : mid
}

function wrapDegrees(deg) {
  let next = Number(deg) || 0
  next = ((next + 180) % 360 + 360) % 360 - 180
  if (next <= -180) next += 360
  return Math.round(next * 10) / 10
}

/** Tilted polaroid / stamp windows — PCA oriented box so CSS rotate matches the opening. */
function fitOrientedSlot(isSlotPixel, minX, minY, maxX, maxY, pixelCount) {
  const bboxW = maxX - minX + 1
  const bboxH = maxY - minY + 1
  const aabb = {
    x: minX,
    y: minY,
    width: bboxW,
    height: bboxH,
    rotate: 0,
    borderRadius: estimateRoundedRectRadius(isSlotPixel, minX, minY, maxX, maxY),
    area: bboxW * bboxH,
    pixelCount,
    fillRatio: pixelCount / Math.max(1, bboxW * bboxH),
  }

  if (bboxW < 18 || bboxH < 18 || pixelCount < 40) return aabb

  const step = Math.max(1, Math.floor(Math.max(bboxW, bboxH) / 140))
  let sumX = 0
  let sumY = 0
  let count = 0
  const xs = []
  const ys = []

  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      if (!isSlotPixel(x, y)) continue
      xs.push(x)
      ys.push(y)
      sumX += x
      sumY += y
      count += 1
    }
  }

  if (count < 24) return aabb

  const cx = sumX / count
  const cy = sumY / count
  let xx = 0
  let yy = 0
  let xy = 0
  for (let i = 0; i < count; i += 1) {
    const dx = xs[i] - cx
    const dy = ys[i] - cy
    xx += dx * dx
    yy += dy * dy
    xy += dx * dy
  }

  const angle = 0.5 * Math.atan2(2 * xy, xx - yy)
  let deg = (angle * 180) / Math.PI
  if (!Number.isFinite(deg)) return aabb
  if (Math.abs(deg) < 2.2) return aabb
  if (Math.abs(Math.abs(deg) - 90) < 2.2) return aabb

  const cos = Math.cos(-angle)
  const sin = Math.sin(-angle)
  let minRX = Infinity
  let maxRX = -Infinity
  let minRY = Infinity
  let maxRY = -Infinity
  for (let i = 0; i < count; i += 1) {
    const dx = xs[i] - cx
    const dy = ys[i] - cy
    const rx = dx * cos - dy * sin
    const ry = dx * sin + dy * cos
    minRX = Math.min(minRX, rx)
    maxRX = Math.max(maxRX, rx)
    minRY = Math.min(minRY, ry)
    maxRY = Math.max(maxRY, ry)
  }

  let obbW = maxRX - minRX
  let obbH = maxRY - minRY
  if (obbW < 8 || obbH < 8) return aabb

  if (Math.abs(deg) > 45) {
    const swap = obbW
    obbW = obbH
    obbH = swap
    deg = deg > 0 ? deg - 90 : deg + 90
  }

  deg = wrapDegrees(deg)
  if (Math.abs(deg) < 2.2) return aabb

  const area = obbW * obbH
  const fillRatio = pixelCount / Math.max(1, area)
  const radiusCap = Math.round(Math.min(obbW, obbH) * 0.08)

  return {
    x: Math.round(cx - obbW / 2),
    y: Math.round(cy - obbH / 2),
    width: Math.round(obbW),
    height: Math.round(obbH),
    rotate: deg,
    borderRadius: Math.min(aabb.borderRadius || 0, Math.max(0, radiusCap)),
    area,
    pixelCount,
    fillRatio,
  }
}

function regionIoU(a, b) {
  const x0 = Math.max(a.x, b.x)
  const y0 = Math.max(a.y, b.y)
  const x1 = Math.min(a.x + a.width, b.x + b.width)
  const y1 = Math.min(a.y + a.height, b.y + b.height)
  if (x1 <= x0 || y1 <= y0) return 0
  const inter = (x1 - x0) * (y1 - y0)
  const union = a.width * a.height + b.width * b.height - inter
  return union > 0 ? inter / union : 0
}

function dedupeRegions(regions, iouThreshold = 0.55) {
  const sorted = [...regions].sort((a, b) => (b.area || b.width * b.height) - (a.area || a.width * a.height))
  const kept = []
  for (const region of sorted) {
    const duplicate = kept.some((entry) => {
      const iou = regionIoU(entry, region)
      if (iou > iouThreshold) return true
      const cx1 = entry.x + entry.width / 2
      const cy1 = entry.y + entry.height / 2
      const cx2 = region.x + region.width / 2
      const cy2 = region.y + region.height / 2
      const dist = Math.hypot(cx1 - cx2, cy1 - cy2)
      const minSide = Math.min(entry.width, entry.height, region.width, region.height)
      return iou > 0.2 && dist < minSide * 0.35
    })
    if (duplicate) continue
    kept.push(region)
  }
  return sortRegionsSpatially(kept)
}

function mergeAllSlotRegions(...lists) {
  return dedupeRegions(lists.flat())
}

/** Light green / white / gray placeholder windows common in collage JPG mockups. */
function findWhiteBlankRegions(imageData, width, height, maxRegions = MAX_REGIONS) {
  const isWhite = (x, y) => isWhitePlaceholderPixel(imageData, width, x, y)
  return findSlotRegions(imageData, width, height, isWhite, maxRegions, 0.15)
}

function findLightGreenBlankRegions(imageData, width, height, maxRegions = MAX_REGIONS) {
  const isGreen = (x, y) => isLightGreenPlaceholderPixel(imageData, width, x, y)
  return findSlotRegions(imageData, width, height, isGreen, maxRegions, 0.2)
}

function findLightBlankRegions(imageData, width, height, maxRegions = MAX_REGIONS) {
  const isLightBlank = (x, y) =>
    isWhitePlaceholderPixel(imageData, width, x, y) ||
    isLightGreenPlaceholderPixel(imageData, width, x, y)

  return findSlotRegions(imageData, width, height, isLightBlank, maxRegions, 0.18)
}

function bboxForSegment(region, imageData, width, height, isSlotPixel, axis, segStart, segEnd) {
  const x0 = axis === 'x' ? region.x + segStart : region.x
  const x1 = axis === 'x' ? region.x + segEnd - 1 : region.x + region.width - 1
  const y0 = axis === 'y' ? region.y + segStart : region.y
  const y1 = axis === 'y' ? region.y + segEnd - 1 : region.y + region.height - 1

  let minX = x1
  let minY = y1
  let maxX = x0
  let maxY = y0
  let count = 0

  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      if (!isSlotPixel(px, py)) continue
      count += 1
      minX = Math.min(minX, px)
      maxX = Math.max(maxX, px)
      minY = Math.min(minY, py)
      maxY = Math.max(maxY, py)
    }
  }

  if (!count) return null

  return fitOrientedSlot(isSlotPixel, minX, minY, maxX, maxY, count)
}

function splitByAxis(region, imageData, width, height, isSlotPixel, axis) {
  const size = axis === 'x' ? region.width : region.height
  if (size < 24) return [region]

  const counts = new Array(size).fill(0)
  for (let dy = 0; dy < region.height; dy += 1) {
    for (let dx = 0; dx < region.width; dx += 1) {
      const px = region.x + dx
      const py = region.y + dy
      if (!isSlotPixel(px, py)) continue
      counts[axis === 'x' ? dx : dy] += 1
    }
  }

  const maxCount = Math.max(...counts, 1)
  const gapThreshold = Math.max(1, maxCount * 0.05)
  const minGap = Math.max(3, Math.round(size * 0.014))

  const segments = []
  let segStart = 0
  let gapStart = -1

  for (let i = 0; i <= size; i += 1) {
    const inGap = i < size ? counts[i] <= gapThreshold : true
    if (inGap && gapStart < 0) gapStart = i
    if (!inGap && gapStart >= 0) {
      if (i - gapStart >= minGap) {
        if (gapStart > segStart) segments.push([segStart, gapStart])
        segStart = i
      }
      gapStart = -1
    }
  }

  if (segStart < size) segments.push([segStart, size])
  if (segments.length <= 1) return [region]

  return segments
    .map(([start, end]) => bboxForSegment(region, imageData, width, height, isSlotPixel, axis, start, end))
    .filter(Boolean)
}

function splitMergedRegion(region, imageData, width, height, isSlotPixel) {
  if (region.fillRatio >= 0.92 && region.width < width * 0.55) return [region]

  const xParts = splitByAxis(region, imageData, width, height, isSlotPixel, 'x')
  if (xParts.length <= 1) {
    const yParts = splitByAxis(region, imageData, width, height, isSlotPixel, 'y')
    return yParts.length > 1 ? yParts : [region]
  }

  return xParts.flatMap((part) => {
    if (part.fillRatio >= 0.9) return [part]
    const yParts = splitByAxis(part, imageData, width, height, isSlotPixel, 'y')
    return yParts.length > 1 ? yParts : [part]
  })
}

function refineSlotRegions(regions, imageData, width, height, isSlotPixel) {
  const refined = []
  for (const region of regions) {
    if (region.fillRatio >= 0.92 && region.width < width * 0.55 && region.height < height * 0.55) {
      refined.push(region)
      continue
    }
    refined.push(...splitMergedRegion(region, imageData, width, height, isSlotPixel))
  }
  return refined
}

function filterAdminDetectedBoxes(boxes, canvasWidth, canvasHeight) {
  const valid = boxes.filter((box) => box && Number(box.width) > 0 && Number(box.height) > 0)
  if (!valid.length) return []

  const canvasArea = canvasWidth * canvasHeight
  const minSide = Math.max(16, Math.round(Math.min(canvasWidth, canvasHeight) * 0.028))
  const minArea = Math.max(640, canvasArea * 0.0018)

  const filtered = valid.filter(
    (box) =>
      Number(box.width) >= minSide &&
      Number(box.height) >= minSide &&
      Number(box.width) * Number(box.height) >= minArea,
  )

  return sortRegionsSpatially(filtered.length ? filtered : valid)
}

function enhanceOrganicClipPaths(boxes, imageData, width, height) {
  if (!imageData?.length) return boxes

  return boxes.map((box) => {
    if (box.clipPath) return box
    if (Math.abs(Number(box.rotate) || 0) >= 2.5) return box
    const fillRatio = Number(box.fillRatio)
    // Nearly filled rectangle — no organic outline needed
    if (Number.isFinite(fillRatio) && fillRatio >= 0.92) return box

    const clipPath = inferSlotClipPathFromPixels(imageData, width, height, box)
    return clipPath ? { ...box, borderRadius: 0, clipPath } : box
  })
}

function sortRegionsSpatially(regions) {
  return [...regions].sort((a, b) => {
    const rowA = Math.floor(a.y / Math.max(a.height, 1))
    const rowB = Math.floor(b.y / Math.max(b.height, 1))
    if (Math.abs(rowA - rowB) > 2) return a.y - b.y
    return a.x - b.x
  })
}

function regionToBox(region) {
  const { area, pixelCount, fillRatio, ...box } = region
  // Do NOT auto-apply hex from fillRatio — circles (~0.785) look hex-like by that metric.
  // Hex clips are applied later only for hex/honeycomb products via finalizePhotoSlots.
  const pad = 1

  const width = Math.max(8, box.width - pad * 2)
  const height = Math.max(8, box.height - pad * 2)
  const tilted = Math.abs(Number(box.rotate) || 0) >= 2.5
  const aspect = width / height
  const circularOpening =
    !tilted &&
    Number(fillRatio) > 0.72 &&
    Number(fillRatio) < 0.84 &&
    aspect > 0.88 &&
    aspect < 1.12
  const organicOpening = !tilted && Number.isFinite(fillRatio) && fillRatio < 0.88 && !circularOpening

  const borderRadius = circularOpening
    ? Math.round(Math.min(width, height) / 2)
    : organicOpening
      ? 0
      : Math.round(Number(box.borderRadius) || 0)

  const raw = {
    x: box.x + pad,
    y: box.y + pad,
    width,
    height,
    rotate: Number(box.rotate) || 0,
    borderRadius,
    fillRatio,
    slotShape: circularOpening ? 'circle' : box.slotShape || 'rect',
    ...(box.clipPath ? { clipPath: box.clipPath } : {}),
  }

  if (raw.clipPath) return raw
  return normalizeRectPhotoSlot(raw)
}

function findSlotRegions(imageData, width, height, isSlotPixel, maxRegions = MAX_REGIONS, minFillRatio = MIN_FILL_RATIO) {
  const visited = new Uint8Array(width * height)
  const regions = []
  const canvasArea = width * height
  const minRegionPixels = Math.max(250, Math.round(canvasArea * MIN_REGION_PIXEL_RATIO))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx] || !isSlotPixel(x, y)) continue

      let minX = x
      let maxX = x
      let minY = y
      let maxY = y
      let count = 0
      const stack = [[x, y]]

      while (stack.length) {
        const [cx, cy] = stack.pop()
        const cidx = cy * width + cx
        if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue
        if (visited[cidx] || !isSlotPixel(cx, cy)) continue
        visited[cidx] = 1
        count++
        minX = Math.min(minX, cx)
        maxX = Math.max(maxX, cx)
        minY = Math.min(minY, cy)
        maxY = Math.max(maxY, cy)
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
      }

      const bboxW = maxX - minX + 1
      const bboxH = maxY - minY + 1
      const bboxArea = bboxW * bboxH
      const fillRatio = count / bboxArea

      if (count < minRegionPixels) continue
      if (bboxArea / canvasArea < MIN_BBOX_RATIO) continue
      if (fillRatio < minFillRatio) continue
      // Thin-border frames have a large inner window — only reject near-full-canvas noise
      if (bboxArea / canvasArea > 0.96) continue

      regions.push(fitOrientedSlot(isSlotPixel, minX, minY, maxX, maxY, count))
    }
  }

  return sortRegionsSpatially(
    regions.sort((a, b) => b.area - a.area).slice(0, maxRegions),
  )
}

function findTransparentRegions(imageData, width, height, maxRegions = MAX_REGIONS) {
  const isTransparent = (x, y) => {
    const i = (y * width + x) * 4
    return imageData[i + 3] < ALPHA_THRESHOLD
  }
  return findSlotRegions(imageData, width, height, isTransparent, maxRegions)
}

/** Black/dark placeholder boxes in collage JPG/PNG (non-transparent). */
function findDarkSlotRegions(imageData, width, height, maxRegions = MAX_REGIONS) {
  const isDarkSlot = (x, y) => {
    const i = (y * width + x) * 4
    const r = imageData[i]
    const g = imageData[i + 1]
    const b = imageData[i + 2]
    const a = imageData[i + 3]
    if (a < ALPHA_THRESHOLD) return false
    return r < 60 && g < 60 && b < 60
  }
  return findSlotRegions(imageData, width, height, isDarkSlot, maxRegions, 0.55)
}

function isBackgroundLikeRegion(region, width, height) {
  if (!region) return true
  const coverage = (region.width * region.height) / Math.max(1, width * height)
  const padX = Math.max(2, Math.round(width * 0.012))
  const padY = Math.max(2, Math.round(height * 0.012))
  const edges = [
    region.x <= padX,
    region.y <= padY,
    region.x + region.width >= width - padX,
    region.y + region.height >= height - padY,
  ].filter(Boolean).length
  const fill = Number(region.fillRatio) || 0

  if (coverage > 0.93) return true
  // Area around a centered organic frame (touches most canvas edges, sparse fill)
  if (edges >= 3 && coverage > 0.5 && fill < 0.58) return true
  if (edges >= 4 && fill < 0.7) return true
  return false
}

function pickBestSlotRegions(transparentRegions, darkRegions, lightRegions = [], imageData, width, height) {
  if (!imageData?.length) {
    const merged = mergeAllSlotRegions(transparentRegions, darkRegions, lightRegions)
    if (merged.length) return merged
    return lightRegions.length ? lightRegions : darkRegions.length ? darkRegions : transparentRegions
  }

  const isWhite = (x, y) => isWhitePlaceholderPixel(imageData, width, x, y)
  const isGreen = (x, y) => isLightGreenPlaceholderPixel(imageData, width, x, y)
  const isLight = (x, y) => isWhite(x, y) || isGreen(x, y)
  const interiorsOf = (list) => list.filter((region) => !isBackgroundLikeRegion(region, width, height))

  let primary = interiorsOf(
    refineSlotRegions(findWhiteBlankRegions(imageData, width, height), imageData, width, height, isWhite),
  )

  if (primary.length < 2) {
    const greenOnly = interiorsOf(
      refineSlotRegions(findLightGreenBlankRegions(imageData, width, height), imageData, width, height, isGreen),
    )
    primary = mergeAllSlotRegions(primary, greenOnly)
  }

  // A single interior window is the photo slot — don't merge canvas background around the frame
  if (primary.length === 1 && Number(primary[0].fillRatio) >= 0.32) {
    return primary
  }

  if (primary.length >= 2) {
    return dedupeRegions(primary, 0.5)
  }

  const refinedLight = interiorsOf(refineSlotRegions(lightRegions, imageData, width, height, isLight))
  const transparentInterior = interiorsOf(transparentRegions)
  const darkInterior = interiorsOf(darkRegions)
  const merged = mergeAllSlotRegions(primary, refinedLight, transparentInterior, darkInterior)
  if (merged.length) return dedupeRegions(merged, 0.5)
  if (primary.length) return primary
  if (darkInterior.length) return darkInterior
  if (transparentInterior.length) return transparentInterior
  return interiorsOf(lightRegions)
}

function sanitizeDetectedBox(box) {
  if (!box) return box
  const { area, pixelCount, ...rest } = box
  return rest
}

function buildResultFromBoxes(boxes, canvasWidth, canvasHeight, options = {}) {
  const forAdmin = Boolean(options.forAdmin ?? options.admin)
  const sorted = sortRegionsSpatially(boxes.map(sanitizeDetectedBox).filter(Boolean))

  let next = forAdmin
    ? filterAdminDetectedBoxes(sorted, canvasWidth, canvasHeight)
    : filterSignificantPhotoBoxes(sorted)

  if (!next.length) {
    const fallback = defaultInsetBox(canvasWidth, canvasHeight)
    return {
      canvasWidth,
      canvasHeight,
      photoBox: fallback,
      photoBoxes: [],
      multiSlot: false,
      slotCount: 1,
    }
  }

  if (next.length === 1) {
    return {
      canvasWidth,
      canvasHeight,
      photoBox: next[0],
      photoBoxes: [],
      multiSlot: false,
      slotCount: 1,
    }
  }

  return {
    canvasWidth,
    canvasHeight,
    photoBox: next[0],
    photoBoxes: next,
    multiSlot: true,
    slotCount: next.length,
  }
}

function buildResultFromRegions(regions, canvasWidth, canvasHeight, options = {}) {
  return buildResultFromBoxes(regions.map(regionToBox), canvasWidth, canvasHeight, options)
}

function drawImageToCanvas(img, options = {}) {
  const { forAdmin = false } = options
  let canvasWidth = img.naturalWidth || img.width
  let canvasHeight = img.naturalHeight || img.height

  if (!canvasWidth || !canvasHeight) {
    canvasWidth = 1000
    canvasHeight = 1000
  }

  const scale = Math.min(1, MAX_ANALYZE_DIMENSION / Math.max(canvasWidth, canvasHeight))
  const drawW = Math.round(canvasWidth * scale)
  const drawH = Math.round(canvasHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = drawW
  canvas.height = drawH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.clearRect(0, 0, drawW, drawH)
  ctx.drawImage(img, 0, 0, drawW, drawH)
  const { data } = ctx.getImageData(0, 0, drawW, drawH)

  const transparentRegions = findTransparentRegions(data, drawW, drawH)
  const darkRegions = findDarkSlotRegions(data, drawW, drawH)
  const lightRegions = findLightBlankRegions(data, drawW, drawH)
  const regions = pickBestSlotRegions(transparentRegions, darkRegions, lightRegions, data, drawW, drawH)

  const scaleBack = (box) => ({
    ...box,
    x: Math.round(box.x / scale),
    y: Math.round(box.y / scale),
    width: Math.round(box.width / scale),
    height: Math.round(box.height / scale),
    borderRadius: Math.round((Number(box.borderRadius) || 0) / scale),
  })

  let boxesAtScale = regions.map(regionToBox)
  boxesAtScale = enhanceOrganicClipPaths(boxesAtScale, data, drawW, drawH)

  const boxes = boxesAtScale.map((box) => scaleBack(box))
  return buildResultFromBoxes(boxes, canvasWidth, canvasHeight, { forAdmin })
}

function parseSvgDimensions(svgText) {
  const viewBoxMatch = svgText.match(/viewBox=["']([^"']+)["']/i)
  const widthMatch = svgText.match(/\bwidth=["']([\d.]+)/i)
  const heightMatch = svgText.match(/\bheight=["']([\d.]+)/i)

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4) {
      return {
        width: Math.round(parts[2]) || 1000,
        height: Math.round(parts[3]) || 1000,
      }
    }
  }

  return {
    width: Math.round(Number(widthMatch?.[1]) || 1000),
    height: Math.round(Number(heightMatch?.[1]) || 1000),
  }
}

function parseSvgTransparentPolygons(svgText, canvasWidth, canvasHeight) {
  const boxes = []
  const polygonRe = /<polygon[^>]*\spoints=["']([^"']+)["'][^>]*>/gi
  let match

  while ((match = polygonRe.exec(svgText))) {
    const fullTag = match[0]
    const isHole =
      /class="[^"]*(?:fil2|fil3|hole|window|slot)[^"]*"/i.test(fullTag) ||
      /fill:\s*none/i.test(fullTag) ||
      /fill="none"/i.test(fullTag)

    if (!isHole) continue

    const slot = clipPathFromPolygonPoints(match[1], canvasWidth, canvasHeight)
    if (slot) boxes.push({ ...slot, area: slot.width * slot.height })
  }

  return boxes.length ? sortRegionsSpatially(boxes) : null
}

function parseSvgPhotoElements(svgText, canvasWidth, canvasHeight) {
  const transparentPolygons = parseSvgTransparentPolygons(svgText, canvasWidth, canvasHeight)
  if (transparentPolygons?.length) return transparentPolygons

  const boxes = []
  const idPattern = /id=["'](photo(?:-window|box|slot)?|slot\d*)["'][^>]*>/gi
  let match
  while ((match = idPattern.exec(svgText))) {
    const tag = match[0]
    const x = Number(tag.match(/\bx=["']([\d.]+)/i)?.[1] || 0)
    const y = Number(tag.match(/\by=["']([\d.]+)/i)?.[1] || 0)
    const w = Number(tag.match(/\bwidth=["']([\d.]+)/i)?.[1] || 0)
    const h = Number(tag.match(/\bheight=["']([\d.]+)/i)?.[1] || 0)
    if (w > 0 && h > 0) {
      boxes.push({ x, y, width: w, height: h, rotate: 0, borderRadius: 0, area: w * h })
    }
  }

  if (boxes.length) return sortRegionsSpatially(boxes)
  return null
}

export async function analyzeImageElement(img, options = {}) {
  return drawImageToCanvas(img, options)
}

export async function analyzeRasterMockup(file, options = {}) {
  const img = await loadImageFromFile(file)
  return analyzeImageElement(img, options)
}

export async function analyzeSvgMockup(file, options = {}) {
  const { forAdmin = false } = options
  const svgText = await readFileAsText(file)
  const { width, height } = parseSvgDimensions(svgText)

  const taggedBoxes = parseSvgPhotoElements(svgText, width, height)
  if (taggedBoxes?.length) {
    return buildResultFromRegions(taggedBoxes, width, height, { forAdmin })
  }

  try {
    const img = await loadSvgAsImage(svgText)
    const raster = await analyzeImageElement(img, { forAdmin })
    if (raster.slotCount > 0) return raster
  } catch {
    /* fall through */
  }

  return {
    canvasWidth: width,
    canvasHeight: height,
    photoBox: defaultInsetBox(width, height),
    photoBoxes: [],
    multiSlot: false,
    slotCount: 1,
  }
}

/** Analyze PNG/SVG mockup and auto-build canvas + photo window(s). */
export async function analyzeMockupFile(file, options = {}) {
  if (!file) throw new Error('No file selected')

  const isSvg =
    file.type === 'image/svg+xml' ||
    file.name?.toLowerCase().endsWith('.svg')

  if (isSvg) return analyzeSvgMockup(file, options)
  return analyzeRasterMockup(file, options)
}

/** Re-analyze an uploaded mockup URL (PNG/SVG/WebP). */
export async function analyzeMockupFromUrl(url, options = {}) {
  if (!url) throw new Error('No mockup URL')

  const isSvg = url.toLowerCase().includes('.svg')
  if (isSvg) {
    const res = await fetch(url)
    const svgText = await res.text()
    const blob = new File([svgText], 'mockup.svg', { type: 'image/svg+xml' })
    return analyzeSvgMockup(blob, options)
  }

  const img = await loadImageFromUrl(url)
  return analyzeImageElement(img, options)
}

export { defaultInsetBox, parseSvgDimensions }
