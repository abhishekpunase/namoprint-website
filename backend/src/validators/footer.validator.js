import Joi from 'joi';

const pathRule = Joi.string()
  .trim()
  .min(1)
  .max(300)
  .pattern(/^\/[^\s]*$/)
  .message('Path must start with / (example: /about)');

const footerLinkSchema = Joi.object({
  _id: Joi.string().hex().length(24),
  label: Joi.string().min(1).max(80).required(),
  path: pathRule.required(),
  group: Joi.string().valid('categories', 'quick', 'policies', 'bottom').required(),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

export const footerUpdateSchema = Joi.object({
  body: Joi.object({
    aboutText: Joi.string().allow('').max(800),
    copyright: Joi.string().allow('').max(200),
    headings: Joi.object({
      categories: Joi.string().allow('').max(40),
      quick: Joi.string().allow('').max(40),
      policies: Joi.string().allow('').max(40),
    }),
    socials: Joi.object({
      facebook: Joi.string().allow('').max(400),
      instagram: Joi.string().allow('').max(400),
      youtube: Joi.string().allow('').max(400),
    }),
    links: Joi.array().items(footerLinkSchema).max(60),
  }).min(1),
  params: Joi.object(),
  query: Joi.object(),
});
