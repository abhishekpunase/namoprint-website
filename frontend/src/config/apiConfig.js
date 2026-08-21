function normalizeApiBase(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  // Allow pasting http://host/api/health from the browser.
  trimmed = trimmed.replace(/\/health$/i, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
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

  // Relative VITE_API_BASE_URL=/api: use the backend origin from .env, not localhost:5173.
  if (import.meta.env.DEV) {
    const fromDevTarget = originFromEnvUrl(import.meta.env.VITE_DEV_API_TARGET)
    if (fromDevTarget) return fromDevTarget
  }

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
