import mongoose from 'mongoose';

const bulkOrderInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, default: '', trim: true },
    productInterest: { type: String, default: '', trim: true },
    quantity: { type: String, default: '', trim: true },
    message: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'quoted', 'closed'],
      default: 'new',
      index: true,
    },
    adminNote: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

bulkOrderInquirySchema.index({ createdAt: -1 });

export const BulkOrderInquiry = mongoose.model('BulkOrderInquiry', bulkOrderInquirySchema);
