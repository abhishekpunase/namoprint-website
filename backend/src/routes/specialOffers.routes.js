import { Router } from 'express';
import { getPublicSpecialOffers } from '../controllers/specialOffers.controller.js';

export const specialOffersRoutes = Router();

specialOffersRoutes.get('/', getPublicSpecialOffers);
