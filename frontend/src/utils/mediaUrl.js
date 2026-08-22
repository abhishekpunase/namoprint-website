import { getApiOrigin, getRemoteApiOrigin, isDev } from '../config/apiConfig'

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i

/** Paths served by the Vite frontend (public/) — must not be prefixed with the API origin. */
const FRONTEND_STATIC_PREFIXES = ['/mockups/', '/products/', '/assets/']

function toSameOriginPath(url) {
  const pathPart = url.replace(LOCALHOST_ORIGIN_RE, '')
  return pathPart.startsWith('/') ? pathPart : `/${pathPart}`
}

function rewriteLocalhostUrl(url) {
  if (!LOCALHOST_ORIGIN_RE.test(url)) return url
  return toSameOriginPath(url)
}

function rewriteRemoteUploadForDev(url) {
  if (isDev() || !/^https?:\/\//i.test(url)) return url
  const remote = getRemoteApiOrigin()
  if (remote && url.startsWith(`${remote}/uploads/`)) {
    return url.slice(remote.length)
  }
  return url
}

/** Normalize relative or localhost upload paths for <img src>. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) {
    if (LOCALHOST_ORIGIN_RE.test(trimmed)) return resolveMediaUrl(rewriteLocalhostUrl(trimmed))
    return rewriteRemoteUploadForDev(trimmed)
  }
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('/mockups/')) {
      return `/products${trimmed}`
    }
    if (FRONTEND_STATIC_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
      return trimmed
    }
    if (trimmed.startsWith('/uploads/')) {
      if (isDev()) return trimmed
      const origin = getRemoteApiOrigin()
      return origin ? `${origin}${trimmed}` : trimmed
    }
    const origin = getApiOrigin()
    return origin ? `${origin}${trimmed}` : trimmed
  }
  const origin = getApiOrigin()
  return origin ? `${origin}/${trimmed.replace(/^\/+/, '')}` : `/${trimmed.replace(/^\/+/, '')}`
}

export function resolveProductImage(product, index = 0) {
  const raw = product?.images?.[index] || product?.images?.[0] || product?.mockup?.baseImageUrl || ''
  return resolveMediaUrl(raw)
}

/** Unreliable public demo CDNs that trigger Chrome ERR_CACHE_OPERATION_NOT_SUPPORTED */
const FLAKY_VIDEO_HOST_RE =
  /(?:test-videos\.co\.uk|filesamples\.com|learningcontainer\.com|samplelib\.com)/i

const RELIABLE_REEL_VIDEOS = [
  'https://rqnknqgpqttjqqhaejmt.supabase.co/storage/v1/object/public/reel-videos/videos/1766941654703-romtz.mp4',
  'https://rqnknqgpqttjqqhaejmt.supabase.co/storage/v1/object/public/reel-videos/videos/1766938943981-d5vchq.mp4',
  'https://rqnknqgpqttjqqhaejmt.supabase.co/storage/v1/object/public/reel-videos/videos/1766942064646-wtya9i.mp4',
]

/** Swap flaky demo video hosts for known-good Supabase reel URLs (stable for carousel). */
export function sanitizeCarouselVideoUrl(url, salt = '') {
  const resolved = resolveMediaUrl(url)
  if (!resolved || !FLAKY_VIDEO_HOST_RE.test(resolved)) return resolved
  let hash = 0
  const key = `${resolved}|${salt}`
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return RELIABLE_REEL_VIDEOS[hash % RELIABLE_REEL_VIDEOS.length]
}
