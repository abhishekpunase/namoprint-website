import { env } from './env.js';

/** True only when `npm run seed` sets ALLOW_SEED. Backend start never seeds. */
export function isManualSeed() {
  return process.env.ALLOW_SEED === 'true';
}

export function canInsertDevUsers() {
  if (isManualSeed()) return true;
  if (process.env.SEED_DEV_USERS === 'false') return false;
  return env.isDev || process.env.USE_MEMORY_MONGO === 'true';
}

export function canInsertDevCatalog() {
  if (isManualSeed()) return true;
  if (process.env.SEED_DEV_CATALOG === 'false') return false;
  return env.isDev || process.env.USE_MEMORY_MONGO === 'true';
}
