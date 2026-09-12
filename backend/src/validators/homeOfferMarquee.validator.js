import Joi from 'joi';

const itemBody = {
  text: Joi.string().min(2).max(300).required(),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
};

export const homeOfferMarqueeSchema = Joi.object({
  body: Joi.object(itemBody),
  params: Joi.object(),
  query: Joi.object(),
});

export const homeOfferMarqueeUpdateSchema = Joi.object({
  body: Joi.object({
    text: Joi.string().min(2).max(300),
    sortOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
  }).min(1),
  params: Joi.object({ id: Joi.string().required() }),
  query: Joi.object(),
});

export const homeOfferMarqueeReplaceSchema = Joi.object({
  body: Joi.object({
    lines: Joi.array()
      .items(
        Joi.alternatives().try(
          Joi.string().min(2).max(300),
          Joi.object({
            text: Joi.string().min(2).max(300).required(),
            isActive: Joi.boolean(),
          }),
        ),
      )
      .max(20)
      .required(),
  }),
  params: Joi.object(),
  query: Joi.object(),
});
