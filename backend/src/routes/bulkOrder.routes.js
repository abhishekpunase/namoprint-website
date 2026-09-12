import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitBulkOrderInquiry } from '../controllers/bulkOrder.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { bulkOrderInquirySchema } from '../validators/bulkOrder.validator.js';

export const bulkOrderRoutes = Router();

const bulkOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many bulk order requests. Please try again later.' },
});

bulkOrderRoutes.post('/', bulkOrderLimiter, validate(bulkOrderInquirySchema), submitBulkOrderInquiry);
