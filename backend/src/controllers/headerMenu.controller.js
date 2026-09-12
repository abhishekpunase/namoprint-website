import { HeaderMenuItem } from '../models/HeaderMenuItem.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listPublicHeaderMenu = asyncHandler(async (_req, res) => {
  const items = await HeaderMenuItem.find({ isActive: true }).sort('sortOrder createdAt').lean();
  res.json({ success: true, items });
});

export const listAdminHeaderMenu = asyncHandler(async (_req, res) => {
  const items = await HeaderMenuItem.find().sort('sortOrder createdAt').lean();
  res.json({ success: true, items });
});

export const createHeaderMenuItem = asyncHandler(async (req, res) => {
  const item = await HeaderMenuItem.create(req.body);
  res.status(201).json({ success: true, item });
});

export const updateHeaderMenuItem = asyncHandler(async (req, res) => {
  const item = await HeaderMenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) {
    res.status(404).json({ success: false, message: 'Menu item not found' });
    return;
  }
  res.json({ success: true, item });
});

export const deleteHeaderMenuItem = asyncHandler(async (req, res) => {
  const item = await HeaderMenuItem.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!item) {
    res.status(404).json({ success: false, message: 'Menu item not found' });
    return;
  }
  res.json({ success: true, item });
});
