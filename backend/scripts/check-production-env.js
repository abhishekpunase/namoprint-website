/**
 * Validates production environment without starting the server.
 * Usage: IS_DEV=false node scripts/check-production-env.js
 */
import '../src/config/env.js';

console.log('Production environment variables look valid.');
