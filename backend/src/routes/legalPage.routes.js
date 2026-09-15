import { Router } from 'express';
import { getPublicLegalPage, listPublicLegalPages } from '../controllers/legalPage.controller.js';

export const legalPageRoutes = Router();

legalPageRoutes.get('/', listPublicLegalPages);
legalPageRoutes.get('/:slug', getPublicLegalPage);
