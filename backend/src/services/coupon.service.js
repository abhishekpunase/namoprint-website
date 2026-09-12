import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { FREE_SHIPPING_MIN, SHIPPING_FEE, getCouponDefinition, normalizeCouponCode } from '../constants/coupons.js';
import { calculateSpecialDateDiscount } from './discount.service.js';
import { ApiError } from '../utils/apiError.js';

function toRuntimeCoupon(doc) {
  return {
    code: doc.code,
    type: doc.type,
    value: doc.value,
    label: doc.name || doc.code,
    minSubtotal: doc.minSubtotal,
    isManaged: true,
  };
}

async function findManagedCoupon(code) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  return Coupon.findOne({ code: normalized });
}

export async function validateCouponForUser({ code, userId, items, subtotal }) {
  const normalized = normalizeCouponCode(code);
  const managed = await findManagedCoupon(normalized);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (managed) {
    if (managed.isActive === false) throw new ApiError(400, 'This coupon is no longer active');
    if (managed.expiresAt && new Date(managed.expiresAt) < new Date()) {
      throw new ApiError(400, `Coupon ${normalized} has expired`);
    }
    if (managed.usageCount >= managed.maxUses) {
      throw new ApiError(400, `Coupon ${normalized} has already been used ${managed.maxUses} times`);
    }
    if (managed.minSubtotal && subtotal < managed.minSubtotal) {
      throw new ApiError(400, `Minimum order value ₹${managed.minSubtotal} required for ${normalized}`);
    }
    return { coupon: toRuntimeCoupon(managed), normalizedCode: normalized };
  }

  const coupon = getCouponDefinition(code);
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');

  if (coupon.firstOrderOnly) {
    const paidOrders = await Order.countDocuments({ user: userId, 'payment.status': 'Paid' });
    if (paidOrders > 0) throw new ApiError(400, 'WELCOME10 is valid only on your first paid order');
  }

  if (coupon.minQuantity && totalQuantity < coupon.minQuantity) {
    throw new ApiError(400, `Add at least ${coupon.minQuantity} items to use ${normalized}`);
  }

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    throw new ApiError(400, `Minimum order value ₹${coupon.minSubtotal} required for ${normalized}`);
  }

  const user = await User.findById(userId).select('usedCoupons');
  if (user?.usedCoupons?.includes(normalized)) {
    throw new ApiError(400, `Coupon ${normalized} has already been used`);
  }

  return { coupon, normalizedCode: normalized };
}

export function calculateCouponDiscount(subtotal, coupon) {
  if (!coupon || subtotal <= 0) return { amount: 0, label: null, freeShipping: false };

  if (coupon.type === 'percent') {
    return {
      amount: Math.min(subtotal, Math.round((subtotal * coupon.value) / 100)),
      label: `${coupon.value}% off (${coupon.code})`,
      freeShipping: false,
    };
  }

  if (coupon.type === 'fixed') {
    return {
      amount: Math.min(subtotal, Math.round(coupon.value)),
      label: `₹${coupon.value} off (${coupon.code})`,
      freeShipping: false,
    };
  }

  if (coupon.type === 'free_shipping') {
    return {
      amount: 0,
      label: 'Free delivery coupon applied',
      freeShipping: true,
    };
  }

  return { amount: 0, label: null, freeShipping: false };
}

export function calculateOrderTotals(items, { specialDate, coupon } = {}) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const couponResult = calculateCouponDiscount(subtotal, coupon);
  const specialResult = calculateSpecialDateDiscount(subtotal, specialDate);

  const couponDiscount = couponResult.amount;
  const specialDateDiscount = specialResult.discount;
  const discount = Math.min(subtotal, couponDiscount + specialDateDiscount);

  const afterDiscount = subtotal - discount;
  const qualifiesForFreeShipping =
    couponResult.freeShipping || afterDiscount >= FREE_SHIPPING_MIN || subtotal >= FREE_SHIPPING_MIN;
  const shipping = subtotal === 0 || qualifiesForFreeShipping ? 0 : SHIPPING_FEE;
  const tax = 0;
  const total = Math.max(0, afterDiscount + shipping + tax);

  const discountNotes = [couponResult.label, specialResult.applied ? specialResult.reason : null].filter(Boolean);

  return {
    subtotal,
    shipping,
    discount,
    couponDiscount,
    specialDateDiscount,
    tax,
    total,
    currency: 'INR',
    discountApplied: discount > 0 || couponResult.freeShipping,
    discountReason: discountNotes.join(' + ') || specialResult.reason,
    freeShippingApplied: qualifiesForFreeShipping,
  };
}

export async function markCouponUsed(userId, couponCode, extras = {}) {
  if (!couponCode) return;
  const normalized = normalizeCouponCode(couponCode);
  const managed = await findManagedCoupon(normalized);

  if (managed) {
    const user = await User.findById(userId).select('name email');
    const updated = await Coupon.findOneAndUpdate(
      {
        _id: managed._id,
        isActive: true,
        $expr: { $lt: ['$usageCount', '$maxUses'] },
      },
      {
        $inc: { usageCount: 1 },
        $push: {
          usages: {
            user: userId,
            order: extras.orderId || undefined,
            customerName: user?.name || extras.customerName || 'Customer',
            customerEmail: user?.email || extras.customerEmail || '',
            discountAmount: extras.discountAmount || 0,
            usedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (updated && updated.usageCount >= updated.maxUses) {
      updated.isActive = false;
      await updated.save();
    }
    return;
  }

  if (!getCouponDefinition(normalized)) return;
  await User.findByIdAndUpdate(userId, { $addToSet: { usedCoupons: normalized } });
}
