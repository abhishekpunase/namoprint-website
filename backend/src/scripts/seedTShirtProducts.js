import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { DEFAULT_TSHIRT_PRODUCTS } from '../config/seedTShirtProducts.js';
import { TShirtProduct } from '../models/TShirtProduct.js';

const run = async () => {
  await mongoose.connect(env.mongoUri);
  console.log('Seeding T-Shirt products…');

  for (const entry of DEFAULT_TSHIRT_PRODUCTS) {
    const exists = await TShirtProduct.findOne({ slug: entry.slug });
    if (exists) {
      console.log(`Skip (exists): ${entry.slug}`);
      continue;
    }
    await TShirtProduct.create(entry);
    console.log(`Created: ${entry.title}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
