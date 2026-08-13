import NodeCache from 'node-cache'
import type { NextFunction, Request, Response } from 'express'

/**
 * In-memory GET response cache (node-cache).
 *
 * Only static, high-traffic, rarely-changing storefront endpoints are cached
 * (settings, categories, brands, industries, offices, testimonials, homepage).
 * Every hit skips the database entirely — critical on Neon's free tier, where
 * a cold-start database connection can take seconds. A 5-minute TTL bounds
 * staleness, and admin/auth/authenticated requests are never cached.
 */

const responseCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }) // 5 min TTL, 1 min cleanup

// Normalized paths (after stripping /api or /api/v1) eligible for caching.
const CACHEABLE_PATHS = [
  '/storefront/settings',
  '/storefront/categories',
  '/storefront/brands',
  '/storefront/industries',
  '/storefront/offices',
  '/storefront/testimonials',
  '/storefront/homepage',
]

function isCacheable(path: string): boolean {
  const normalized = path.replace(/^\/api\/v1/, '/api').replace(/^\/api/, '')
  return CACHEABLE_PATHS.some((p) => normalized === p || normalized.startsWith(`${p}/`))
}

interface CachedResponse {
  status: number
  body: unknown
}

export function cacheGet(req: Request, res: Response, next: NextFunction) {
  // GET-only, no auth, whitelisted path — otherwise pass straight through.
  if (
    req.method !== 'GET' ||
    req.headers.authorization ||
    req.headers['x-csrf-token'] ||
    !isCacheable(req.path)
  ) {
    return next()
  }

  const key = req.originalUrl
  const cached = responseCache.get<CachedResponse>(key)
  if (cached) {
    res.status(cached.status).json(cached.body)
    return
  }

  // Wrap res.json so the first response populates the cache for the TTL.
  const originalJson = res.json.bind(res)
  res.json = ((body: unknown) => {
    responseCache.set(key, { status: res.statusCode, body })
    return originalJson(body)
  }) as typeof res.json

  next()
}

/** Exposed for tests / diagnostics — clear a single key or everything. */
export function clearCache(key?: string) {
  if (key) responseCache.del(key)
  else responseCache.flushAll()
}
