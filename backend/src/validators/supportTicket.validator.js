import Joi from 'joi';
import { SUPPORT_ISSUE_TYPES, SUPPORT_STATUSES } from '../models/SupportTicket.js';
import { requiredEmail } from './emailField.js';

const mediaUrl = Joi.alternatives().try(
  Joi.string().uri(),
  Joi.string().pattern(/^\/[^\s]+$/),
);

export const createSupportTicketSchema = Joi.object({
  body: Joi.object({
    customerName: Joi.string().min(2).max(120).required(),
    email: requiredEmail(),
    phone: Joi.string().min(8).max(20).required(),
    orderNo: Joi.string().max(60).allow('', null),
    issueType: Joi.string().valid(...SUPPORT_ISSUE_TYPES).required(),
    subject: Joi.string().min(4).max(160).required(),
    description: Joi.string().min(10).max(4000).required(),
    attachments: Joi.array().items(mediaUrl).max(5).default([]),
  }),
  params: Joi.object(),
  query: Joi.object(),
});

export const replySupportTicketSchema = Joi.object({
  body: Joi.object({
    message: Joi.string().min(1).max(4000).required(),
    attachments: Joi.array().items(mediaUrl).max(5).default([]),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).allow('', null),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object(),
});

export const adminUpdateSupportTicketSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid(...SUPPORT_STATUSES),
  }).min(1),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object(),
});
