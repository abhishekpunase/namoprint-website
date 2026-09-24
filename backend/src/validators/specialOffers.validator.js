import Joi from 'joi';

const offerCardSchema = Joi.object({
  _id: Joi.string().hex().length(24),
  title: Joi.string().allow('').max(120),
  subtitle: Joi.string().allow('').max(120),
  description: Joi.string().allow('').max(1000),
  code: Joi.string().allow('').max(60),
  icon: Joi.string().valid('percent', 'gift', 'truck', 'sparkles'),
  gradient: Joi.string().allow('').max(200),
  action: Joi.string().valid('claim', 'bulk', 'link'),
  cta: Joi.string().allow('').max(80),
  href: Joi.string().allow('').max(500),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

export const specialOffersUpdateSchema = Joi.object({
  body: Joi.object({
    eyebrow: Joi.string().allow('').max(120),
    title: Joi.string().allow('').max(200),
    titleAccent: Joi.string().allow('').max(200),
    subtitle: Joi.string().allow('').max(1000),
    isActive: Joi.boolean(),
    cards: Joi.array().items(offerCardSchema).max(12),
  }).min(1),
  params: Joi.object(),
  query: Joi.object(),
});
