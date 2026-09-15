import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    content: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const legalPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: ['privacy-policy', 'terms-and-conditions', 'refund-policy', 'shipping-policy'],
    },
    title: { type: String, required: true, trim: true },
    titleAccent: { type: String, trim: true, default: '' },
    updatedLabel: { type: String, trim: true, default: '' },
    intro: { type: String, trim: true, default: '' },
    highlightTitle: { type: String, trim: true, default: '' },
    highlightContent: { type: String, trim: true, default: '' },
    sections: { type: [sectionSchema], default: [] },
    bulletsTitle: { type: String, trim: true, default: '' },
    bullets: { type: [String], default: [] },
    ctaTitle: { type: String, trim: true, default: '' },
    ctaContent: { type: String, trim: true, default: '' },
    ctaButtonLabel: { type: String, trim: true, default: '' },
    ctaButtonHref: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

export const LegalPage = mongoose.model('LegalPage', legalPageSchema);
