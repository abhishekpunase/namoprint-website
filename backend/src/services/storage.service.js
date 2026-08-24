import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { isS3Enabled, s3Client } from '../config/s3.js';
import { ApiError } from '../utils/apiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

/** React → S3 (presigned PUT). MongoDB stores the object key. Display uses signed GET URLs. */
export function getStorageBackend() {
  return isS3Enabled ? 's3' : 'local';
}

const signedGetExpiresIn = () =>
  Math.min(Math.max(Number(env.aws.signedGetExpiresIn || 3600), 60), 7 * 24 * 3600);

const encodeObjectKey = (key) =>
  String(key)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

export const publicS3Url = (key) => {
  const encodedKey = encodeObjectKey(key);
  const custom = String(env.aws.publicBaseUrl || '').replace(/\/+$/, '');
  if (custom) return `${custom}/${encodedKey}`;
  return `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${encodedKey}`;
};

export const createPresignedPut = async ({ key, contentType, expiresIn = 300 }) => {
  if (!isS3Enabled) {
    throw new ApiError(503, 'S3 is not configured');
  }

  const command = new PutObjectCommand({
    Bucket: env.aws.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn,
    signableHeaders: new Set(['host', 'content-type']),
  });
  return {
    uploadUrl,
    key,
    expiresIn,
    contentType,
  };
};

export const createPresignedGet = async ({ key, expiresIn = signedGetExpiresIn() }) => {
  if (!isS3Enabled) {
    throw new ApiError(503, 'S3 is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: env.aws.bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

export const extractS3Key = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!/^https?:\/\//i.test(trimmed)) return null;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const bucket = env.aws.bucket;
  if (!bucket) return null;
  const custom = String(env.aws.publicBaseUrl || '').replace(/\/+$/, '');
  const pathname = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));

  if (custom && trimmed.startsWith(`${custom}/`)) return pathname;
  if (parsed.hostname === `${bucket}.s3.${env.aws.region}.amazonaws.com`) return pathname;
  if (parsed.hostname === `${bucket}.s3.amazonaws.com`) return pathname;
  if (parsed.hostname.startsWith('s3.') && pathname.startsWith(`${bucket}/`)) {
    return pathname.slice(bucket.length + 1);
  }

  return null;
};

/** Stored URL/key → short-lived signed GET URL. Returns the original value when S3 is off. */
export const signStoredUrl = async (storedUrl, storedKey) => {
  if (!isS3Enabled) return storedUrl || '';
  const key = storedKey || extractS3Key(storedUrl);
  if (!key) return storedUrl || '';
  return createPresignedGet({ key });
};

export const signMediaInJson = async (body) => {
  if (!isS3Enabled || body == null) return body;

  const cache = new Map();
  const signKey = async (key) => {
    if (!cache.has(key)) cache.set(key, createPresignedGet({ key }));
    return cache.get(key);
  };

  const walk = async (value) => {
    if (typeof value === 'string') {
      const key = extractS3Key(value);
      if (!key) return value;
      if (/[?&]X-Amz-Signature=/i.test(value) && /x-id=PutObject/i.test(value)) return value;
      return signKey(key);
    }
    if (value == null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return Promise.all(value.map(walk));
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = k === 'uploadUrl' ? v : await walk(v);
    }
    return out;
  };

  return walk(JSON.parse(JSON.stringify(body)));
};

export const headObject = async (key) => {
  try {
    const result = await s3Client.send(
      new HeadObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
      }),
    );
    return {
      contentType: result.ContentType,
      contentLength: result.ContentLength || 0,
    };
  } catch {
    throw new ApiError(400, 'File was not found in storage. Please upload again.');
  }
};

export const getObjectBuffer = async (key) => {
  try {
    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
      }),
    );
    const bytes = await result.Body.transformToByteArray();
    return {
      buffer: Buffer.from(bytes),
      contentType: result.ContentType,
      contentLength: result.ContentLength || bytes.length,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'File was not found in storage. Please upload again.');
  }
};

export const deleteObject = async (key) => {
  if (!isS3Enabled || !key) return;
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
      }),
    );
  } catch {
    /* staging cleanup is best-effort */
  }
};

const putS3 = async ({ key, buffer, contentType }) => {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  } catch (error) {
    throw new ApiError(
      502,
      error?.message ||
        'S3 upload failed. Check AWS_S3_BUCKET, keys, region, and IAM s3:PutObject permission.',
    );
  }

  return {
    storage: 's3',
    key,
    url: publicS3Url(key),
  };
};

/**
 * Persist bytes, return a public URL. MongoDB stores `url` (and `key`) only — not the file.
 */
export const putBuffer = async ({ key, buffer, contentType }) => {
  if (isS3Enabled) {
    return putS3({ key, buffer, contentType });
  }

  const filePath = path.join(uploadDir, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);

  return {
    storage: 'local',
    key,
    url: `${env.localUploadPublicUrl}/${key.replaceAll('\\', '/')}`,
  };
};
