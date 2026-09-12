import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customerName: { type: String, trim: true, default: '' },
    customerEmail: { type: String, trim: true, default: '' },
    discountAmount: { type: Number, default: 0, min: 0 },
    usedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxUses: { type: Number, required: true, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    isPublic: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    minSubtotal: { type: Number, min: 0 },
    expiresAt: { type: Date },
    notes: { type: String, trim: true, default: '' },
    usages: { type: [couponUsageSchema], default: [] },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model('Coupon', couponSchema);
