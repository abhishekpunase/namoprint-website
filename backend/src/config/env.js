import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Resolve backend/.env by file location, so pm2/systemd can start from any cwd. */
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const envPath = path.join(backendRoot, '.env');

dotenv.config({ path: envPath });
dotenv.config();

function parseEnvBool(value, fallback) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  const v = String(value).trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return fallback;
}

/** true = local dev  |  false = production. Set IS_DEV in .env (same idea as frontend VITE_IS_DEV). */
const isDev = parseEnvBool(
  process.env.IS_DEV,
  (process.env.NODE_ENV || 'development') !== 'production',
);
const isProduction = !isDev;
const nodeEnv = isDev ? 'development' : 'production';

const WEAK_SECRET_PATTERN = /change_this|dev_|^test|^secret$/i;

function productionSecretProblem(name, value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return `${name} is not set`;
  if (trimmed.length < 32) {
    return `${name} must be at least 32 characters (currently ${trimmed.length})`;
  }
  if (WEAK_SECRET_PATTERN.test(trimmed)) {
    return `${name} still looks like a dev placeholder — generate a new random value`;
  }
  return null;
}

function pickDevProd(devVar, prodVar, legacyVar, devDefault = '', prodDefault = '') {
  const read = (key) => String(process.env[key] || '').trim();
  if (isDev) return read(devVar) || read(legacyVar) || devDefault;
  return read(prodVar) || read(legacyVar) || prodDefault;
}

const port = Number(process.env.PORT || 5000);

const apiBaseUrl = pickDevProd(
  'DEV_API_BASE_URL',
  'PROD_API_BASE_URL',
  'API_BASE_URL',
  `http://localhost:${port}`,
  'https://api.namoprints.in',
);

const parseClientUrls = (raw) =>
  String(raw || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const clientUrls = parseClientUrls(
  pickDevProd(
    'DEV_CLIENT_URL',
    'PROD_CLIENT_URL',
    'CLIENT_URL',
    'http://localhost:5173',
    'https://www.namoprints.in,https://namoprints.in,https://ft.namoprints.in',
  ),
);

const passwordResetUrl = pickDevProd(
  'DEV_PASSWORD_RESET_URL',
  'PROD_PASSWORD_RESET_URL',
  'PASSWORD_RESET_URL',
  'http://localhost:5173/reset-password',
  'https://www.namoprints.in/reset-password',
);

const localUploadPublicUrl = pickDevProd(
  'DEV_LOCAL_UPLOAD_PUBLIC_URL',
  'PROD_LOCAL_UPLOAD_PUBLIC_URL',
  'LOCAL_UPLOAD_PUBLIC_URL',
  `http://localhost:${port}/uploads`,
  'https://api.namoprints.in/uploads',
);

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const problems = [];
const missing = new Set();

for (const key of required) {
  if (!process.env[key]) {
    problems.push(`${key} is not set`);
    missing.add(key);
  }
}

if (isProduction) {
  for (const name of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET']) {
    if (missing.has(name)) continue;
    const problem = productionSecretProblem(name, process.env[name]);
    if (problem) problems.push(problem);
  }

  if (process.env.USE_MEMORY_MONGO === 'true') {
    problems.push('USE_MEMORY_MONGO must be false — use MongoDB Atlas or another managed MongoDB');
  }

  if (/localhost|127\.0\.0\.1/i.test(localUploadPublicUrl)) {
    problems.push('PROD_LOCAL_UPLOAD_PUBLIC_URL must use your public domain, not localhost');
  }

  if (/localhost|127\.0\.0\.1/i.test(apiBaseUrl)) {
    problems.push('PROD_API_BASE_URL must use your public domain, not localhost');
  }

  if (!clientUrls.length) {
    problems.push('PROD_CLIENT_URL must list at least one frontend origin');
  } else if (!/^https:\/\//i.test(clientUrls[0])) {
    console.warn('WARNING: PROD_CLIENT_URL should use https:// in production for secure cookies and CORS.');
  }
}

// Report every problem at once — fixing these one restart at a time is slow.
if (problems.length) {
  throw new Error(
    `Backend environment is invalid (${problems.length} problem${problems.length > 1 ? 's' : ''}), checked ${envPath}:\n` +
      problems.map((problem) => `  - ${problem}`).join('\n'),
  );
}

export const env = {
  isDev,
  isProduction,
  nodeEnv,
  port,
  apiBaseUrl,
  clientUrl: clientUrls[0] || 'http://localhost:5173',
  clientUrls,
  passwordResetUrl,
  mongoUri: process.env.MONGO_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || (isDev ? '15m' : '8h'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  adminSetupSecret: process.env.ADMIN_SETUP_SECRET,
  cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_secret',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 1200),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  uploadRateLimitMax: Number(process.env.UPLOAD_RATE_LIMIT_MAX || 40),
  maxImageMb: Number(process.env.MAX_IMAGE_MB || 25),
  maxVideoMb: Number(process.env.MAX_VIDEO_MB || 50),
  localUploadPublicUrl,
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    bucket: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    publicBaseUrl: String(process.env.AWS_S3_PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
    signedGetExpiresIn: Number(process.env.AWS_SIGNED_GET_EXPIRES_IN || 3600),
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
    baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || '',
    weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5),
    length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM || 20),
    breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH_CM || 15),
    height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM || 5),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'OMGS <no-reply@omgs.in>',
  },
};
