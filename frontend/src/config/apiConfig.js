function normalizeApiBase(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  // Allow pasting http://host/api/health or http://host/api/api from the browser.
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

/** Resolve API base URL for dev (Vite proxy), production (same-origin), or explicit env. */
export function getApiBaseUrl() {
  const fromEnv = normalizeApiBase(import.meta.env.VITE_API_BASE_URL)
  if (fromEnv) return fromEnv

  // Same-origin /api — works with Vite dev proxy and production reverse proxy / static serve.
  return '/api'
}

export function getApiOrigin() {
  const base = getApiBaseUrl()
  if (base.startsWith('http')) {
    return originFromEnvUrl(base)
  }

  // Relative /api: keep media on the same host so Vite/nginx can proxy /uploads.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export function getNetworkErrorMessage() {
  if (import.meta.env.DEV) {
    return 'API server is not running. From the project root run: npm run dev — then open http://localhost:5173'
  }

  const base = getApiBaseUrl()
  if (base.startsWith('http')) {
    return `Cannot reach API at ${base}. Check server status or contact support.`
  }
  return 'Cannot reach API server. Please try again in a moment or contact support.'
}
