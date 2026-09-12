import mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema(
  {
    title: String,
    slug: String,
    productType: String,
    image: String,
    price: Number,
    compareAtPrice: Number,
    source: { type: String, default: 'product' },
  },
  { _id: false },
);

const productOfTheMonthSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productSource: { type: String, default: 'product' },
    snapshot: { type: snapshotSchema, default: undefined },
    headline: { type: String, trim: true, default: 'Product of the Month' },
    subtitle: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ProductOfTheMonth = mongoose.model('ProductOfTheMonth', productOfTheMonthSchema);
