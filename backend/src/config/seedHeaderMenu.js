import { HeaderMenuItem } from '../models/HeaderMenuItem.js';

export const DEFAULT_HEADER_MENU = [
  { label: 'Home', path: '/', group: 'primary', sortOrder: 0 },
  { label: 'Shop', path: '/products', group: 'primary', sortOrder: 1 },
  { label: 'God Frame', path: '/god-photo-frames', group: 'primary', sortOrder: 2 },
  { label: 'Name Plate', path: '/name-plates', group: 'primary', sortOrder: 3 },
  { label: 'Baby Frames', path: '/baby-birth-frames', group: 'primary', sortOrder: 4 },
  { label: 'T-Shirt Print', path: '/t-shirt-printing', group: 'primary', sortOrder: 5 },
  { label: 'Wall Watches', path: '/custom-wall-watches', group: 'primary', sortOrder: 6 },
  { label: 'Pen Print', path: '/pen-print', group: 'more', sortOrder: 7 },
  { label: 'UV DTF Stickers', path: '/uv-dtf-stickers', group: 'more', sortOrder: 8 },
  { label: 'Product Labels', path: '/product-label-stickers', group: 'more', sortOrder: 9 },
  { label: 'Corporate Gifts', path: '/corporate-gifts', group: 'more', sortOrder: 10 },
  { label: 'Trophies', path: '/trophies', group: 'more', sortOrder: 11 },
];

export async function ensureHeaderMenu() {
  const count = await HeaderMenuItem.countDocuments();
  if (count > 0) return;

  await HeaderMenuItem.insertMany(DEFAULT_HEADER_MENU);
  console.log(`Header menu seeded (${DEFAULT_HEADER_MENU.length} items).`);
}
