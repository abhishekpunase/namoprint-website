import { User } from '../models/User.js';
import { canInsertDevUsers } from './seedGuard.js';
import { ensureDevCatalog, ensureDevCategories, ensureFallbackStorefrontProducts } from './seedCatalog.js';

import { ensureHomeSlides } from './seedHomeSlides.js';
import { ensureProductReviews } from './seedProductReviews.js';
import { ensureCategoryCarousel } from './seedCategoryCarousel.js';
import { ensureProductReels } from './seedProductReels.js';
import { ensureCorporateGifts } from './seedCorporateGifts.js';
import { ensureBabyBirthFrames } from './seedBabyBirthFrames.js';
import { ensureTrophies } from './seedTrophies.js';
import { ensurePenPrints } from './seedPenPrints.js';
import { ensureUvDtfStickers } from './seedUvDtfStickers.js';
import { ensureProductLabelStickers } from './seedProductLabelStickers.js';
import { ensureTShirtProducts } from './seedTShirtProducts.js';
import { ensureHomeTestimonials } from './seedHomeTestimonials.js';
import { ensureHomeOfferMarquee } from './seedHomeOfferMarquee.js';
import { ensureStoreSettings } from './seedStoreSettings.js';

export {
  ensureDevCatalog,
  ensureDevCategories,
  ensureFallbackStorefrontProducts,
  ensureHomeSlides,
  ensureProductReviews,
  ensureCategoryCarousel,
  ensureProductReels,
  ensureStoreSettings,
  ensureCorporateGifts,
  ensureBabyBirthFrames,
  ensureTrophies,
  ensurePenPrints,
  ensureUvDtfStickers,
  ensureProductLabelStickers,
  ensureTShirtProducts,
  ensureHomeTestimonials,
  ensureHomeOfferMarquee,
};

const PRIMARY_ADMIN_EMAIL = 'admin@omgs.com';
const LEGACY_ADMIN_EMAILS = ['admin@namoprint.com', 'admin@omgs.local'];

const DEV_USERS = [
  {
    name: 'OMGS Admin',
    email: PRIMARY_ADMIN_EMAIL,
    phone: '9876543211',
    password: 'Admin@12345',
    role: 'admin',
  },
];

async function migrateLegacyAdminEmail() {
  const primaryExists = await User.findOne({ email: PRIMARY_ADMIN_EMAIL });
  if (primaryExists) return;

  for (const legacyEmail of LEGACY_ADMIN_EMAILS) {
    const legacy = await User.findOne({ email: legacyEmail, role: 'admin' });
    if (!legacy) continue;
    legacy.email = PRIMARY_ADMIN_EMAIL;
    await legacy.save();
    console.log(`Admin email updated: ${legacyEmail} → ${PRIMARY_ADMIN_EMAIL}`);
    return;
  }
}

export async function ensureDevUsers() {
  if (!canInsertDevUsers()) return;

  await migrateLegacyAdminEmail();

  for (const entry of DEV_USERS) {
    const exists = await User.findOne({ email: entry.email });
    if (exists) continue;

    const user = new User({
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      role: entry.role,
    });
    user.password = entry.password;
    await user.save();
    if (entry.role === 'admin') {
      console.log(`Admin account ready: ${entry.email}`);
    }
  }
}
