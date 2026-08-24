import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { isS3Enabled } from '../config/s3.js';
import {
  allowedImageMimeTypes,
  allowedVideoMimeTypes,
  blockedDesignMimeTypes,
  IMAGE_TYPE_MESSAGE,
} from '../middlewares/upload.middleware.js';
import { Product } from '../models/Product.js';
import { UploadAsset } from '../models/UploadAsset.js';
import { buildPreviewPayload, optimizeCustomerImage } from '../services/image.service.js';
import { recordStoredObject, storeUploadedDesign, storeUploadedVideo } from '../services/media.service.js';
import {
  createPresignedGet,
  createPresignedPut,
  deleteObject,
  getObjectBuffer,
  headObject,
} from '../services/storage.service.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const KIND_PREFIX = {
  photo: 'customer-uploads',
  design: 'design-uploads',
  video: 'category-videos',
};

const ownerSegment = (user) => String(user?._id || 'guest');

const extensionFor = (fileName = '', contentType = '') => {
  const fromName = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fromName) return fromName;
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/svg+xml') return 'svg';
  if (contentType === 'video/webm') return 'webm';
  if (contentType === 'video/quicktime') return 'mov';
  if (contentType === 'video/mp4') return 'mp4';
  return 'bin';
};

const assertKindAccess = (kind, user) => {
  if (kind === 'video' && user?.role !== 'admin') {
    throw new ApiError(403, 'Only admins can upload videos');
  }
  if (kind === 'design' && !user) {
    throw new ApiError(401, 'Authentication required');
  }
};

const assertKindLimits = ({ kind, contentType, sizeBytes }) => {
  if (kind === 'photo' && !allowedImageMimeTypes.includes(contentType)) {
    throw new ApiError(415, IMAGE_TYPE_MESSAGE);
  }
  if (kind === 'video' && !allowedVideoMimeTypes.includes(contentType)) {
    throw new ApiError(415, 'Only MP4, WEBM, or MOV videos are allowed');
  }
  if (kind === 'design' && blockedDesignMimeTypes.includes(contentType)) {
    throw new ApiError(415, 'Executable files are not allowed');
  }

  const maxBytes =
    kind === 'video'
      ? env.maxVideoMb * 1024 * 1024
      : kind === 'design'
        ? env.maxImageMb * 1024 * 1024 * 2
        : env.maxImageMb * 1024 * 1024;

  if (sizeBytes > maxBytes) {
    throw new ApiError(400, `File is too large. Maximum upload size is ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  }
};

const assertOwnedKey = ({ kind, key, user }) => {
  const expected = `${KIND_PREFIX[kind]}/${ownerSegment(user)}/`;
  if (!key.startsWith(expected) || key.includes('..')) {
    throw new ApiError(403, 'Invalid upload key');
  }
};

export const presignUpload = asyncHandler(async (req, res) => {
  const fileName = req.body.fileName || req.body.filename;
  const { kind, contentType, sizeBytes } = req.body;
  assertKindAccess(kind, req.user);
  assertKindLimits({ kind, contentType, sizeBytes });

  if (!isS3Enabled) {
    return res.json({
      success: true,
      directUpload: false,
      storage: 'local',
    });
  }

  const key = `${KIND_PREFIX[kind]}/${ownerSegment(req.user)}/${nanoid(18)}/source.${extensionFor(fileName, contentType)}`;
  const signed = await createPresignedPut({ key, contentType });

  res.json({
    success: true,
    directUpload: true,
    storage: 's3',
    ...signed,
  });
});

export const completeUpload = asyncHandler(async (req, res) => {
  const { kind, key, fileName, contentType } = req.body;
  assertKindAccess(kind, req.user);
  assertOwnedKey({ kind, key, user: req.user });

  if (!isS3Enabled) {
    throw new ApiError(503, 'S3 is not configured');
  }

  const meta = await headObject(key);
  assertKindLimits({
    kind,
    contentType: contentType || meta.contentType,
    sizeBytes: meta.contentLength || 1,
  });

  let data;
  if (kind === 'photo') {
    const object = await getObjectBuffer(key);
    data = await optimizeCustomerImage({
      file: {
        buffer: object.buffer,
        originalname: fileName,
        mimetype: contentType || object.contentType || 'application/octet-stream',
        size: object.contentLength,
      },
      userId: req.user?._id,
    });
    if (data.key !== key) await deleteObject(key);
  } else {
    data = recordStoredObject({
      key,
      originalName: fileName,
      mimeType: contentType || meta.contentType,
      sizeBytes: meta.contentLength,
    });
  }

  const asset = await UploadAsset.create({ ...data, user: req.user?._id });
  res.status(201).json({ success: true, asset: asset.toJSON() });
});

export const getSignedAssetPreview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid upload id');
  }

  const asset = await UploadAsset.findById(id);
  if (!asset) throw new ApiError(404, 'Upload asset not found');

  if (asset.storage !== 's3') {
    return res.json({
      success: true,
      url: asset.optimizedUrl || asset.url,
      key: asset.optimizedKey || asset.key,
    });
  }

  const key = asset.optimizedKey || asset.key;
  const url = await createPresignedGet({ key });
  res.json({ success: true, url, key, expiresIn: 3600 });
});

export const uploadCustomerPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Photo is required');

  const data = await optimizeCustomerImage({ file: req.file, userId: req.user?._id });
  const asset = await UploadAsset.create({ ...data, user: req.user?._id });

  res.status(201).json({ success: true, asset: asset.toJSON() });
});

export const uploadDesignFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Design file is required');

  const data = await storeUploadedDesign({ file: req.file, userId: req.user?._id });
  const asset = await UploadAsset.create({ ...data, user: req.user?._id });

  res.status(201).json({ success: true, asset: asset.toJSON() });
});

export const uploadAdminVideo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Video file is required');

  const data = await storeUploadedVideo({ file: req.file, userId: req.user?._id });
  const asset = await UploadAsset.create({ ...data, user: req.user?._id });

  res.status(201).json({ success: true, asset: asset.toJSON() });
});

export const previewProductPhoto = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.productId) || !mongoose.Types.ObjectId.isValid(req.body.assetId)) {
    throw new ApiError(400, 'Preview not available for this product yet.');
  }

  const [product, asset] = await Promise.all([
    Product.findById(req.body.productId),
    UploadAsset.findById(req.body.assetId)
  ]);

  if (!product) throw new ApiError(404, 'Product not found');
  if (!asset) throw new ApiError(404, 'Upload asset not found');

  if (req.body.crop) {
    asset.crop = req.body.crop;
    await asset.save();
  }

  res.json({
    success: true,
    preview: await buildPreviewPayload({ product, asset, crop: req.body.crop })
  });
});
