import Joi from 'joi';

const uploadKind = Joi.string().valid('photo', 'design', 'video').required();

export const presignSchema = Joi.object({
  body: Joi.object({
    kind: uploadKind,
    fileName: Joi.string().max(255),
    filename: Joi.string().max(255),
    contentType: Joi.string().max(120).required(),
    sizeBytes: Joi.number().integer().min(1).required(),
  }).or('fileName', 'filename'),
  params: Joi.object(),
  query: Joi.object(),
});

export const completeSchema = Joi.object({
  body: Joi.object({
    kind: uploadKind,
    key: Joi.string().max(512).required(),
    fileName: Joi.string().max(255).required(),
    contentType: Joi.string().max(120).required(),
  }),
  params: Joi.object(),
  query: Joi.object(),
});

export const previewSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().required(),
    assetId: Joi.string().required(),
    crop: Joi.object({
      x: Joi.number().default(0),
      y: Joi.number().default(0),
      width: Joi.number().min(0.01).default(1),
      height: Joi.number().min(0.01).default(1),
      rotate: Joi.number().default(0),
      scale: Joi.number().min(0.1).default(1)
    })
  }),
  params: Joi.object(),
  query: Joi.object()
});
