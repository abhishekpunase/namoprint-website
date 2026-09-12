import Joi from 'joi';

const pathRule = Joi.string()
  .trim()
  .min(1)
  .max(300)
  .pattern(/^\/[^\s]*$/)
  .message('Path must start with / (example: /products)');

const itemBody = {
  label: Joi.string().min(1).max(80).required(),
  path: pathRule.required(),
  group: Joi.string().valid('primary', 'more'),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
};

export const headerMenuSchema = Joi.object({
  body: Joi.object(itemBody),
  params: Joi.object(),
  query: Joi.object(),
});

export const headerMenuUpdateSchema = Joi.object({
  body: Joi.object({
    label: Joi.string().min(1).max(80),
    path: pathRule,
    group: Joi.string().valid('primary', 'more'),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }).min(1),
  params: Joi.object({ id: Joi.string().required() }),
  query: Joi.object(),
});
