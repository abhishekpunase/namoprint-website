/**
 * Remove the demo products that seedCatalog.js inserts, leaving admin-created products alone.
 *
 *   npm run clean:seeded          # dry run — only prints what it would delete
 *   npm run clean:seeded -- --yes # actually delete
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Product } from '../models/Product.js';

const SEEDED_SLUGS = [
  'premium-acrylic-wall-photo-portrait',
  'premium-leather-photo-album',
  'square-round-acrylic-photo-wall-clock',
  'four-photo-collage-wall-clock',
  'modern-acrylic-house-name-plate',
  'monogram-initial-acrylic-name-plate',
  'modern-photo-wall-clock',
  'acrylic-mini-wall-gallery-set-of-6',
];

const confirmed = process.argv.includes('--yes');

await mongoose.connect(env.mongoUri);
console.log(`Database: ${mongoose.connection.name}`);

const all = await Product.find().select('slug title').lean();
const targets = all.filter((p) => SEEDED_SLUGS.includes(p.slug));
const keep = all.filter((p) => !SEEDED_SLUGS.includes(p.slug));

console.log(`\nSeeded demo products to delete (${targets.length}):`);
for (const p of targets) console.log(`  - ${p.slug}  (${p.title})`);

console.log(`\nAdmin-created products to keep (${keep.length}):`);
for (const p of keep) console.log(`  - ${p.slug}  (${p.title})`);

if (!confirmed) {
  console.log('\nDRY RUN — nothing deleted. Re-run with --yes to apply.');
} else if (targets.length === 0) {
  console.log('\nNothing to delete.');
} else {
  const result = await Product.deleteMany({ slug: { $in: SEEDED_SLUGS } });
  console.log(`\nDeleted ${result.deletedCount} products.`);
}

await mongoose.disconnect();
