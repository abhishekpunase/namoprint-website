import mongoose from 'mongoose';

const footerLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    group: {
      type: String,
      enum: ['categories', 'quick', 'policies', 'bottom'],
      default: 'categories',
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const footerSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    aboutText: { type: String, trim: true, default: '' },
    copyright: { type: String, trim: true, default: '' },
    headings: {
      categories: { type: String, trim: true, default: 'Categories' },
      quick: { type: String, trim: true, default: 'Quick Links' },
      policies: { type: String, trim: true, default: 'Policies' },
    },
    socials: {
      facebook: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
    },
    links: [footerLinkSchema],
  },
  { timestamps: true },
);

export const FooterSettings = mongoose.model('FooterSettings', footerSettingsSchema);
