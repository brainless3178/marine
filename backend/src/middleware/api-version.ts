import { Request, Response, NextFunction } from 'express'

// API version metadata
export const API_VERSION = {
  version: '1.0.0',
  released: '2026-07-29',
  deprecated: false,
  sunset: null as string | null,
}

// Deprecation header middleware for /api/ (non-v1) routes
// Adds Sunset and Deprecation headers to warn clients to migrate
export function apiDeprecationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to /api/ routes (not /api/v1/)
  if (req.path.startsWith('/api/') && !req.path.startsWith('/api/v1/')) {
    res.setHeader('Deprecation', 'true')
    res.setHeader('Sunset', 'Sat, 01 Jan 2027 00:00:00 GMT')
    res.setHeader('X-API-Warn', 'This endpoint is deprecated. Use /api/v1/ instead.')
  }
  next()
}
