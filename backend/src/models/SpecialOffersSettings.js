import mongoose from 'mongoose';

const offerCardSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, enum: ['percent', 'gift', 'truck', 'sparkles'], default: 'gift' },
    gradient: { type: String, trim: true, default: 'from-orange-500 via-orange-400 to-yellow-400' },
    action: { type: String, trim: true, enum: ['claim', 'bulk', 'link'], default: 'claim' },
    cta: { type: String, trim: true, default: 'Claim Offer' },
    href: { type: String, trim: true, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const specialOffersSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    eyebrow: { type: String, trim: true, default: 'Limited Time Exclusive Deals' },
    title: { type: String, trim: true, default: 'Unlock Premium' },
    titleAccent: { type: String, trim: true, default: 'Furniture Savings' },
    subtitle: {
      type: String,
      trim: true,
      default: 'Transform your space with handcrafted furniture and enjoy exclusive offers designed especially for you.',
    },
    isActive: { type: Boolean, default: true },
    cards: { type: [offerCardSchema], default: [] },
  },
  { timestamps: true },
);

export const SpecialOffersSettings = mongoose.model('SpecialOffersSettings', specialOffersSchema);
