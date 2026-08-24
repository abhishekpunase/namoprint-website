import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export const allowedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
];

export const IMAGE_TYPE_MESSAGE =
  'Only JPEG, PNG, WEBP, AVIF, GIF, SVG, HEIC images are allowed';
export const allowedVideoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
export const blockedDesignMimeTypes = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-msdos-program',
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxImageMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageMimeTypes.includes(file.mimetype)) {
      cb(new ApiError(415, IMAGE_TYPE_MESSAGE));
      return;
    }
    cb(null, true);
  }
});

export const uploadDesign = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxImageMb * 1024 * 1024 * 2 },
  fileFilter: (_req, file, cb) => {
    if (blockedDesignMimeTypes.includes(file.mimetype)) {
      cb(new ApiError(415, 'Executable files are not allowed'));
      return;
    }
    cb(null, true);
  },
});

export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxVideoMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedVideoMimeTypes.includes(file.mimetype)) {
      cb(new ApiError(415, 'Only MP4, WEBM, or MOV videos are allowed'));
      return;
    }
    cb(null, true);
  },
});
