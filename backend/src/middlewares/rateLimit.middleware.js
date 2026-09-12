import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: env.rateLimitWindowMs
};

/** Admin panel screens fan out to many endpoints per page, so they get a larger budget. */
const ADMIN_MULTIPLIER = 4;

const PUBLIC_GET_PREFIXES = [
  '/products',
  '/god-products',
  '/nameplates',
  '/tshirt-printing',
  '/corporate-gifts',
  '/baby-birth-frames',
  '/trophies',
  '/pen-prints',
  '/uv-dtf-stickers',
  '/product-label-stickers',
  '/categories',
  '/home-slides',
  '/home-testimonials',
  '/home-offer-marquee',
  '/category-carousel',
  '/product-reels',
  '/header-menu',
  '/footer',
  '/product-of-the-month',
  '/health',
];

function isPublicCatalogGet(req) {
  if (req.method !== 'GET') return false;
  const path = String(req.path || '');
  if (path.startsWith('/admin')) return false;
  return PUBLIC_GET_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export const apiLimiter = rateLimit({
  ...base,
  skip: isPublicCatalogGet,
  max: (req) => {
    if (env.nodeEnv === 'development') return 5000;
    return req.path.startsWith('/admin') ? env.rateLimitMax * ADMIN_MULTIPLIER : env.rateLimitMax;
  },
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

export const authLimiter = rateLimit({
  ...base,
  max: env.nodeEnv === 'development' ? 100 : env.authRateLimitMax,
  message: { success: false, message: 'Too many auth attempts. Please wait.' }
});

export const uploadLimiter = rateLimit({
  ...base,
  max: env.uploadRateLimitMax,
  message: { success: false, message: 'Too many uploads. Please wait.' }
});
