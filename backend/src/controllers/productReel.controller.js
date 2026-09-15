import { ProductReel } from '../models/ProductReel.js';
import { ProductReelSection } from '../models/ProductReelSection.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function getOrCreateSection() {
  let section = await ProductReelSection.findOne({ key: 'default' }).lean();
  if (!section) {
    section = (await ProductReelSection.create({ key: 'default', isEnabled: true })).toObject();
  }
  return section;
}

export const listPublicProductReels = asyncHandler(async (_req, res) => {
  const section = await getOrCreateSection();
  if (section.isEnabled === false) {
    res.json({ success: true, sectionEnabled: false, reels: [] });
    return;
  }

  const reels = await ProductReel.find({ isActive: true }).sort('sortOrder -createdAt').lean();
  res.json({ success: true, sectionEnabled: true, reels });
});

export const listAdminProductReels = asyncHandler(async (_req, res) => {
  const [section, reels] = await Promise.all([
    getOrCreateSection(),
    ProductReel.find().sort('sortOrder -createdAt').lean(),
  ]);
  res.json({ success: true, sectionEnabled: section.isEnabled !== false, reels });
});

export const updateProductReelSection = asyncHandler(async (req, res) => {
  const section = await ProductReelSection.findOneAndUpdate(
    { key: 'default' },
    { isEnabled: Boolean(req.body.isEnabled) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.json({ success: true, sectionEnabled: section.isEnabled !== false, section });
});

export const createProductReel = asyncHandler(async (req, res) => {
  const reel = await ProductReel.create(req.body);
  res.status(201).json({ success: true, reel });
});

export const updateProductReel = asyncHandler(async (req, res) => {
  const reel = await ProductReel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!reel) {
    res.status(404).json({ success: false, message: 'Reel not found' });
    return;
  }
  res.json({ success: true, reel });
});

export const deleteProductReel = asyncHandler(async (req, res) => {
  const reel = await ProductReel.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!reel) {
    res.status(404).json({ success: false, message: 'Reel not found' });
    return;
  }
  res.json({ success: true, reel });
});
