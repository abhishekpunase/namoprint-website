import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { isS3Enabled, s3Client } from '../config/s3.js';
import { ApiError } from '../utils/apiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

/** React → Node → S3 → public URL stored in MongoDB. Local disk only if AWS keys are unset. */
export function getStorageBackend() {
  return isS3Enabled ? 's3' : 'local';
}

const encodeObjectKey = (key) =>
  String(key)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

const publicS3Url = (key) => {
  const encodedKey = encodeObjectKey(key);
  const custom = String(env.aws.publicBaseUrl || '').replace(/\/+$/, '');
  if (custom) return `${custom}/${encodedKey}`;
  return `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${encodedKey}`;
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
        'S3 upload failed. Check AWS_S3_BUCKET, keys, region, and a public-read bucket policy.',
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
