import mongoose from 'mongoose';

const headerMenuItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    group: { type: String, enum: ['primary', 'more'], default: 'primary' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

headerMenuItemSchema.index({ sortOrder: 1, createdAt: -1 });

export const HeaderMenuItem = mongoose.model('HeaderMenuItem', headerMenuItemSchema);
