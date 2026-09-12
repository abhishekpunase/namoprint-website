import { Router } from 'express';
import { getPublicProductOfTheMonth } from '../controllers/productOfTheMonth.controller.js';

export const productOfTheMonthRoutes = Router();

productOfTheMonthRoutes.get('/', getPublicProductOfTheMonth);
