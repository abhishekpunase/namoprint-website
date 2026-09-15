import Joi from 'joi';
import { LEGAL_PAGE_SLUGS } from '../config/seedLegalPages.js';

const sectionSchema = Joi.object({
  title: Joi.string().allow('').max(300),
  content: Joi.string().allow('').max(20000),
});

const slugParam = Joi.object({
  slug: Joi.string()
    .valid(...LEGAL_PAGE_SLUGS)
    .required(),
});

export const legalPageUpdateSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(1).max(120).required(),
    titleAccent: Joi.string().allow('').max(120),
    updatedLabel: Joi.string().allow('').max(120),
    intro: Joi.string().allow('').max(10000),
    highlightTitle: Joi.string().allow('').max(300),
    highlightContent: Joi.string().allow('').max(10000),
    sections: Joi.array().items(sectionSchema).max(40),
    bulletsTitle: Joi.string().allow('').max(300),
    bullets: Joi.array().items(Joi.string().allow('').max(2000)).max(40),
    ctaTitle: Joi.string().allow('').max(300),
    ctaContent: Joi.string().allow('').max(5000),
    ctaButtonLabel: Joi.string().allow('').max(120),
    ctaButtonHref: Joi.string().allow('').max(1000),
  }),
  params: slugParam,
  query: Joi.object(),
});
