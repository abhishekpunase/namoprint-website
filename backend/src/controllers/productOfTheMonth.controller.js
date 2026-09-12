import mongoose from 'mongoose';
import { BabyBirthFrameProduct } from '../models/BabyBirthFrameProduct.js';
import { CorporateGiftProduct } from '../models/CorporateGiftProduct.js';
import { GodProduct } from '../models/GodProduct.js';
import { NamePlateProduct } from '../models/NamePlateProduct.js';
import { PenPrintProduct } from '../models/PenPrintProduct.js';
import { Product } from '../models/Product.js';
import { ProductLabelStickerProduct } from '../models/ProductLabelStickerProduct.js';
import { ProductOfTheMonth } from '../models/ProductOfTheMonth.js';
import { TShirtProduct } from '../models/TShirtProduct.js';
import { TrophyProduct } from '../models/TrophyProduct.js';
import { UvDtfStickerProduct } from '../models/UvDtfStickerProduct.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SETTINGS_KEY = 'default';

const SOURCES = [
  { key: 'product', model: Product, productType: null },
  { key: 'god', model: GodProduct, productType: 'god-photo-frame' },
  { key: 'nameplate', model: NamePlateProduct, productType: 'acrylic-name-plate' },
  { key: 'tshirt', model: TShirtProduct, productType: 't-shirt-printing' },
  { key: 'corporate', model: CorporateGiftProduct, productType: 'corporate-gift-printing' },
  { key: 'baby', model: BabyBirthFrameProduct, productType: 'baby-birth-frame' },
  { key: 'trophy', model: TrophyProduct, productType: 'trophy' },
  { key: 'pen', model: PenPrintProduct, productType: 'pen-print' },
  { key: 'uvdtf', model: UvDtfStickerProduct, productType: 'uv-dtf-stickers' },
  { key: 'label', model: ProductLabelStickerProduct, productType: 'product-labels' },
];

function firstImage(doc) {
  return (
    doc?.thumbnail ||
    doc?.images?.[0] ||
    doc?.mockup?.baseImageUrl ||
    doc?.mockup?.frameImage ||
    ''
  );
}

function optionVariants(doc) {
  if (Array.isArray(doc?.variants) && doc.variants.length) {
    return doc.variants.map((variant) => ({
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
    }));
  }
  if (Array.isArray(doc?.qualityOptions) && doc.qualityOptions.length) {
    return doc.qualityOptions.map((option) => ({
      price: option.price,
      compareAtPrice: option.compareAtPrice,
    }));
  }
  if (Number.isFinite(doc?.price)) {
    return [{ price: doc.price, compareAtPrice: doc.compareAtPrice }];
  }
  return [];
}

function normalizeProduct(doc, source, fallbackType) {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : doc;
  return {
    _id: raw._id,
    title: raw.title,
    slug: raw.slug,
    productType: raw.productType || fallbackType || 'acrylic-wall-photo',
    thumbnail: firstImage(raw),
    images: raw.images || [],
    mockup: raw.mockup,
    variants: optionVariants(raw),
    isActive: raw.isActive !== false,
    source,
  };
}

function snapshotFromProduct(product) {
  const prices = (product.variants || []).map((v) => v.price).filter(Number.isFinite);
  const compares = (product.variants || []).map((v) => v.compareAtPrice).filter(Number.isFinite);
  return {
    title: product.title,
    slug: product.slug,
    productType: product.productType,
    image: product.thumbnail || product.images?.[0] || '',
    price: prices.length ? Math.min(...prices) : 0,
    compareAtPrice: compares.length ? Math.min(...compares) : 0,
    source: product.source || 'product',
  };
}

function productFromSnapshot(snapshot, id) {
  if (!snapshot?.slug && !snapshot?.title) return null;
  return {
    _id: id || 'snapshot',
    title: snapshot.title,
    slug: snapshot.slug,
    productType: snapshot.productType,
    thumbnail: snapshot.image,
    images: snapshot.image ? [snapshot.image] : [],
    variants: [{ price: snapshot.price, compareAtPrice: snapshot.compareAtPrice }],
    isActive: true,
    source: snapshot.source || 'product',
  };
}

async function findCatalogProduct(id, preferredSource) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  const ordered = preferredSource
    ? [...SOURCES.filter((s) => s.key === preferredSource), ...SOURCES.filter((s) => s.key !== preferredSource)]
    : SOURCES;

  for (const source of ordered) {
    const doc = await source.model.findById(id).lean();
    if (doc) return normalizeProduct(doc, source.key, source.productType);
  }
  return null;
}

async function listCatalogProducts() {
  const groups = await Promise.all(
    SOURCES.map(async (source) => {
      const docs = await source.model.find({ isActive: { $ne: false } }).sort('-createdAt').limit(250).lean();
      return docs.map((doc) => normalizeProduct(doc, source.key, source.productType));
    }),
  );
  return groups.flat().filter(Boolean);
}

const hasDisplayImage = {
  $or: [
    { thumbnail: { $exists: true, $nin: [null, ''] } },
    { 'images.0': { $exists: true, $nin: [null, ''] } },
    { 'mockup.baseImageUrl': { $exists: true, $nin: [null, ''] } },
    { 'mockup.frameImage': { $exists: true, $nin: [null, ''] } },
  ],
};

async function findInSources(filter) {
  for (const source of SOURCES) {
    const doc = await source.model.findOne({ isActive: { $ne: false }, ...filter }).sort('-createdAt').lean();
    if (doc) return normalizeProduct(doc, source.key, source.productType);
  }
  return null;
}

async function findFallbackProduct() {
  return (
    (await findInSources({ isFeatured: true, ...hasDisplayImage })) ||
    (await findInSources(hasDisplayImage)) ||
    (await findInSources({ isFeatured: true })) ||
    (await findInSources({}))
  );
}

async function getOrCreateSettings() {
  let doc = await ProductOfTheMonth.findOne({ key: SETTINGS_KEY });
  if (!doc) {
    doc = await ProductOfTheMonth.create({ key: SETTINGS_KEY, isActive: true });
  }
  return doc;
}

async function serialize(doc) {
  const raw = doc?.toObject ? doc.toObject() : doc;
  const live = await findCatalogProduct(raw?.product, raw?.productSource);
  const product = live && live.isActive !== false ? live : productFromSnapshot(raw?.snapshot, raw?.product);
  return {
    _id: raw?._id,
    headline: raw?.headline || 'Product of the Month',
    subtitle: raw?.subtitle || '',
    isActive: raw?.isActive !== false,
    product,
    updatedAt: raw?.updatedAt,
  };
}

export const getPublicProductOfTheMonth = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const doc = await getOrCreateSettings();
  const hasConfiguredProduct = Boolean(doc.product || doc.snapshot?.slug);

  if (hasConfiguredProduct && doc.isActive === false) {
    res.json({ success: true, item: null });
    return;
  }

  if (hasConfiguredProduct) {
    const item = await serialize(doc);
    if (firstImage(item.product)) {
      res.json({ success: true, item });
      return;
    }
  }

  const fallback = await findFallbackProduct();
  if (!fallback?.slug) {
    res.json({ success: true, item: null });
    return;
  }

  doc.product = fallback._id;
  doc.productSource = fallback.source;
  doc.snapshot = snapshotFromProduct(fallback);
  doc.isActive = true;
  await doc.save();

  res.json({ success: true, item: await serialize(doc) });
});

export const getAdminProductOfTheMonth = asyncHandler(async (_req, res) => {
  const doc = await getOrCreateSettings();
  res.json({ success: true, item: await serialize(doc) });
});

export const listProductOfTheMonthCatalog = asyncHandler(async (_req, res) => {
  const items = await listCatalogProducts();
  res.json({ success: true, items });
});

export const updateAdminProductOfTheMonth = asyncHandler(async (req, res) => {
  const { productId, productSource, headline, subtitle, isActive } = req.body;
  const doc = await getOrCreateSettings();

  if (productId !== undefined) {
    if (!productId) {
      doc.product = null;
      doc.snapshot = undefined;
      doc.productSource = 'product';
    } else {
      const product = await findCatalogProduct(productId, productSource);
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      doc.product = product._id;
      doc.productSource = product.source;
      doc.snapshot = snapshotFromProduct(product);
    }
  }

  if (headline !== undefined) doc.headline = headline;
  if (subtitle !== undefined) doc.subtitle = subtitle;
  if (isActive !== undefined) doc.isActive = isActive;
  else if (doc.product) doc.isActive = true;

  if (doc.isActive && !doc.product && !doc.snapshot?.slug) {
    res.status(400).json({ success: false, message: 'Select a product before enabling the popup.' });
    return;
  }

  await doc.save();
  res.json({ success: true, item: await serialize(doc) });
});
