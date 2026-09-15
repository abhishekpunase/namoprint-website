import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { LegalPage } from '../models/LegalPage.js';
import { DEFAULT_LEGAL_PAGES, ensureLegalPages, LEGAL_PAGE_SLUGS } from '../config/seedLegalPages.js';

function serialize(doc) {
  if (!doc) return null;
  const item = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    slug: item.slug,
    title: item.title || '',
    titleAccent: item.titleAccent || '',
    updatedLabel: item.updatedLabel || '',
    intro: item.intro || '',
    highlightTitle: item.highlightTitle || '',
    highlightContent: item.highlightContent || '',
    sections: Array.isArray(item.sections) ? item.sections : [],
    bulletsTitle: item.bulletsTitle || '',
    bullets: Array.isArray(item.bullets) ? item.bullets : [],
    ctaTitle: item.ctaTitle || '',
    ctaContent: item.ctaContent || '',
    ctaButtonLabel: item.ctaButtonLabel || '',
    ctaButtonHref: item.ctaButtonHref || '',
    updatedAt: item.updatedAt,
  };
}

async function getOrSeed(slug) {
  if (!LEGAL_PAGE_SLUGS.includes(slug)) {
    throw new ApiError(404, 'Legal page not found');
  }
  await ensureLegalPages();
  let doc = await LegalPage.findOne({ slug });
  if (!doc) {
    const defaults = DEFAULT_LEGAL_PAGES.find((page) => page.slug === slug);
    doc = await LegalPage.create(defaults);
  }
  return doc;
}

export const listPublicLegalPages = asyncHandler(async (_req, res) => {
  await ensureLegalPages();
  const items = await LegalPage.find({ slug: { $in: LEGAL_PAGE_SLUGS } }).lean();
  res.json({ success: true, items: items.map(serialize) });
});

export const getPublicLegalPage = asyncHandler(async (req, res) => {
  const doc = await getOrSeed(req.params.slug);
  res.json({ success: true, item: serialize(doc) });
});

export const listAdminLegalPages = asyncHandler(async (_req, res) => {
  await ensureLegalPages();
  const items = await LegalPage.find({ slug: { $in: LEGAL_PAGE_SLUGS } }).lean();
  const bySlug = Object.fromEntries(items.map((item) => [item.slug, serialize(item)]));
  res.json({
    success: true,
    items: LEGAL_PAGE_SLUGS.map((slug) => bySlug[slug]).filter(Boolean),
  });
});

export const getAdminLegalPage = asyncHandler(async (req, res) => {
  const doc = await getOrSeed(req.params.slug);
  res.json({ success: true, item: serialize(doc) });
});

export const updateAdminLegalPage = asyncHandler(async (req, res) => {
  const doc = await getOrSeed(req.params.slug);
  const fields = [
    'title',
    'titleAccent',
    'updatedLabel',
    'intro',
    'highlightTitle',
    'highlightContent',
    'sections',
    'bulletsTitle',
    'bullets',
    'ctaTitle',
    'ctaContent',
    'ctaButtonLabel',
    'ctaButtonHref',
  ];
  for (const key of fields) {
    if (req.body[key] !== undefined) doc[key] = req.body[key];
  }
  await doc.save();
  res.json({ success: true, item: serialize(doc) });
});
