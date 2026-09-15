import mongoose from 'mongoose';

const productReelSectionSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true, immutable: true },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ProductReelSection = mongoose.model('ProductReelSection', productReelSectionSchema);
