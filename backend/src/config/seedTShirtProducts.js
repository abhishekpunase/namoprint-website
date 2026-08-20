import { TShirtProduct } from '../models/TShirtProduct.js';

/** Matches storefront fallback catalog + dedicated t-shirt listing. */
export const DEFAULT_TSHIRT_PRODUCTS = [
  {
    title: 'Custom Photo & Text T-Shirt',
    slug: 'custom-photo-text-t-shirt',
    description: 'Soft cotton t-shirt printed with your photo or custom text design.',
    longDescription:
      'Upload a photo or logo and add optional print notes. Premium cotton with fade-resistant print, unisex fit, and sizes from S through XXL. Same cart and checkout flow as all Namo Prints products.',
    highlights: ['100% cotton', 'Fade resistant print', 'Unisex fit'],
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop',
    ],
    price: 399,
    compareAtPrice: 599,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 400,
    rating: 4.5,
    reviewCount: 128,
    isFeatured: true,
    isActive: true,
    sortOrder: 0,
  },
  {
    title: 'Sports Dry-Fit T-Shirt',
    slug: 'sports-dry-fit-t-shirt',
    description: 'Lightweight dry-fit tee with your custom logo or text — perfect for teams, events, and promotions.',
    longDescription:
      'Our Sports Dry-Fit T-Shirt is built for comfort and performance. Upload your logo in JPG, PNG, or SVG and tell us exactly where to print. Available in S through XXL with the same per-piece price. Ideal for sports teams, corporate events, and bulk orders.',
    highlights: ['Dry-fit fabric', 'HD print', 'All sizes', 'Bulk friendly'],
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop',
    ],
    price: 699,
    compareAtPrice: 804,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 500,
    rating: 4.3,
    reviewCount: 655,
    isFeatured: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    title: 'Premium Cotton Round Neck T-Shirt',
    slug: 'premium-cotton-round-neck-t-shirt',
    description: 'Soft cotton tee with vibrant custom printing for everyday wear and gifting.',
    longDescription:
      'Premium 180 GSM cotton with smooth finish. Upload your artwork and select quantities per size. Same easy cart → checkout flow as all Namo Prints products.',
    highlights: ['100% cotton feel', 'Soft touch', 'Vivid colors', 'Gift ready'],
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80&auto=format&fit=crop',
    ],
    price: 499,
    compareAtPrice: 649,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 400,
    rating: 4.6,
    reviewCount: 312,
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
  },
];

/** Upsert missing slugs so /tshirt-printing/:slug works even if other tees already exist. */
export async function ensureTShirtProducts() {
  let created = 0;
  for (const entry of DEFAULT_TSHIRT_PRODUCTS) {
    const exists = await TShirtProduct.findOne({ slug: entry.slug });
    if (exists) continue;
    await TShirtProduct.create(entry);
    created += 1;
  }
  if (created > 0) {
    console.log(`T-shirt products seeded (${created} new).`);
  }
}
