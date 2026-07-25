# MASTER_BACKEND_PLAN.md — Alka Traders (Alka Traders)

> **Last Updated:** July 3, 2026
> **Status:** Living document — single source of truth for backend engineering
> **Author:** Reverse-engineered from executable source code only

---

# Executive Summary

Alka Traders is a **marine & industrial equipment e-commerce storefront** with an admin panel. The frontend is a React/Vite/TypeScript SPA with Zustand state management, serving a B2B audience (ship managers, procurement teams, vessel owners). The backend is an Express.js API with Prisma ORM on PostgreSQL, implementing admin CRUD, storefront product browsing, RFQ submission, offer negotiation, order management, and email notifications.

**Current backend completion: ~75% of route-level API surface is implemented. Frontend-to-backend integration is ~0% — the frontend still consumes hardcoded static data.**

---

# Current Architecture

## Frontend Architecture

- **Framework:** React 19 + TypeScript + Vite
- **State:** Zustand (single store, localStorage persistence for cart/auth)
- **Routing:** React Router v6 (lazy-loaded pages)
- **Styling:** Tailwind CSS + custom CSS variables (light/dark theme)
- **i18n:** i18next (English, Arabic, Spanish)
- **Animation:** GSAP + ScrollTrigger
- **Data:** ALL data is currently hardcoded in `src/data/products.ts` (255 products), `src/data/brands.ts`, `src/data/industries.ts`, `src/data/testimonials.ts`
- **Admin Panel:** Full admin UI exists at `/admin/*` routes with 15+ pages, but ALL use hardcoded data or simulated auth

## Backend Architecture

- **Runtime:** Node.js + Express.js (ESM modules, TypeScript)
- **Database:** PostgreSQL via Prisma ORM (schema: 20+ models)
- **Auth:** JWT (access + refresh tokens, httpOnly cookies)
- **Validation:** Zod schemas
- **Email:** Resend API with queue-based delivery + retry
- **Payments:** Stripe (dependency installed, NOT integrated)
- **File Storage:** Multer + Sharp (installed, NOT wired to routes)
- **Security:** Helmet, CORS, rate limiting, bcryptjs

## Communication

Frontend and backend are **NOT connected**. The frontend imports data from `src/data/*.ts` files. The backend serves a complete API surface that the frontend does NOT call. Integration is the #1 missing piece.

---

# Technology Stack

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Frontend | React | 19.x | Feature complete (static data) |
| Build | Vite | 6.x | Working |
| State | Zustand | 5.x | Working |
| Styling | Tailwind CSS | 3.x | Working |
| Animation | GSAP | 3.x | Working |
| i18n | i18next | 24.x | Working (3 languages) |
| Backend Runtime | Node.js | 20.x | Working |
| Backend Framework | Express | 4.21 | Working |
| ORM | Prisma | 5.22 | Schema complete |
| Database | PostgreSQL | 15+ | REQUIRED (not provisioned) |
| Validation | Zod | 3.25 | Working |
| Auth | jsonwebtoken | 9.x | Working |
| Password Hashing | bcryptjs | 3.x | Working |
| Email | Resend | 4.5 | Implemented (needs API key) |
| Payments | Stripe | 18.3 | Installed, NOT integrated |
| File Upload | Multer | 2.0 | Installed, NOT wired |
| Image Processing | Sharp | 0.35 | Installed, NOT wired |
| Testing | Vitest | 3.2 | Installed, 0 tests written |
| Language | TypeScript | 5.8 | Strict mode |

---

# Folder Structure

```
marine/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Complete (20+ models)
│   │   └── seed.ts                # Complete (admin, categories, brands, industries, 28 products, testimonials, offices, settings)
│   ├── src/
│   │   ├── server.ts              # Complete (Express app, route mounting, middleware)
│   │   ├── middleware/
│   │   │   ├── auth.ts            # Complete (JWT verify, role hierarchy, token generation)
│   │   │   └── validate.ts        # Complete (Zod body/query/params validation, async handler)
│   │   ├── routes/
│   │   │   ├── admin/             # 16 route files — ALL IMPLEMENTED
│   │   │   │   ├── auth.ts        # Login, refresh, logout, me
│   │   │   │   ├── products.ts    # CRUD + bulk + search/filter
│   │   │   │   ├── categories.ts  # CRUD + reorder
│   │   │   │   ├── brands.ts      # CRUD
│   │   │   │   ├── industries.ts  # CRUD
│   │   │   │   ├── orders.ts      # List, detail, status, tracking, cancel, CSV export
│   │   │   │   ├── rfqs.ts        # List, detail, status, assign, notes, respond
│   │   │   │   ├── offers.ts      # List, detail, accept, reject, counter
│   │   │   │   ├── customers.ts   # List, detail, status
│   │   │   │   ├── messages.ts    # List, detail, read, archive, delete
│   │   │   │   ├── media.ts       # List, usage check, delete
│   │   │   │   ├── settings.ts    # Get/update (key-value store)
│   │   │   │   ├── homepage.ts    # Get/update sections
│   │   │   │   ├── users.ts       # CRUD + role (owner-only)
│   │   │   │   ├── dashboard.ts   # Stats, alerts, activity
│   │   │   │   └── audit.ts       # List logs
│   │   │   └── storefront/        # 13 route files — ALL IMPLEMENTED
│   │   │       ├── products.ts    # List (filters, sort, pagination), featured, new-arrivals, emergency, single, related
│   │   │       ├── categories.ts  # List, by slug
│   │   │       ├── brands.ts      # List, by slug
│   │   │       ├── industries.ts  # List, by slug
│   │   │       ├── orders.ts      # Create (checkout), get, cancel
│   │   │       ├── rfq.ts         # Submit RFQ
│   │   │       ├── offers.ts      # Submit offer
│   │   │       ├── contact.ts     # Contact form + emergency request
│   │   │       ├── search.ts      # Full-text search (products, categories, brands)
│   │   │       ├── homepage.ts    # Get enabled sections
│   │   │       ├── settings.ts    # Public settings
│   │   │       ├── testimonials.ts # List visible
│   │   │       └── auth.ts        # Register, login, logout, me (customer)
│   │   ├── services/
│   │   │   └── email.ts           # Complete (queue, templates, Resend integration, 11 email types)
│   │   ├── utils/
│   │   │   ├── audit.ts           # Complete (audit log writer)
│   │   │   ├── helpers.ts         # Complete (slug, pagination, price, number generators)
│   │   │   └── prisma-helpers.ts  # Complete (include shapes for products, brands, categories, etc.)
│   │   ├── types/                 # Empty
│   │   └── templates/             # Empty
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── src/                            # Frontend
│   ├── data/                       # HARDCODED data (products, brands, industries, testimonials)
│   ├── hooks/                      # Client-side filtering (useProducts), cart, admin dashboard
│   ├── pages/                      # 15 storefront pages + admin subpages
│   ├── store/useStore.ts           # Zustand (cart, auth, filters — all local state)
│   ├── types/index.ts              # TypeScript interfaces
│   └── locales/                    # i18n (en, ar, es)
└── public/images/                  # 133 product images (product-001_electrical.jpg to product-133.jpg)
```

---

# Existing Backend Analysis

## 1. Server Entry (`backend/src/server.ts`)

**Purpose:** Express application setup, middleware chain, route mounting, graceful shutdown.

**Status:** COMPLETE

- Helmet, CORS, compression, cookie-parser, body parsing
- Rate limiting: public (100/min), admin (300/min)
- Health check at `GET /api/health`
- 31 route groups mounted (16 admin + 13 storefront + 1 customer auth + health)
- Email queue processor started on boot
- Graceful shutdown (SIGTERM/SIGINT)

**Missing:** No request logging (morgan/pino), no request ID tracing, no graceful shutdown for email queue on SIGTERM (it calls stop but doesn't await pending sends).

## 2. Auth Middleware (`backend/src/middleware/auth.ts`)

**Status:** COMPLETE

- `authenticateAdmin`: Bearer token → JWT verify → attach `req.user`
- `authenticateCustomer`: Same but checks `type === 'customer'`
- `requireRole(minRole)`: Role hierarchy (owner:6 > store-manager:5 > inventory-manager:4 > sales-agent:3 = content-manager:3 > viewer:1)
- `requireOwner`: Owner-only guard
- `generateToken` / `generateRefreshToken`: JWT creation with configurable expiry

**Missing:** No token blacklist/revocation on logout (refresh token remains valid until expiry). No rate limiting on auth endpoints specifically.

## 3. Validation Middleware (`backend/src/middleware/validate.ts`)

**Status:** COMPLETE

- `validateBody(schema)`: Zod parse → transform `req.body`
- `validateQuery(schema)`: Zod parse → transform `req.query`
- `validateParams(schema)`: Zod parse → transform `req.params`
- `asyncHandler(fn)`: Promise catch → next(error)

## 4. Admin Auth Routes (`backend/src/routes/admin/auth.ts`)

**Status:** COMPLETE

- `POST /api/admin/auth/login` — email/password → JWT access + refresh cookie, audit log
- `POST /api/admin/auth/refresh` — cookie-based refresh → new access token
- `POST /api/admin/auth/logout` — clear cookie, audit log
- `GET /api/admin/auth/me` — current user profile

**Missing:** No password reset flow, no password change endpoint, no 2FA.

## 5. Admin Product Routes (`backend/src/routes/admin/products.ts`)

**Status:** COMPLETE

- `GET /` — paginated list with filters (status, availability, condition, brand, category, search, newArrival, featured)
- `GET /:id` — single product with full admin include
- `POST /` — create with specs, images, industries (Zod validated)
- `PUT /:id` — update with slug regeneration, SKU uniqueness check, nested spec/image/industry updates
- `DELETE /:id` — hard delete (store-manager+)
- `PATCH /bulk` — bulk actions (publish, unpublish, archive, set-featured, set-new-arrival, set-category, set-brand)

**Missing:** No CSV import/export, no duplicate product, no image upload endpoint (images are URL-only), no scheduled publishing.

## 6. Admin Category Routes (`backend/src/routes/admin/categories.ts`)

**Status:** COMPLETE

- `GET /` — tree structure (parent → children with product counts)
- `POST /` — create with slug
- `PUT /:id` — update with slug regeneration
- `DELETE /:id` — prevent delete if has products or children
- `PATCH /:id/reorder` — update sort order

## 7. Admin Brand Routes (`backend/src/routes/admin/brands.ts`)

**Status:** COMPLETE

- `GET /` — list with product counts
- `POST /` — create with slug
- `PUT /:id` — update with slug regeneration
- `DELETE /:id` — prevent delete if has products

## 8. Admin Industry Routes (`backend/src/routes/admin/industries.ts`)

**Status:** COMPLETE — Same pattern as brands.

## 9. Admin Order Routes (`backend/src/routes/admin/orders.ts`)

**Status:** COMPLETE

- `GET /` — paginated list with filters (status, paymentStatus, search)
- `GET /:id` — detail with customer, items, timeline
- `PATCH /:id/status` — status advancement (enforced forward-only), stock adjustment on paid/cancel, email notifications
- `PATCH /:id/tracking` — add tracking number + courier, send shipped email
- `POST /:id/cancel` — cancel with stock restore
- `GET /export/csv` — CSV export (10k limit)

**Missing:** No Stripe payment integration (payment status is manual), no refund processing, no bulk status update.

## 10. Admin RFQ Routes (`backend/src/routes/admin/rfqs.ts`)

**Status:** COMPLETE

- `GET /` — paginated list with filters (urgency, status, search)
- `GET /:id` — detail with customer, assignee, items, notes
- `PATCH /:id/status` — status update with audit
- `PATCH /:id/assign` — assign to staff
- `POST /:id/notes` — add note (internal or external)
- `POST /:id/respond` — mark as quote-sent, send response email

**Missing:** No convert-RFQ-to-order, no link-RFQ-to-product, no file attachments on notes.

## 11. Admin Offer Routes (`backend/src/routes/admin/offers.ts`)

**Status:** COMPLETE

- `GET /` — paginated list with filters
- `GET /:id` — detail with product price/stock context
- `PATCH /:id/accept` — accept + email notification
- `PATCH /:id/reject` — reject + email notification
- `PATCH /:id/counter` — counter-offer with price + email

**Missing:** No convert-to-order, no expiry checking job.

## 12. Admin Customer Routes (`backend/src/routes/admin/customers.ts`)

**Status:** PARTIALLY IMPLEMENTED

- `GET /` — paginated list with search
- `GET /:id` — detail with recent orders/rfqs
- `PATCH /:id/status` — toggle active/inactive

**Missing:** No admin notes, no password reset for customer, no merge duplicates, no order/RFQ/offer history pagination.

## 13. Admin Message Routes (`backend/src/routes/admin/messages.ts`)

**Status:** COMPLETE

- `GET /` — paginated list with filters
- `GET /:id` — detail
- `PATCH /:id/read` — mark read
- `PATCH /:id/archive` — archive
- `DELETE /:id` — hard delete

**Missing:** No reply functionality, no assign to staff, no convert-to-RFQ.

## 14. Admin Media Routes (`backend/src/routes/admin/media.ts`)

**Status:** PARTIALLY IMPLEMENTED

- `GET /` — paginated list with search
- `GET /:id/usage` — which products use this asset
- `DELETE /:id` — delete (prevents if used by products)

**Missing:** NO file upload endpoint (Multer is installed but not wired), no thumbnail generation, no image optimization, no duplicate detection, no alt text update.

## 15. Admin Settings Routes (`backend/src/routes/admin/settings.ts`)

**Status:** COMPLETE

- `GET /` — all settings grouped by category
- `PUT /` — bulk upsert settings

## 16. Admin Homepage Routes (`backend/src/routes/admin/homepage.ts`)

**Status:** COMPLETE

- `GET /` — all sections
- `PUT /` — replace all sections (delete + recreate)

**Missing:** No individual section update, no content preview, no version history.

## 17. Admin User Routes (`backend/src/routes/admin/users.ts`)

**Status:** COMPLETE (owner-only)

- `GET /` — list all admin users
- `POST /` — create with role
- `PUT /:id` — update (name, email, role, password)
- `DELETE /:id` — deactivate (soft)
- `PATCH /:id/role` — change role

**Missing:** No self-service password change, no avatar upload, no 2FA.

## 18. Admin Dashboard Routes (`backend/src/routes/admin/dashboard.ts`)

**Status:** COMPLETE

- `GET /stats` — 15 aggregate counts
- `GET /alerts` — low stock + overdue emergency RFQs
- `GET /activity` — recent audit logs

## 19. Admin Audit Routes (`backend/src/routes/admin/audit.ts`)

**Status:** COMPLETE

- `GET /` — paginated list with filters (entityType, actorEmail, action)

## 20. Storefront Product Routes (`backend/src/routes/storefront/products.ts`)

**Status:** COMPLETE

- `GET /` — published products with full filter/sort/pagination + filter counts (categories, brands, price range)
- `GET /featured` — top 8 featured
- `GET /new-arrivals` — top 8 new arrivals
- `GET /emergency` — emergency availability products
- `GET /:id` — single product (by id or slug) + related products
- `GET /:id/related` — related by category/brand

## 21. Storefront Category/Brand/Industry Routes

**Status:** COMPLETE — List visible, get by slug.

## 22. Storefront Order Routes (`backend/src/routes/storefront/orders.ts`)

**Status:** COMPLETE

- `POST /` — create order from checkout (validates stock, calculates totals from settings, reduces stock, sends confirmation email)
- `GET /:id` — get own order (customer-scoped)
- `POST /:id/cancel` — request cancellation (restores stock, sends email)

**Missing:** No Stripe payment intent creation, no payment confirmation webhook, no order history list endpoint.

## 23. Storefront RFQ Routes (`backend/src/routes/storefront/rfq.ts`)

**Status:** COMPLETE

- `POST /` — submit RFQ with validation, auto-sets response deadline based on urgency, sends admin notification email

## 24. Storefront Offer Routes (`backend/src/routes/storefront/offers.ts`)

**Status:** COMPLETE

- `POST /` — submit offer with 7-day expiry, sends admin notification email

## 25. Storefront Contact Routes (`backend/src/routes/storefront/contact.ts`)

**Status:** COMPLETE

- `POST /` — contact form submission + admin notification email
- `POST /emergency` — emergency request → auto-creates RFQ + emergency alert email

## 26. Storefront Search Routes (`backend/src/routes/storefront/search.ts`)

**Status:** COMPLETE

- `GET /?q=` — searches products (name, sku, description, brand, category), categories, brands

## 27. Storefront Homepage/Settings/Testimonials Routes

**Status:** COMPLETE — Simple GET endpoints.

## 28. Customer Auth Routes (`backend/src/routes/storefront/auth.ts`)

**Status:** COMPLETE

- `POST /register` — create customer, JWT, welcome email
- `POST /login` — authenticate, JWT
- `POST /logout` — clear cookie
- `GET /me` — current customer profile

**Missing:** No password reset, no email verification, no profile update endpoint.

## 29. Email Service (`backend/src/services/email.ts`)

**Status:** COMPLETE

- Queue-based delivery with retry (3 attempts)
- 11 email templates: orderConfirmation, orderShipped, orderCancelled, rfqReceived, rfqResponse, emergencyAlert, offerReceived, offerDecision, contactNotification, passwordReset, welcome
- Processor runs every 60s for retriable emails
- Dry-run mode when no API key configured

## 30. Database Schema (`backend/prisma/schema.prisma`)

**Status:** COMPLETE — 20 models with proper relations, indexes, and constraints.

| Model | Purpose | Status |
|-------|---------|--------|
| AdminUser | Admin accounts | Complete |
| Customer | Customer accounts | Complete |
| Product | Product catalog | Complete |
| ProductImage | Product images | Complete |
| ProductSpec | Technical specs | Complete |
| ProductIndustry | M:N join | Complete |
| Category | Hierarchical categories | Complete |
| Brand | Brand catalog | Complete |
| Industry | Industry verticals | Complete |
| Order | Customer orders | Complete |
| OrderItem | Order line items | Complete |
| OrderTimeline | Status history | Complete |
| Rfq | Request for quote | Complete |
| RfqItem | RFQ line items | Complete |
| RfqNote | RFQ notes | Complete |
| Offer | Make-an-offer | Complete |
| ContactMessage | Contact form | Complete |
| EmergencyRequest | Emergency procurement | Complete |
| MediaAsset | File uploads | Complete |
| Testimonial | Customer quotes | Complete |
| Office | Office locations | Complete |
| StoreSetting | Key-value config | Complete |
| HomepageSection | CMS sections | Complete |
| AuditLog | Audit trail | Complete |
| EmailQueue | Email delivery | Complete |
| WebhookLog | Webhook events | Complete |

---

# Existing Frontend Analysis

## Pages Overview

| Page | Route | Data Source | Backend Integration |
|------|-------|-------------|-------------------|
| Home | `/` | `products.ts` (filtered) | NOT INTEGRATED |
| Shop | `/shop` | `products.ts` (filtered) | NOT INTEGRATED |
| Products | `/products` | `useProducts` hook (local filter) | NOT INTEGRATED |
| Product Detail | `/product/:id` | `products.find()` | NOT INTEGRATED |
| Checkout | `/checkout` | `useStore` (local cart) | NOT INTEGRATED |
| RFQ | `/rfq` | Form → `useStore` (simulated) | NOT INTEGRATED |
| Contact | `/contact` | Form → `setTimeout` (fake) | NOT INTEGRATED |
| Emergency | `/emergency` | Form → `setTimeout` (fake) | NOT INTEGRATED |
| Search | `/search` | `products.filter()` (local) | NOT INTEGRATED |
| Brands | `/brands` | `brands.ts` (static) | NOT INTEGRATED |
| Industries | `/industries` | `industries.ts` (static) | NOT INTEGRATED |
| About | `/about` | `testimonials.ts` (static) | NOT INTEGRATED |
| Network | `/network` | Hardcoded region list | NOT INTEGRATED |
| Intelligence | `/intelligence` | Hardcoded insights | NOT INTEGRATED |
| Admin Login | `/admin/login` | `useStore.adminLogin()` (simulated) | NOT INTEGRATED |
| Admin Dashboard | `/admin` | `useAdminDashboard` hook (local) | NOT INTEGRATED |
| Admin Products | `/admin/products` | `products.ts` (local) | NOT INTEGRATED |
| Admin Product Form | `/admin/products/new` | Form → `useStore` | NOT INTEGRATED |
| Admin Media | `/admin/media` | Empty / simulated | NOT INTEGRATED |
| Admin Categories | `/admin/categories` | `products.ts` categories | NOT INTEGRATED |
| Admin Brands | `/admin/brands` | `brands.ts` | NOT INTEGRATED |
| Admin Industries | `/admin/industries` | `industries.ts` | NOT INTEGRATED |
| Admin Orders | `/admin/orders` | `useStore` (simulated) | NOT INTEGRATED |
| Admin RFQs | `/admin/rfqs` | `useStore` (simulated) | NOT INTEGRATED |
| Admin Offers | `/admin/offers` | `useStore` (simulated) | NOT INTEGRATED |
| Admin Customers | `/admin/customers` | Empty | NOT INTEGRATED |
| Admin Messages | `/admin/messages` | Empty | NOT INTEGRATED |
| Admin Homepage | `/admin/homepage` | Hardcoded | NOT INTEGRATED |
| Admin Users | `/admin/users` | `useStore` (simulated) | NOT INTEGRATED |
| Admin Audit | `/admin/audit-log` | Empty | NOT INTEGRATED |
| Admin Settings | `/admin/settings` | Hardcoded | NOT INTEGRATED |

---

# API Reverse Engineering

## Storefront API Endpoints

### Products

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| GET | `/api/storefront/products` | List with filters/sort/pagination | None | IMPLEMENTED |
| GET | `/api/storefront/products/featured` | Top featured | None | IMPLEMENTED |
| GET | `/api/storefront/products/new-arrivals` | New arrivals | None | IMPLEMENTED |
| GET | `/api/storefront/products/emergency` | Emergency products | None | IMPLEMENTED |
| GET | `/api/storefront/products/:id` | Single + related | None | IMPLEMENTED |
| GET | `/api/storefront/products/:id/related` | Related products | None | IMPLEMENTED |

### Categories/Brands/Industries

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| GET | `/api/storefront/categories` | Visible categories | None | IMPLEMENTED |
| GET | `/api/storefront/categories/:slug` | Category by slug | None | IMPLEMENTED |
| GET | `/api/storefront/brands` | Visible brands | None | IMPLEMENTED |
| GET | `/api/storefront/brands/:slug` | Brand by slug | None | IMPLEMENTED |
| GET | `/api/storefront/industries` | Visible industries | None | IMPLEMENTED |
| GET | `/api/storefront/industries/:slug` | Industry by slug | None | IMPLEMENTED |

### Orders

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| POST | `/api/storefront/orders` | Create order (checkout) | Customer | IMPLEMENTED |
| GET | `/api/storefront/orders/:id` | Get own order | Customer | IMPLEMENTED |
| POST | `/api/storefront/orders/:id/cancel` | Request cancellation | Customer | IMPLEMENTED |

### RFQ / Offers / Contact

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| POST | `/api/storefront/rfq` | Submit RFQ | None | IMPLEMENTED |
| POST | `/api/storefront/offers` | Submit offer | None | IMPLEMENTED |
| POST | `/api/storefront/contact` | Contact form | None | IMPLEMENTED |
| POST | `/api/storefront/contact/emergency` | Emergency request | None | IMPLEMENTED |

### Search / Homepage / Settings / Testimonials

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| GET | `/api/storefront/search?q=` | Full-text search | None | IMPLEMENTED |
| GET | `/api/storefront/homepage` | Enabled sections | None | IMPLEMENTED |
| GET | `/api/storefront/settings` | Public settings | None | IMPLEMENTED |
| GET | `/api/storefront/testimonials` | Visible testimonials | None | IMPLEMENTED |

### Customer Auth

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| POST | `/api/auth/register` | Register customer | None | IMPLEMENTED |
| POST | `/api/auth/login` | Login customer | None | IMPLEMENTED |
| POST | `/api/auth/logout` | Logout | Customer | IMPLEMENTED |
| GET | `/api/auth/me` | Current user | Customer | IMPLEMENTED |

## Admin API Endpoints

| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| POST | `/api/admin/auth/login` | Admin login | None | IMPLEMENTED |
| POST | `/api/admin/auth/refresh` | Refresh token | Cookie | IMPLEMENTED |
| POST | `/api/admin/auth/logout` | Admin logout | Admin | IMPLEMENTED |
| GET | `/api/admin/auth/me` | Current admin | Admin | IMPLEMENTED |
| GET | `/api/admin/dashboard/stats` | Dashboard stats | Admin | IMPLEMENTED |
| GET | `/api/admin/dashboard/alerts` | Low stock + overdue RFQs | Admin | IMPLEMENTED |
| GET | `/api/admin/dashboard/activity` | Recent activity | Admin | IMPLEMENTED |
| GET/POST/PUT/DELETE | `/api/admin/products` | Product CRUD | Admin | IMPLEMENTED |
| PATCH | `/api/admin/products/bulk` | Bulk actions | Admin | IMPLEMENTED |
| GET/POST/PUT/DELETE | `/api/admin/categories` | Category CRUD | Admin | IMPLEMENTED |
| GET/POST/PUT/DELETE | `/api/admin/brands` | Brand CRUD | Admin | IMPLEMENTED |
| GET/POST/PUT/DELETE | `/api/admin/industries` | Industry CRUD | Admin | IMPLEMENTED |
| GET/PATCH | `/api/admin/orders` | Order management | Admin | IMPLEMENTED |
| GET/PATCH/POST | `/api/admin/rfqs` | RFQ management | Admin | IMPLEMENTED |
| GET/PATCH | `/api/admin/offers` | Offer management | Admin | IMPLEMENTED |
| GET/PATCH | `/api/admin/customers` | Customer management | Admin | IMPLEMENTED |
| GET/PATCH/DELETE | `/api/admin/messages` | Message management | Admin | IMPLEMENTED |
| GET/DELETE | `/api/admin/media` | Media management | Admin | PARTIAL |
| GET/PUT | `/api/admin/settings` | Store settings | Admin | IMPLEMENTED |
| GET/PUT | `/api/admin/homepage` | Homepage sections | Admin | IMPLEMENTED |
| GET/POST/PUT/DELETE/PATCH | `/api/admin/users` | Admin user management | Owner | IMPLEMENTED |
| GET | `/api/admin/audit` | Audit logs | Admin | IMPLEMENTED |

---

# Missing Backend Features

## CRITICAL (Blocking frontend integration)

| # | Feature | Reason | Priority | Complexity |
|---|---------|--------|----------|------------|
| 1 | **Frontend API client layer** | Frontend cannot call any backend endpoint | P0 | Medium |
| 2 | **Product image upload** | Admin cannot upload images, media library is non-functional | P0 | Medium |
| 3 | **Stripe payment integration** | Checkout creates order but no real payment | P0 | High |
| 4 | **Admin dashboard data fetching** | Admin dashboard shows hardcoded stats | P1 | Low |
| 5 | **Admin auth integration** | Admin login is simulated (any email works) | P0 | Low |
| 6 | **Customer auth integration** | Customer login/register is simulated | P0 | Low |
| 7 | **Order list endpoint for customers** | Customers cannot view order history | P1 | Low |
| 8 | **Password reset flow** | No way to recover forgotten passwords | P1 | Medium |

## HIGH (Important for production)

| # | Feature | Reason | Priority | Complexity |
|---|---------|--------|----------|------------|
| 9 | **File storage (Supabase/S3)** | Images need persistent storage | P1 | Medium |
| 10 | **Product CSV import/export** | Bulk product management | P2 | Medium |
| 11 | **Stripe webhook handler** | Payment confirmation from Stripe | P1 | Medium |
| 12 | **Email verification** | Customer account security | P2 | Low |
| 13 | **Admin product image reorder** | Drag-and-drop image ordering | P2 | Low |
| 14 | **Media upload endpoint** | Multer installed but not wired | P1 | Low |
| 15 | **Request logging** | No morgan/pino for request logs | P2 | Low |
| 16 | **Order status emails** | Confirmation/shipped emails sent but not all paths covered | P1 | Low |

## MEDIUM (Nice to have)

| # | Feature | Reason | Priority | Complexity |
|---|---------|--------|----------|------------|
| 17 | **Offer expiry cron job** | Offers should auto-expire after 7 days | P2 | Low |
| 18 | **RFQ-to-order conversion** | Admin should convert RFQ to order | P2 | Medium |
| 19 | **Offer-to-order conversion** | Accepted offers should create orders | P2 | Medium |
| 20 | **Customer profile update** | Customers cannot update their profile | P2 | Low |
| 21 | **Admin message reply** | Admin cannot reply to messages from UI | P3 | Low |
| 22 | **Homepage section individual update** | Currently replaces all sections at once | P3 | Low |
| 23 | **Tests** | 0 tests written | P2 | High |
| 24 | **Docker configuration** | No containerization | P3 | Medium |
| 25 | **CI/CD pipeline** | No automated deployment | P3 | Medium |

---

# Implementation Roadmap

## Phase 1: Frontend-Backend Integration (Week 1-2)

**Objective:** Replace all hardcoded data with real API calls.

### Tasks:
1. Create `src/lib/api.ts` — centralized fetch wrapper with auth token management
2. Create `src/hooks/useApi.ts` — generic data fetching hook with loading/error states
3. Integrate admin auth (login → JWT → stored in memory/cookie)
4. Integrate customer auth (register/login → JWT → Zustand)
5. Replace `src/data/products.ts` with API calls to `/api/storefront/products`
6. Replace `src/data/brands.ts` with API calls
7. Replace `src/data/industries.ts` with API calls
8. Replace `src/data/testimonials.ts` with API calls
9. Wire RFQ form to `POST /api/storefront/rfq`
10. Wire contact form to `POST /api/storefront/contact`
11. Wire emergency form to `POST /api/storefront/contact/emergency`
12. Wire offer modal to `POST /api/storefront/offers`
13. Wire checkout to `POST /api/storefront/orders`
14. Wire admin dashboard to `GET /api/admin/dashboard/*`
15. Wire all admin CRUD pages to their respective API endpoints

### Acceptance Criteria:
- All storefront pages load data from backend
- Admin panel requires real authentication
- Product catalog shows database products
- Forms submit to real endpoints
- Admin can CRUD products/categories/brands/industries

## Phase 2: File Upload & Media (Week 3)

**Objective:** Enable image upload and management.

### Tasks:
1. Wire Multer middleware for file uploads
2. Create `POST /api/admin/media/upload` endpoint
3. Integrate Sharp for image optimization (resize, WebP conversion)
4. Configure Supabase Storage or local disk storage
5. Wire admin media page to upload/delete/list
6. Wire admin product form to upload images
7. Add image reorder endpoint

### Acceptance Criteria:
- Admin can upload product images
- Images are optimized and stored
- Media library shows uploaded assets
- Products display uploaded images

## Phase 3: Payments (Week 4)

**Objective:** Real payment processing with Stripe.

### Tasks:
1. Create Stripe payment intent endpoint
2. Wire checkout to create payment intent
3. Handle Stripe webhooks (payment_intent.succeeded, payment_intent.payment_failed)
4. Update order payment status from webhooks
5. Add Stripe test mode configuration
6. Handle bank transfer and PayPal payment methods

### Acceptance Criteria:
- Card payments work end-to-end
- Payment status updates automatically
- Failed payments are handled gracefully
- Webhook verification is secure

## Phase 4: Polish & Production (Week 5-6)

**Objective:** Production readiness.

### Tasks:
1. Add request logging (morgan/pino)
2. Add password reset flow (email-based)
3. Add email verification for customers
4. Add order history endpoint for customers
5. Add offer expiry cron job
6. Add RFQ-to-order and offer-to-order conversion
7. Write integration tests for critical paths
8. Configure Docker
9. Set up CI/CD
10. Security audit
11. Performance testing
12. Deployment configuration

---

# Security Review

## Implemented
- ✅ JWT authentication with role hierarchy
- ✅ Password hashing (bcryptjs, 12 rounds)
- ✅ Rate limiting (100/min public, 300/min admin)
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation (Zod schemas on all endpoints)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ Audit logging for sensitive operations
- ✅ Refresh token in httpOnly cookies
- ✅ Stock validation before order creation
- ✅ Customer-scoped order access

## Gaps
- ❌ No token blacklist (logged out tokens remain valid until expiry)
- ❌ No CSRF protection (relies on SameSite cookies)
- ❌ No request ID tracing
- ❌ No input sanitization for XSS (Prisma escapes SQL but not HTML)
- ❌ No file upload validation (type, size) — upload not wired yet
- ❌ No admin IP whitelisting
- ❌ No brute-force protection on auth endpoints
- ❌ No HTTPS enforcement in code (handled by deployment)
- ❌ JWT secret hardcoded fallback in middleware

---

# Production Readiness Checklist

- [ ] All frontend pages integrated with backend APIs
- [ ] Admin authentication works end-to-end
- [ ] Customer authentication works end-to-end
- [ ] Product CRUD fully functional
- [ ] Image upload and management working
- [ ] Stripe payment integration tested
- [ ] Email notifications sending correctly
- [ ] RFQ submission and management working
- [ ] Offer negotiation flow working
- [ ] Order lifecycle (create → pay → ship → deliver) working
- [ ] Emergency procurement flow working
- [ ] Search functionality working
- [ ] Admin dashboard showing real data
- [ ] Audit log capturing all admin actions
- [ ] Rate limiting configured for production
- [ ] Error handling returns proper status codes
- [ ] Database migrations applied
- [ ] Seed data loaded for production
- [ ] Environment variables configured
- [ ] CORS configured for production domain
- [ ] HTTPS enabled
- [ ] Logging configured
- [ ] Health check endpoint working
- [ ] Graceful shutdown handling
- [ ] Backup strategy configured
- [ ] Monitoring configured
