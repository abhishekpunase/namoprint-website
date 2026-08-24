import { Router } from 'express';
import {
  completeUpload,
  getSignedAssetPreview,
  presignUpload,
  previewProductPhoto,
  uploadAdminVideo,
  uploadCustomerPhoto,
  uploadDesignFile,
} from '../controllers/upload.controller.js';
import { authorize, optionalAuth, protect } from '../middlewares/auth.middleware.js';
import { uploadLimiter } from '../middlewares/rateLimit.middleware.js';
import { upload, uploadDesign, uploadVideo } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { completeSchema, presignSchema, previewSchema } from '../validators/upload.validator.js';

export const uploadRoutes = Router();

uploadRoutes.post('/presign', optionalAuth, uploadLimiter, validate(presignSchema), presignUpload);
uploadRoutes.post('/presigned-url', optionalAuth, uploadLimiter, validate(presignSchema), presignUpload);
uploadRoutes.post('/complete', optionalAuth, uploadLimiter, validate(completeSchema), completeUpload);
uploadRoutes.get('/:id/preview', optionalAuth, getSignedAssetPreview);
uploadRoutes.post('/photo', optionalAuth, uploadLimiter, upload.single('photo'), uploadCustomerPhoto);
uploadRoutes.use(protect);
uploadRoutes.post('/design', uploadLimiter, uploadDesign.single('design'), uploadDesignFile);
uploadRoutes.post(
  '/video',
  uploadLimiter,
  authorize('admin'),
  uploadVideo.single('video'),
  uploadAdminVideo,
);
uploadRoutes.post('/preview', validate(previewSchema), previewProductPhoto);
