import Joi from 'joi';

const couponBody = {
  code: Joi.string().trim().uppercase().min(3).max(24).pattern(/^[A-Z0-9_-]+$/).required(),
  name: Joi.string().trim().min(2).max(80).required(),
  type: Joi.string().valid('percent', 'fixed').required(),
  value: Joi.number().min(0).required(),
  maxUses: Joi.number().integer().min(1).max(10000).required(),
  isActive: Joi.boolean(),
  minSubtotal: Joi.number().min(0).allow(null),
  expiresAt: Joi.date().allow(null, ''),
  notes: Joi.string().trim().allow('').max(300),
};

export const adminCouponCreateSchema = Joi.object({
  body: Joi.object(couponBody),
  params: Joi.object(),
  query: Joi.object(),
});

export const adminCouponUpdateSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80),
    type: Joi.string().valid('percent', 'fixed'),
    value: Joi.number().min(0),
    maxUses: Joi.number().integer().min(1).max(10000),
    isActive: Joi.boolean(),
    minSubtotal: Joi.number().min(0).allow(null),
    expiresAt: Joi.date().allow(null, ''),
    notes: Joi.string().trim().allow('').max(300),
  }).min(1),
  params: Joi.object({ id: Joi.string().required() }),
  query: Joi.object(),
});
