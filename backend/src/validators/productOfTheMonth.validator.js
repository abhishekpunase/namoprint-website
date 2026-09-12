import Joi from 'joi';

const objectId = Joi.string().hex().length(24).allow(null, '');

export const productOfTheMonthUpdateSchema = Joi.object({
  body: Joi.object({
    productId: objectId,
    productSource: Joi.string().trim().max(40).allow('', null),
    headline: Joi.string().trim().min(2).max(80),
    subtitle: Joi.string().trim().allow('').max(200),
    isActive: Joi.boolean(),
  }).min(1),
  params: Joi.object(),
  query: Joi.object(),
});
