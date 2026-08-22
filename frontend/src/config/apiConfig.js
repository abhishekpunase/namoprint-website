function normalizeApiBase(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  trimmed = trimmed.replace(/\/health$/i, '')
  trimmed = trimmed.replace(/(?:\/api)+$/i, '/api')
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`
}

/** Origin only — strips /api or /api/health if pasted from a browser URL. */
export function originFromEnvUrl(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return ''
  try {
    return new URL(trimmed).origin
  } catch {
    return trimmed.replace(/\/api(\/health)?\/?$/i, '').replace(/\/+$/, '')
  }
}

function parseEnvBool(value, fallback) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback
  const v = String(value).trim().toLowerCase()
  if (v === 'true' || v === '1' || v === 'yes') return true
  if (v === 'false' || v === '0' || v === 'no') return false
  return fallback
}

/** true = Vite proxy (local)  |  false = direct hosted API. Set VITE_IS_DEV in .env */
export function isDev() {
  return parseEnvBool(import.meta.env.VITE_IS_DEV, import.meta.env.DEV)
}

function prodApiBaseFromEnv() {
  return (
    normalizeApiBase(import.meta.env.VITE_PROD_API_BASE_URL) ||
    normalizeApiBase(import.meta.env.VITE_API_BASE_URL)
  )
}

/** Hosted API origin (production URL or VITE_DEV_API_TARGET origin). */
export function getRemoteApiOrigin() {
  const prodBase = prodApiBaseFromEnv()
  if (prodBase.startsWith('http')) return originFromEnvUrl(prodBase)
  const devTarget = String(import.meta.env.VITE_DEV_API_TARGET || '').trim()
  if (devTarget.startsWith('http')) return originFromEnvUrl(devTarget)
  return ''
}

/**
 * API base for fetch():
 * - isDev true  → /api (Vite proxies to VITE_DEV_API_TARGET)
 * - isDev false → VITE_PROD_API_BASE_URL (direct, e.g. https://api.namoprints.in/api)
 */
export function getApiBaseUrl() {
  if (!isDev()) {
    return prodApiBaseFromEnv() || '/api'
  }
  return '/api'
}

export function getApiOrigin() {
  const base = getApiBaseUrl()
  if (base.startsWith('http')) {
    return originFromEnvUrl(base)
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export function getNetworkErrorMessage() {
  if (!isDev()) {
    const base = getApiBaseUrl()
    return `Cannot reach API at ${base}. Check server status or your network connection.`
  }
  const target = String(import.meta.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:5000').trim()
  return `Local API is not running. Start the backend (expected at ${target}) or set VITE_IS_DEV=false.`
}
