import { Router } from 'express';
import { listPublicHeaderMenu } from '../controllers/headerMenu.controller.js';

export const headerMenuRoutes = Router();

headerMenuRoutes.get('/', listPublicHeaderMenu);
