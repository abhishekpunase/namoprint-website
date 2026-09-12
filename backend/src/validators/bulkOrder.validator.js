import Joi from 'joi';
import { requiredEmail } from './emailField.js';

export const bulkOrderInquirySchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    email: requiredEmail(),
    phone: Joi.string().min(8).max(20).required(),
    company: Joi.string().max(160).allow('', null),
    productInterest: Joi.string().max(160).allow('', null),
    quantity: Joi.string().max(80).allow('', null),
    message: Joi.string().max(4000).allow('', null),
  }),
  params: Joi.object(),
  query: Joi.object(),
});

export const bulkOrderInquiryUpdateSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('new', 'contacted', 'quoted', 'closed'),
    adminNote: Joi.string().max(4000).allow('', null),
  }).min(1),
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  query: Joi.object(),
});
