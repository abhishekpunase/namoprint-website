import { Coupon } from '../models/Coupon.js';
import { normalizeCouponCode } from '../constants/coupons.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

function serializeCoupon(doc) {
  const raw = doc?.toObject ? doc.toObject() : doc;
  const usages = (raw.usages || []).map((usage) => ({
    _id: usage._id,
    user: usage.user,
    order: usage.order,
    customerName: usage.customerName || 'Customer',
    customerEmail: usage.customerEmail || '',
    discountAmount: usage.discountAmount || 0,
    usedAt: usage.usedAt,
  }));

  const byUser = new Map();
  for (const usage of usages) {
    const key = usage.customerEmail || String(usage.user || usage.customerName);
    const current = byUser.get(key) || {
      customerName: usage.customerName,
      customerEmail: usage.customerEmail,
      uses: 0,
      lastUsedAt: usage.usedAt,
    };
    current.uses += 1;
    if (new Date(usage.usedAt) > new Date(current.lastUsedAt)) current.lastUsedAt = usage.usedAt;
    byUser.set(key, current);
  }

  return {
    _id: raw._id,
    code: raw.code,
    name: raw.name,
    type: raw.type,
    value: raw.value,
    maxUses: raw.maxUses,
    usageCount: raw.usageCount || 0,
    remainingUses: Math.max(0, (raw.maxUses || 0) - (raw.usageCount || 0)),
    isPublic: false,
    isActive: raw.isActive !== false,
    minSubtotal: raw.minSubtotal || 0,
    expiresAt: raw.expiresAt || null,
    notes: raw.notes || '',
    usages: usages.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt)),
    usedBy: [...byUser.values()].sort((a, b) => b.uses - a.uses),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const listAdminCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find({ isPublic: { $ne: true } }).sort('-createdAt');
  res.json({ success: true, items: coupons.map(serializeCoupon) });
});

export const createAdminCoupon = asyncHandler(async (req, res) => {
  const code = normalizeCouponCode(req.body.code);
  const exists = await Coupon.findOne({ code });
  if (exists) throw new ApiError(409, `Coupon ${code} already exists`);

  if (req.body.type === 'percent' && req.body.value > 100) {
    throw new ApiError(400, 'Percent discount cannot be more than 100');
  }

  const coupon = await Coupon.create({
    code,
    name: req.body.name,
    type: req.body.type,
    value: req.body.value,
    maxUses: req.body.maxUses,
    isPublic: false,
    isActive: req.body.isActive !== false,
    minSubtotal: req.body.minSubtotal || undefined,
    expiresAt: req.body.expiresAt || undefined,
    notes: req.body.notes || '',
  });

  res.status(201).json({ success: true, item: serializeCoupon(coupon) });
});

export const updateAdminCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');

  if (req.body.type === 'percent' && req.body.value > 100) {
    throw new ApiError(400, 'Percent discount cannot be more than 100');
  }
  if (req.body.maxUses != null && req.body.maxUses < coupon.usageCount) {
    throw new ApiError(400, `Max uses cannot be below current usage (${coupon.usageCount})`);
  }

  const fields = ['name', 'type', 'value', 'maxUses', 'isActive', 'minSubtotal', 'expiresAt', 'notes'];
  for (const field of fields) {
    if (req.body[field] !== undefined) coupon[field] = req.body[field];
  }
  if (req.body.expiresAt === null || req.body.expiresAt === '') coupon.expiresAt = undefined;
  if (req.body.minSubtotal === null || req.body.minSubtotal === '') coupon.minSubtotal = undefined;

  await coupon.save();
  res.json({ success: true, item: serializeCoupon(coupon) });
});

export const deleteAdminCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, item: serializeCoupon(coupon) });
});
