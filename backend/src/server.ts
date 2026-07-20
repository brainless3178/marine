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
import { loginLimiter } from './middleware/rateLimit.js'

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
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api-m.paypal.com', 'https://www.paypal.com'],
      frameSrc: ['https://www.paypal.com', 'https://sandbox.paypal.com'],
      frameAncestors: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
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
app.get('/api/csrf-token', issueCsrfToken as any)
app.use(verifyCsrf)

// ─── Request ID (for log correlation) ──────────────────────────
app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  ;(req as any).id = (req.headers['x-request-id'] as string) || crypto.randomUUID()
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

// ─── Admin Routes ──────────────────────────────────────────────
app.use('/api/admin/auth', loginLimiter, adminAuthRoutes)
app.use('/api/admin/products', adminLimiter, adminProductRoutes)
app.use('/api/admin/categories', adminLimiter, adminCategoryRoutes)
app.use('/api/admin/brands', adminLimiter, adminBrandRoutes)
app.use('/api/admin/brands', adminLimiter, adminBrandLogoRoutes) // logo upload — handles POST /:id/logo only, no conflict with main brand routes
app.use('/api/admin/industries', adminLimiter, adminIndustryRoutes)
app.use('/api/admin/orders', adminLimiter, adminOrderRoutes)
app.use('/api/admin/rfqs', adminLimiter, adminRfqRoutes)
app.use('/api/admin/offers', adminLimiter, adminOfferRoutes)
app.use('/api/admin/customers', adminLimiter, adminCustomerRoutes)
app.use('/api/admin/messages', adminLimiter, adminMessageRoutes)
app.use('/api/admin/media', adminLimiter, adminMediaRoutes)
app.use('/api/admin/settings', adminLimiter, adminSettingsRoutes)
app.use('/api/admin/homepage', adminLimiter, adminHomepageRoutes)
app.use('/api/admin/users', adminLimiter, adminUserRoutes)
app.use('/api/admin/dashboard', adminLimiter, adminDashboardRoutes)
app.use('/api/admin/audit', adminLimiter, adminAuditRoutes)
app.use('/api/admin/testimonials', adminLimiter, adminTestimonialRoutes)

// ─── Storefront Routes ─────────────────────────────────────────
app.use('/api/storefront/products', publicLimiter, storefrontProductRoutes)
app.use('/api/storefront/categories', publicLimiter, storefrontCategoryRoutes)
app.use('/api/storefront/brands', publicLimiter, storefrontBrandRoutes)
app.use('/api/storefront/industries', publicLimiter, storefrontIndustryRoutes)
app.use('/api/storefront/orders', publicLimiter, storefrontOrderRoutes)
app.use('/api/storefront/rfq', publicLimiter, storefrontRfqRoutes)
app.use('/api/storefront/offers', publicLimiter, storefrontOfferRoutes)
app.use('/api/storefront/contact', publicLimiter, storefrontContactRoutes)
app.use('/api/storefront/search', publicLimiter, storefrontSearchRoutes)
app.use('/api/storefront/homepage', publicLimiter, storefrontHomepageRoutes)
app.use('/api/storefront/settings', publicLimiter, storefrontSettingsRoutes)
app.use('/api/storefront/testimonials', publicLimiter, storefrontTestimonialRoutes)
app.use('/api/storefront/offices', publicLimiter, storefrontOfficeRoutes)
app.use('/api/storefront/payments', publicLimiter, storefrontPaymentRoutes)

// ─── Customer Auth ──────────────────────────────────────────────
app.use('/api/auth', publicLimiter, customerAuthRoutes)

// ─── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ─── Error Handler ─────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error')
  res.status(500).json({ error: 'Internal server error' })
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
