import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: env.rateLimitWindowMs
};

/** Admin panel screens fan out to many endpoints per page, so they get a larger budget. */
const ADMIN_MULTIPLIER = 4;

export const apiLimiter = rateLimit({
  ...base,
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
