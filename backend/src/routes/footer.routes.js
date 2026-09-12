import { Router } from 'express';
import { getPublicFooter } from '../controllers/footer.controller.js';

export const footerRoutes = Router();

footerRoutes.get('/', getPublicFooter);
