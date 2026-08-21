import { getApiOrigin } from '../config/apiConfig'

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i

/** Paths served by the Vite frontend (public/) — must not be prefixed with the API origin. */
const FRONTEND_STATIC_PREFIXES = ['/mockups/', '/products/', '/assets/']

function rewriteLocalhostUrl(url) {
  if (!LOCALHOST_ORIGIN_RE.test(url)) return url
  const origin = getApiOrigin()
  const pathPart = url.replace(LOCALHOST_ORIGIN_RE, '')
  return `${origin}${pathPart.startsWith('/') ? pathPart : `/${pathPart}`}`
}

/** Normalize relative or localhost upload paths for <img src>. Origin always comes from .env. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return rewriteLocalhostUrl(trimmed)
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  const origin = getApiOrigin()
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('/mockups/')) {
      return `/products${trimmed}`
    }
    if (FRONTEND_STATIC_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
      return trimmed
    }
    return `${origin}${trimmed}`
  }
  return `${origin}/${trimmed.replace(/^\/+/, '')}`
}

export function resolveProductImage(product, index = 0) {
  const raw = product?.images?.[index] || product?.images?.[0] || product?.mockup?.baseImageUrl || ''
  return resolveMediaUrl(raw)
}
