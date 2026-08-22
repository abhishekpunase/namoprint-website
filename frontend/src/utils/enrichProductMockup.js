import { analyzeMockupFromUrl } from './mockupAnalyzer'
import { resolveMediaUrl } from './mediaUrl'
import { usesLiveProductImage, getProductBaseImage } from '../data/fallbackCatalog'
import { isBuiltInCatalogMockup, resolveUploadedFrameImage } from '../data/collageFrameMockup'
import { finalizePhotoSlots, forceCircularPhotoSlot } from './mockupSlotShapes'
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

function hasConfiguredMockup(product) {
  const mockup = product?.mockup
  const frameImage = resolveUploadedFrameImage(product) || mockup?.frameImage
  if (!frameImage || isBuiltInCatalogMockup(frameImage)) return false
  // Wall-watch uploaded mockup must be analyzed so photo sits inside the frame opening
  if (isWallWatchProduct(product) && resolveUploadedFrameImage(product) && !mockup?.slotsFromMockup) {
    return false
  }
  if (mockup.photoBoxes?.length > 1) return true
  const box = mockup.photoBox
  return Boolean(box && Number(box.width) > 0 && Number(box.height) > 0)
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
        const shapeText = String(product?.defaultOptions?.shape || mockup?.shape || 'Circle').toLowerCase()
        if (isWallWatchProduct(product) && shapeText.includes('circle') && pb) {
          pb = forceCircularPhotoSlot(pb)
        }
        return pb
      })(),
      },
    }
  }

  try {
    const analysis = await analyzeMockupFromUrl(frameUrl)
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

        // Circle wall watches: clip photo to round inner opening so it never overlaps the mockup ring
    if (
      isWallWatchProduct(product) &&
      String(product?.defaultOptions?.shape || 'Circle').toLowerCase().includes('circle') &&
      photoBox &&
      Number(photoBox.width) > 0
    ) {
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
  }
}
