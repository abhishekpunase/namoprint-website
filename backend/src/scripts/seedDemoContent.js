/**
 * Manual demo seed. Never runs on `npm run dev` / `npm start`.
 *
 *   cd backend
 *   npm run seed
 */
import { connectDb, disconnectDb } from '../config/db.js';
import {
  ensureBabyBirthFrames,
  ensureCategoryCarousel,
  ensureCorporateGifts,
  ensureDevCatalog,
  ensureDevUsers,
  ensureHomeOfferMarquee,
  ensureHomeSlides,
  ensureHomeTestimonials,
  ensurePenPrints,
  ensureProductLabelStickers,
  ensureProductReels,
  ensureProductReviews,
  ensureStoreSettings,
  ensureTrophies,
  ensureTShirtProducts,
  ensureUvDtfStickers,
} from '../config/seedDev.js';

async function runOne(label, fn) {
  try {
    await fn();
    console.log(`OK  ${label}`);
  } catch (err) {
    console.warn(`SKIP ${label}:`, err?.message || err);
  }
}

const run = async () => {
  process.env.ALLOW_SEED = 'true';
  await connectDb();
  console.log('Seeding demo content (manual)...');

  await runOne('Store settings', ensureStoreSettings);
  await runOne('Dev users', ensureDevUsers);
  await runOne('Dev catalog', ensureDevCatalog);
  await runOne('Home slides', ensureHomeSlides);
  await runOne('Product reviews', ensureProductReviews);
  await runOne('Category carousel', ensureCategoryCarousel);
  await runOne('Product reels', ensureProductReels);
  await runOne('Corporate gifts', ensureCorporateGifts);
  await runOne('Baby birth frames', ensureBabyBirthFrames);
  await runOne('Trophies', ensureTrophies);
  await runOne('Pen prints', ensurePenPrints);
  await runOne('UV DTF stickers', ensureUvDtfStickers);
  await runOne('Product label stickers', ensureProductLabelStickers);
  await runOne('T-shirt products', ensureTShirtProducts);
  await runOne('Home testimonials', ensureHomeTestimonials);
  await runOne('Home offer marquee', ensureHomeOfferMarquee);

  console.log('Seed finished. Admin (if created): admin@omgs.com');
  await disconnectDb();
  process.exit(0);
};

run().catch(async (error) => {
  console.error(error);
  try {
    await disconnectDb();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
