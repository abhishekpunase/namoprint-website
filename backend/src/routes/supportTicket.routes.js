import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createSupportTicket,
  getSupportTicket,
  listMySupportTickets,
  replySupportTicket,
  trackSupportTicket,
} from '../controllers/supportTicket.controller.js';
import { optionalAuth, protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createSupportTicketSchema, replySupportTicketSchema } from '../validators/supportTicket.validator.js';

export const supportTicketRoutes = Router();

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many support requests. Please try again later.' },
});

supportTicketRoutes.post('/', createLimiter, optionalAuth, validate(createSupportTicketSchema), createSupportTicket);
supportTicketRoutes.get('/track/:ticketId', trackSupportTicket);
supportTicketRoutes.get('/', protect, listMySupportTickets);
supportTicketRoutes.get('/:id', optionalAuth, getSupportTicket);
supportTicketRoutes.post('/:id/replies', optionalAuth, validate(replySupportTicketSchema), replySupportTicket);
