import { analyzeMockupFromUrl } from './mockupAnalyzer'
import { resolveMediaUrl } from './mediaUrl'
import { usesLiveProductImage, getProductBaseImage } from '../data/fallbackCatalog'
import { isBuiltInCatalogMockup, resolveUploadedFrameImage } from '../data/collageFrameMockup'
import { finalizePhotoSlots, forceCircularPhotoSlot, shouldUseCircularPhotoSlot } from './mockupSlotShapes'
import { isWallWatchProduct } from './wallWatchCatalog'
import { normalizeWallWatchProduct, getCollagePhotoCount, isCollageWallWatchProduct } from './wallWatchProductDefaults'
import { insetCollageBoxesInWindow } from './wallWatchCollageLayouts'


export function getMockupFrameUrl(product) {
  const uploaded = resolveUploadedFrameImage(product)
  if (uploaded) return resolveMediaUrl(uploaded)
  const saved = product?.mockup?.frameImage
  if (saved && !isBuiltInCatalogMockup(saved)) return resolveMediaUrl(saved)
  return ''
}

function looksLikePlaceholderSlot(box, canvas) {
  if (!box || !(Number(box.width) > 0) || !(Number(box.height) > 0)) return true
  const cw = Number(canvas?.width) || 1000
  const ch = Number(canvas?.height) || 1000
  const x = Number(box.x) || 0
  const y = Number(box.y) || 0
  const w = Number(box.width) || 0
  const h = Number(box.height) || 0
  const near = (a, b) => Math.abs(a - b) <= 3
  if (near(x, 90) && near(y, 90) && near(w, 820) && near(h, 820)) return true
  if (near(x, 120) && near(y, 120) && near(w, 760) && near(h, 760)) return true
  if (cw === 1000 && ch === 1000 && near(w, 820) && near(h, 820) && near(x, y)) return true
  return false
}

function hasConfiguredMockup(product) {
  const mockup = product?.mockup
  const frameImage = resolveUploadedFrameImage(product) || mockup?.frameImage
  if (!frameImage || isBuiltInCatalogMockup(frameImage)) return false
  if (isWallWatchProduct(product) && resolveUploadedFrameImage(product) && !mockup?.slotsFromMockup) {
    return false
  }
  if (mockup.photoBoxes?.length > 1 && mockup.slotsFromMockup) return true
  const box = mockup.photoBox
  if (!mockup.slotsFromMockup) return false
  return Boolean(box && Number(box.width) > 0 && !looksLikePlaceholderSlot(box, mockup.canvas))
}

export function productNeedsMockupAnalysis(product) {
  if (usesLiveProductImage(product)) return false
  const frameUrl = getMockupFrameUrl(product)
  if (!frameUrl) return false
  if (hasConfiguredMockup(product)) return false
  return true
}

/** Detect transparent/dark photo slots from uploaded frame image and merge into product.mockup */
export async function enrichProductMockup(product) {
  if (!product) return product

  if (isWallWatchProduct(product)) {
    product = normalizeWallWatchProduct(product)
  }

  // Name plates â€” live product photo only; never auto-detect collage slots on catalog image
  if (usesLiveProductImage(product)) {
    const baseImageUrl = resolveMediaUrl(getProductBaseImage(product))
    return {
      ...product,
      mockup: {
        ...(product.mockup || {}),
        baseImageUrl,
      },
    }
  }

  const frameUrl = getMockupFrameUrl(product)
  if (!frameUrl) {
    const mockup = product.mockup || {}
    if (isBuiltInCatalogMockup(mockup.frameImage)) {
      return {
        ...product,
        mockup: {
          ...mockup,
          frameImage: '',
        },
      }
    }
    return product
  }

  if (hasConfiguredMockup(product)) {
    const mockup = product.mockup || {}
    const uploaded = resolveUploadedFrameImage(product)
    const clippedBoxes =
      mockup.photoBoxes?.length > 1 ? finalizePhotoSlots(mockup.photoBoxes, product) : mockup.photoBoxes

    return {
      ...product,
      mockup: {
        ...mockup,
        frameImage: resolveMediaUrl(uploaded || mockup.frameImage),
        ...(clippedBoxes?.length ? { photoBoxes: clippedBoxes } : {}),
        photoBox: (() => {
        let pb = clippedBoxes?.[0] || mockup.photoBox
        if (pb && shouldUseCircularPhotoSlot(product, product?.defaultOptions, pb)) {
          pb = forceCircularPhotoSlot(pb)
        }
        return pb
      })(),
      },
    }
  }

  try {
    const analysis = await analyzeMockupFromUrl(frameUrl, { forAdmin: true })
    let multiBoxes = analysis.photoBoxes?.length > 1 ? analysis.photoBoxes : []
    let photoBox = analysis.photoBox
    const canvas = {
      width: Number(analysis.canvasWidth) || 1000,
      height: Number(analysis.canvasHeight) || 1000,
    }

    // Collage wall watch + single detected window â†’ nest slots inside the window only
    if (
      isWallWatchProduct(product) &&
      isCollageWallWatchProduct(product) &&
      multiBoxes.length <= 1 &&
      photoBox &&
      Number(photoBox.width) > 0
    ) {
      const count = getCollagePhotoCount(product) || 4
      multiBoxes = insetCollageBoxesInWindow(count, photoBox, canvas)
      photoBox = multiBoxes[0]
    }

    // Circle wall watches only — keep admin-detected rounded squares as-is
    if (photoBox && Number(photoBox.width) > 0 && shouldUseCircularPhotoSlot(product, product?.defaultOptions, photoBox)) {
      photoBox = forceCircularPhotoSlot(photoBox)
    }

    const slotCount = multiBoxes.length > 1 ? multiBoxes.length : 1
    const nextMockup = {
      ...(product.mockup || {}),
      frameImage: resolveUploadedFrameImage(product) || product.mockup?.frameImage || frameUrl,
      canvas,
      photoBox,
      slotsFromMockup: true,
    }
    if (multiBoxes.length > 1) nextMockup.photoBoxes = multiBoxes
    else delete nextMockup.photoBoxes

    return {
      ...product,
      mockup: nextMockup,
      personalization: {
        ...(product.personalization || {}),
        allowPhotoUpload: true,
        maxPhotos: slotCount,
      },
    }
  } catch {
    return {
      ...product,
      mockup: {
        ...(product.mockup || {}),
        frameImage: product.mockup?.frameImage || frameUrl,
        canvas: product.mockup?.canvas || { width: 1000, height: 1000 },
        photoBox: product.mockup?.photoBox || { x: 120, y: 120, width: 760, height: 760, rotate: 0, borderRadius: 0 },
      },
    }
  }
}

export function analysisToFormPatch(analysis, frameUrl) {
  return {
    frameImage: frameUrl,
    canvasWidth: String(analysis.canvasWidth),
    canvasHeight: String(analysis.canvasHeight),
    photoBox: analysis.photoBox,
    photoBoxes: analysis.photoBoxes || [],
    multiSlot: analysis.multiSlot,
    slotCount: analysis.slotCount,
    boxX: String(analysis.photoBox?.x ?? 0),
    boxY: String(analysis.photoBox?.y ?? 0),
    boxWidth: String(analysis.photoBox?.width ?? 0),
    boxHeight: String(analysis.photoBox?.height ?? 0),
    boxRotate: String(analysis.photoBox?.rotate ?? 0),
    boxRadius: String(analysis.photoBox?.borderRadius ?? 0),
    maxPhotos: String(analysis.slotCount || 1),
    allowPhotoUpload: true,
    slotsFromMockup: true,
  }
}
