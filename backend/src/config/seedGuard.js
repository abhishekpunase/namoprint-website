/** Shared guard — demo/catalog seeds must not run in production unless explicitly enabled. */
import { env } from './env.js';

export function shouldSeedDemoContent() {
  if (!env.isDev) {
    return process.env.SEED_ON_START === 'true';
  }
  if (process.env.SEED_ON_START === 'false') return false;
  if (process.env.SEED_DEV_USERS === 'false' && process.env.SEED_DEV_CATALOG === 'false') {
    return false;
  }
  return true;
}
