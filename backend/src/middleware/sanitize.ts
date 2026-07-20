import { Request, Response, NextFunction } from 'express'
import xss from 'xss'

// ─── XSS Sanitization Options ────────────────────────────────
// Strip all HTML tags. Allow only plain text.
const xssOptions = {
  whiteList: {},          // No HTML tags allowed
  stripIgnoreTag: true,   // Strip all non-whitelisted tags
  stripIgnoreTagBody: ['script', 'style'], // Remove script/style entirely
}

// ─── Deep Sanitize Object ────────────────────────────────────
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return xss(value, xssOptions).trim()
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val)
    }
    return sanitized
  }
  return value
}

// ─── Sanitize Middleware ─────────────────────────────────────
// Recursively strips XSS from all string values in req.body.
// Place this BEFORE validateBody in your route chains.
export function sanitize(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body)
  }
  // Also sanitize query params (some routes use them for search)
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        (req.query as Record<string, string>)[key] = xss(value, xssOptions).trim()
      }
    }
  }
  next()
}
