import { ensureFooter } from '../config/seedFooter.js';
import { FooterSettings } from '../models/FooterSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function serialize(doc) {
  const raw = doc?.toObject ? doc.toObject() : doc;
  return {
    _id: raw?._id,
    aboutText: raw?.aboutText || '',
    copyright: raw?.copyright || '',
    headings: {
      categories: raw?.headings?.categories || 'Categories',
      quick: raw?.headings?.quick || 'Quick Links',
      policies: raw?.headings?.policies || 'Policies',
    },
    socials: {
      facebook: raw?.socials?.facebook || '',
      instagram: raw?.socials?.instagram || '',
      youtube: raw?.socials?.youtube || '',
    },
    links: (raw?.links || [])
      .filter((link) => link.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((link) => ({
        _id: link._id,
        label: link.label,
        path: link.path,
        group: link.group,
        sortOrder: link.sortOrder ?? 0,
        isActive: link.isActive !== false,
      })),
  };
}

export const getPublicFooter = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const doc = await ensureFooter();
  res.json({ success: true, item: serialize(doc) });
});

export const getAdminFooter = asyncHandler(async (_req, res) => {
  const doc = await ensureFooter();
  const raw = doc.toObject();
  res.json({
    success: true,
    item: {
      ...serialize(doc),
      links: (raw.links || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    },
  });
});

export const updateAdminFooter = asyncHandler(async (req, res) => {
  const doc = await ensureFooter();
  const { aboutText, copyright, headings, socials, links } = req.body;

  if (aboutText !== undefined) doc.aboutText = aboutText;
  if (copyright !== undefined) doc.copyright = copyright;
  if (headings) {
    doc.headings = {
      categories: headings.categories ?? doc.headings?.categories,
      quick: headings.quick ?? doc.headings?.quick,
      policies: headings.policies ?? doc.headings?.policies,
    };
  }
  if (socials) {
    doc.socials = {
      facebook: socials.facebook ?? doc.socials?.facebook,
      instagram: socials.instagram ?? doc.socials?.instagram,
      youtube: socials.youtube ?? doc.socials?.youtube,
    };
  }
  if (Array.isArray(links)) {
    doc.links = links.map((link, index) => ({
      label: String(link.label || '').trim(),
      path: String(link.path || '').trim(),
      group: ['categories', 'quick', 'policies', 'bottom'].includes(link.group) ? link.group : 'categories',
      sortOrder: Number.isFinite(link.sortOrder) ? link.sortOrder : index,
      isActive: link.isActive !== false,
    }));
  }

  await doc.save();
  res.json({ success: true, item: serialize(doc) });
});
