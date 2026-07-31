import dotenv from 'dotenv'
dotenv.config()

// ─── Validate Required Environment Variables ───────────────
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'DATABASE_URL',
] as const

if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  console.error('FATAL: CORS_ORIGIN must be set in production.')
  process.exit(1)
}

const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v])
if (missingVars.length > 0) {
  startupLogger.fatal({ missingVars }, 'FATAL: Missing required environment variables')
  process.exit(1)
}

// Warn about missing PayPal config
if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  startupLogger.warn('PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not set. Payments will be unavailable.')
}

// Warn about weak secrets in production
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET!
  if (jwtSecret.length < 32) {
    startupLogger.warn('JWT_SECRET is shorter than 32 characters. Use a strong random secret in production.')
  }
  if (jwtSecret.includes('change') || jwtSecret.includes('dev') || jwtSecret.includes('placeholder')) {
    startupLogger.warn('JWT_SECRET contains insecure keywords. Replace with a strong random secret.')
  }
}

import logger, { startupLogger, dbLogger } from './utils/logger.js'
import { initSentry } from './utils/sentry.js'

// Initialize Sentry before anything else
initSentry()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { sanitize } from './middleware/sanitize.js'
import { verifyCsrf, issueCsrfToken } from './middleware/csrf.js'
import { loginLimiter, registerLimiter, passwordResetLimiter } from './middleware/rateLimit.js'
import { createUserAwareLimiter } from './middleware/perUserRateLimit.js'
import { sendSuccess, sendError } from './middleware/response.js'
import { apiDeprecationMiddleware, API_VERSION } from './middleware/api-version.js'

// ─── Database ──────────────────────────────────────────────────
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// ─── Routes ────────────────────────────────────────────────────
import adminAuthRoutes from './routes/admin/auth.js'
import adminProductRoutes from './routes/admin/products.js'
import adminCategoryRoutes from './routes/admin/categories.js'
import adminBrandRoutes from './routes/admin/brands.js'
import adminIndustryRoutes from './routes/admin/industries.js'
import adminOrderRoutes from './routes/admin/orders.js'
import adminRfqRoutes from './routes/admin/rfqs.js'
import adminOfferRoutes from './routes/admin/offers.js'
import adminCustomerRoutes from './routes/admin/customers.js'
import adminMessageRoutes from './routes/admin/messages.js'
import adminMediaRoutes from './routes/admin/media.js'
import adminSettingsRoutes from './routes/admin/settings.js'
import adminHomepageRoutes from './routes/admin/homepage.js'
import adminUserRoutes from './routes/admin/users.js'
import adminDashboardRoutes from './routes/admin/dashboard.js'
import adminAuditRoutes from './routes/admin/audit.js'
import adminTestimonialRoutes from './routes/admin/testimonials.js'
import adminBrandLogoRoutes from './routes/admin/brand-logo.js'

import storefrontProductRoutes from './routes/storefront/products.js'
import storefrontCategoryRoutes from './routes/storefront/categories.js'
import storefrontBrandRoutes from './routes/storefront/brands.js'
import storefrontIndustryRoutes from './routes/storefront/industries.js'
import storefrontOrderRoutes from './routes/storefront/orders.js'
import storefrontRfqRoutes from './routes/storefront/rfq.js'
import storefrontOfferRoutes from './routes/storefront/offers.js'
import storefrontContactRoutes from './routes/storefront/contact.js'
import storefrontSearchRoutes from './routes/storefront/search.js'
import storefrontHomepageRoutes from './routes/storefront/homepage.js'
import storefrontSettingsRoutes from './routes/storefront/settings.js'
import storefrontTestimonialRoutes from './routes/storefront/testimonials.js'
import storefrontOfficeRoutes from './routes/storefront/offices.js'
import storefrontPaymentRoutes from './routes/storefront/payments.js'
import storefrontSitemapRoutes from './routes/storefront/sitemap.js'

import customerAuthRoutes from './routes/storefront/auth.js'
import paypalWebhookRoutes from './routes/webhooks/paypal.js'

// ─── Email Queue Processor ────────────────────────────────────
import { startEmailQueueProcessor, stopEmailQueueProcessor } from './services/email.js'

// ─── App Setup ─────────────────────────────────────────────────
const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.paypal.com', 'https://www.paypalobjects.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'https://api-m.paypal.com', 'https://www.paypal.com', 'https://res.cloudinary.com'],
      frameSrc: ['https://www.paypal.com', 'https://sandbox.paypal.com'],
      frameAncestors: ["'none'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))

app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Idempotency-Key', 'X-Request-ID'],
}))

// ─── Rate Limiting ─────────────────────────────────────────────
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : process.env.PLAYWRIGHT_TEST ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// ─── PayPal Webhook ────────────────────────────────────────────
app.use('/api/webhooks/paypal', express.json({ limit: '10mb' }), paypalWebhookRoutes)

// ─── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(compression())

// ─── XSS Sanitization (before routes, after body parsing) ────
app.use(sanitize)

// ─── Serve uploaded media files (before CSRF — no auth needed) ──
const UPLOAD_DIR = path.resolve('uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o755 })
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1y', immutable: true, index: false }))

// ─── CSRF Protection (after cookies are parsed) ──────────────
app.get('/api/csrf-token', issueCsrfToken as unknown as express.RequestHandler)
app.get('/api/v1/csrf-token', issueCsrfToken as unknown as express.RequestHandler)
app.use(verifyCsrf)

// ─── Request ID (for log correlation) ──────────────────────────
app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  ;(req as express.Request & { id: string }).id = (req.headers['x-request-id'] as string) || crypto.randomUUID()
  next()
})

// ─── Request Logging ──────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Health Check ──────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() })
  }
})

// ─── Per-User Rate Limiting (applies BEFORE routes) ────────────
const userAwareAdminLimiter = createUserAwareLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests. Slow down.',
})

// ─── API Version Info ──────────────────────────────────────────
app.get('/api/v1/info', (_req, res) => {
  sendSuccess(res, {
    version: API_VERSION.version,
    released: API_VERSION.released,
    deprecated: API_VERSION.deprecated,
    sunset: API_VERSION.sunset,
    docs: 'https://alkatraders.co/api/v1/info',
  })
})

// ─── API Deprecation Middleware ─────────────────────────────────
app.use(apiDeprecationMiddleware)

// ─── Admin Routes ──────────────────────────────────────────────
// ─── API Versioning ─────────────────────────────────────────────
// All routes are registered under both /api/ and /api/v1/ prefixes
// for backward compatibility during the versioning migration.
const API_PREFIXES = ['/api', '/api/v1']

for (const prefix of API_PREFIXES) {
  app.use(`${prefix}/admin/auth`, loginLimiter, userAwareAdminLimiter, adminAuthRoutes)
  app.use(`${prefix}/admin/products`, adminLimiter, userAwareAdminLimiter, adminProductRoutes)
  app.use(`${prefix}/admin/categories`, adminLimiter, userAwareAdminLimiter, adminCategoryRoutes)
  app.use(`${prefix}/admin/brands`, adminLimiter, userAwareAdminLimiter, adminBrandRoutes)
  app.use(`${prefix}/admin/brands`, adminLimiter, userAwareAdminLimiter, adminBrandLogoRoutes)
  app.use(`${prefix}/admin/industries`, adminLimiter, userAwareAdminLimiter, adminIndustryRoutes)
  app.use(`${prefix}/admin/orders`, adminLimiter, userAwareAdminLimiter, adminOrderRoutes)
  app.use(`${prefix}/admin/rfqs`, adminLimiter, userAwareAdminLimiter, adminRfqRoutes)
  app.use(`${prefix}/admin/offers`, adminLimiter, userAwareAdminLimiter, adminOfferRoutes)
  app.use(`${prefix}/admin/customers`, adminLimiter, userAwareAdminLimiter, adminCustomerRoutes)
  app.use(`${prefix}/admin/messages`, adminLimiter, userAwareAdminLimiter, adminMessageRoutes)
  app.use(`${prefix}/admin/media`, adminLimiter, userAwareAdminLimiter, adminMediaRoutes)
  app.use(`${prefix}/admin/settings`, adminLimiter, userAwareAdminLimiter, adminSettingsRoutes)
  app.use(`${prefix}/admin/homepage`, adminLimiter, userAwareAdminLimiter, adminHomepageRoutes)
  app.use(`${prefix}/admin/users`, adminLimiter, userAwareAdminLimiter, adminUserRoutes)
  app.use(`${prefix}/admin/dashboard`, adminLimiter, userAwareAdminLimiter, adminDashboardRoutes)
  app.use(`${prefix}/admin/audit`, adminLimiter, userAwareAdminLimiter, adminAuditRoutes)
  app.use(`${prefix}/admin/testimonials`, adminLimiter, userAwareAdminLimiter, adminTestimonialRoutes)

  app.use(`${prefix}/storefront/products`, publicLimiter, storefrontProductRoutes)
  app.use(`${prefix}/storefront/categories`, publicLimiter, storefrontCategoryRoutes)
  app.use(`${prefix}/storefront/brands`, publicLimiter, storefrontBrandRoutes)
  app.use(`${prefix}/storefront/industries`, publicLimiter, storefrontIndustryRoutes)
  app.use(`${prefix}/storefront/orders`, publicLimiter, storefrontOrderRoutes)
  app.use(`${prefix}/storefront/rfq`, publicLimiter, storefrontRfqRoutes)
  app.use(`${prefix}/storefront/offers`, publicLimiter, storefrontOfferRoutes)
  app.use(`${prefix}/storefront/contact`, publicLimiter, storefrontContactRoutes)
  app.use(`${prefix}/storefront/search`, publicLimiter, storefrontSearchRoutes)
  app.use(`${prefix}/storefront/homepage`, publicLimiter, storefrontHomepageRoutes)
  app.use(`${prefix}/storefront/settings`, publicLimiter, storefrontSettingsRoutes)
  app.use(`${prefix}/storefront/testimonials`, publicLimiter, storefrontTestimonialRoutes)
  app.use(`${prefix}/storefront/offices`, publicLimiter, storefrontOfficeRoutes)
  app.use(`${prefix}/storefront/payments`, publicLimiter, storefrontPaymentRoutes)
  app.use(`${prefix}/sitemap.xml`, publicLimiter, storefrontSitemapRoutes)

  app.use(`${prefix}/auth/login`, loginLimiter)
  app.use(`${prefix}/auth/register`, registerLimiter)
  app.use(`${prefix}/auth/forgot-password`, passwordResetLimiter)
  app.use(`${prefix}/auth/reset-password`, passwordResetLimiter)
  app.use(`${prefix}/auth`, publicLimiter, customerAuthRoutes)
}
// ─── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  sendError(res, 'Not found', 404)
})

// ─── Error Handler ─────────────────────────────────────────────
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, method: req.method, path: req.path, originalUrl: req.originalUrl }, 'Unhandled error')
  sendError(res, 'Internal server error', 500)
})

// ─── Start Server ──────────────────────────────────────────────
async function main() {
  try {
    await prisma.$connect()
    dbLogger.info('Database connected')

    app.listen(PORT, () => {
      startupLogger.info({ port: PORT }, 'Server started')
      startupLogger.info(`Health check: http://localhost:${PORT}/api/health`)

      // Start email queue processor (checks for retriable emails every 60s)
      startEmailQueueProcessor()
    })
  } catch (error) {
    startupLogger.fatal({ err: error }, 'Failed to start server')
    process.exit(1)
  }
}

main()

// Graceful shutdown
process.on('SIGTERM', async () => {
  startupLogger.info('Shutting down (SIGTERM)...')
  stopEmailQueueProcessor()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  startupLogger.info('Shutting down (SIGINT)...')
  stopEmailQueueProcessor()
  await prisma.$disconnect()
  process.exit(0)
})

export default app
