import { ensureSpecialOffers } from '../config/seedSpecialOffers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function serialize(doc, { includeInactive = false } = {}) {
  const raw = doc?.toObject ? doc.toObject() : doc;
  const cards = (raw?.cards || [])
    .filter((card) => (includeInactive ? true : card.isActive !== false))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((card) => ({
      _id: card._id,
      title: card.title || '',
      subtitle: card.subtitle || '',
      description: card.description || '',
      code: card.code || '',
      icon: card.icon || 'gift',
      gradient: card.gradient || 'from-orange-500 via-orange-400 to-yellow-400',
      action: card.action || 'claim',
      cta: card.cta || 'Claim Offer',
      href: card.href || '',
      sortOrder: card.sortOrder ?? 0,
      isActive: card.isActive !== false,
    }));

  return {
    _id: raw?._id,
    eyebrow: raw?.eyebrow || '',
    title: raw?.title || '',
    titleAccent: raw?.titleAccent || '',
    subtitle: raw?.subtitle || '',
    isActive: raw?.isActive !== false,
    cards,
  };
}

export const getPublicSpecialOffers = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const doc = await ensureSpecialOffers();
  const item = serialize(doc);
  if (!item.isActive) {
    return res.json({ success: true, item: { ...item, cards: [] } });
  }
  res.json({ success: true, item });
});

export const getAdminSpecialOffers = asyncHandler(async (_req, res) => {
  const doc = await ensureSpecialOffers();
  res.json({ success: true, item: serialize(doc, { includeInactive: true }) });
});

export const updateAdminSpecialOffers = asyncHandler(async (req, res) => {
  const doc = await ensureSpecialOffers();
  const { eyebrow, title, titleAccent, subtitle, isActive, cards } = req.body;

  if (eyebrow !== undefined) doc.eyebrow = eyebrow;
  if (title !== undefined) doc.title = title;
  if (titleAccent !== undefined) doc.titleAccent = titleAccent;
  if (subtitle !== undefined) doc.subtitle = subtitle;
  if (isActive !== undefined) doc.isActive = Boolean(isActive);

  if (Array.isArray(cards)) {
    doc.cards = cards.map((card, index) => ({
      title: String(card.title || '').trim(),
      subtitle: String(card.subtitle || '').trim(),
      description: String(card.description || '').trim(),
      code: String(card.code || '').trim().toUpperCase(),
      icon: ['percent', 'gift', 'truck', 'sparkles'].includes(card.icon) ? card.icon : 'gift',
      gradient: String(card.gradient || 'from-orange-500 via-orange-400 to-yellow-400').trim(),
      action: ['claim', 'bulk', 'link'].includes(card.action) ? card.action : 'claim',
      cta: String(card.cta || 'Claim Offer').trim(),
      href: String(card.href || '').trim(),
      sortOrder: Number.isFinite(card.sortOrder) ? card.sortOrder : index,
      isActive: card.isActive !== false,
    }));
  }

  await doc.save();
  res.json({ success: true, item: serialize(doc, { includeInactive: true }) });
});
