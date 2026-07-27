# Alka Traders — Backend Implementation Tracker

> **Last Updated:** June 29, 2026
> **Source:** Based on [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) — 11 implementation phases
> **Status:** Core backend fully built. Email, payments, upload pipeline, tests, and frontend integration remain.

---

## QUICK STATUS

| Area | Status |
|------|--------|
| **Project Setup (Phase 0)** | ✅ Complete |
| **Core Auth & Products (Phase 1)** | ✅ Complete |
| **Categories, Brands, Industries (Phase 2)** | ✅ Complete |
| **Customer Auth & Cart (Phase 3)** | ✅ Complete |
| **Orders & Checkout (Phase 4)** | ⚠️ API done — no Stripe/webhooks |
| **RFQ & Offers (Phase 5)** | ⚠️ API done — no email notifications |
| **Contact, Emergency, Messages (Phase 6)** | ⚠️ API done — no email notifications |
| **Customers, Media, Settings (Phase 7)** | ⚠️ API done — no file upload pipeline |
| **Homepage, Content, Dashboard (Phase 8)** | ✅ Complete |
| **Admin Users & Audit Log (Phase 9)** | ✅ Complete |
| **Search, SEO, Polish (Phase 10)** | ⚠️ Search done — no SEO templates, no sitemap |
| **Testing & Deployment (Phase 11)** | ❌ Not started |

---

## PHASE 0: PROJECT SETUP ✅

| Task | Status | Notes |
|------|--------|-------|
| Initialize Express + TypeScript + Prisma | ✅ | `backend/package.json`, `tsconfig.json` |
| Set up PostgreSQL (Supabase or local) | ✅ | Prisma datasource configured |
| Configure environment variables | ✅ | `.env.example` with all vars |
| Project structure (`routes/`, `middleware/`, `services/`, `utils/`) | ✅ | `src/routes/admin/`, `src/routes/storefront/`, `src/middleware/`, `src/utils/` |
| ESLint + Prettier config | ⚠️ | `package.json` has lint script, no `.eslintrc` found |
| Set up Vitest for testing | ✅ | `package.json` has vitest configured |
| Create Prisma schema (all tables) | ✅ | 26 models: `admin_users`, `customers`, `products`, `product_images`, `product_specs`, `product_industries`, `categories`, `brands`, `industries`, `orders`, `order_items`, `order_timeline`, `rfqs`, `rfq_items`, `rfq_notes`, `offers`, `contact_messages`, `emergency_requests`, `media_assets`, `testimonials`, `offices`, `store_settings`, `homepage_sections`, `audit_logs`, `email_queue`, `webhook_logs` |
| Run initial migration | ⚠️ | Schema exists, migration not run yet (needs `DATABASE_URL`) |
| Set up Supabase Storage bucket | ❌ | Not configured |
| Configure CORS for frontend | ✅ | `CORS_ORIGIN` env var, `credentials: true` |

### Files Created
- `backend/package.json` — dependencies + scripts
- `backend/tsconfig.json` — TypeScript config
- `backend/prisma/schema.prisma` — full database schema (26 tables)
- `backend/prisma/seed.ts` — seed script with 27 sample products, 19 categories, 22 brands, 6 industries
- `backend/src/server.ts` — Express entry point with all middleware + route mounting
- `backend/.env.example` — environment variable template

---

## PHASE 1: CORE AUTH & PRODUCTS ✅

| Task | Status | File |
|------|--------|------|
| Admin login (email + password → JWT) | ✅ | `src/routes/admin/auth.ts` |
| JWT generation (access + refresh) | ✅ | `src/middleware/auth.ts` — `generateToken()`, `generateRefreshToken()` |
| Refresh token (httpOnly cookie) | ✅ | `src/routes/admin/auth.ts` — `POST /refresh` |
| Logout (clear cookie) | ✅ | `src/routes/admin/auth.ts` — `POST /logout` |
| Get current user (`/me`) | ✅ | `src/routes/admin/auth.ts` — `GET /me` |
| Auth middleware (JWT validation) | ✅ | `src/middleware/auth.ts` — `authenticateAdmin()`, `authenticateCustomer()` |
| Role-based middleware (6 roles) | ✅ | `src/middleware/auth.ts` — `requireRole()`, `requireOwner()`, `ROLE_HIERARCHY` |
| Seed admin user | ✅ | `prisma/seed.ts` — `admin@alkatraders.com` / `admin123` |
| Product CRUD API (admin) | ✅ | `src/routes/admin/products.ts` — list, get, create, update, delete |
| Product validation (Zod) | ✅ | `src/routes/admin/products.ts` — 40+ field schema |
| Product bulk actions | ✅ | `src/routes/admin/products.ts` — `PATCH /bulk` (publish, hide, archive, featured, new-arrival) |
| Slug generation | ✅ | `src/utils/helpers.ts` — `generateSlug()` |
| SKU uniqueness check | ✅ | `src/routes/admin/products.ts` — create + update |
| Storefront product list (filters, search, pagination) | ✅ | `src/routes/storefront/products.ts` — category, brand, industry, condition, availability, onSale, newArrival, featured, makeOffer, price range, sort |
| Storefront product detail | ✅ | `src/routes/storefront/products.ts` — by ID or slug, includes related |
| Featured products API | ✅ | `src/routes/storefront/products.ts` — `GET /featured` |
| New arrivals API | ✅ | `src/routes/storefront/products.ts` — `GET /new-arrivals` |
| Emergency products API | ✅ | `src/routes/storefront/products.ts` — `GET /emergency` |
| Related products API | ✅ | `src/routes/storefront/products.ts` — `GET /:id/related` |
| Filter counts in response | ✅ | `src/routes/storefront/products.ts` — categories, brands, priceRange |
| Pagination helpers | ✅ | `src/utils/helpers.ts` — `paginationParams()`, `paginationResponse()` |
| Price helpers (sale logic) | ✅ | `src/utils/helpers.ts` — `getEffectivePrice()`, `isOnSale()` |
| Prisma include shapes | ✅ | `src/utils/prisma-helpers.ts` — `productInclude`, `productAdminInclude` |
| Migration script (255 products → DB) | ❌ | Not created — seed has 27 sample products only |
| Remove `src/data/products.ts` hardcoded data | ❌ | Frontend still uses static data |
| Connect `useProducts.ts` to real API | ❌ | Frontend not connected |
| Connect `AdminProducts.tsx` to real API | ❌ | Frontend not connected |
| Connect `AdminProductForm.tsx` to real API | ❌ | Frontend not connected |

### Seed Data
| Entity | Count |
|--------|-------|
| Admin users | 1 (`admin@alkatraders.com`) |
| Categories | 19 (marine, electrical, hydraulic, pneumatic, spares, surplus, lifting-handling, tools-equipment, safety, hand-tools, ship-navigation, marine-pumps, engine-spare, engine-parts, motor-components, ship-machinery, hydraulic-pumps, rigging, other-business) |
| Brands | 22 (ABB, Siemens, Parker, Bosch Rexroth, Schneider Electric, Danfoss, Honeywell, Emerson, Festo, SMC, Grundfos, Atlas Copco, Wärtsilä, Alfa Laval, Kongsberg, SKF, IFM, Pepperl+Fuchs, Sick AG, Omron, Phoenix Contact, Rittal) |
| Industries | 6 (Marine Shipping, Shipyards, Oil & Gas, Power Generation, Manufacturing, Chemical Processing) |
| Products | 27 (sample from each category) |
| Testimonials | 3 |
| Offices | 1 (Bhavnagar, Gujarat, India) |
| Store settings | 11 |
| Homepage sections | 8 |

---

## PHASE 2: CATEGORIES, BRANDS, INDUSTRIES ✅

| Task | Status | File |
|------|--------|------|
| Category CRUD API (admin) | ✅ | `src/routes/admin/categories.ts` — list (tree), create, update, delete, reorder |
| Category tree structure (parent/child) | ✅ | Prisma `parentId` relation, nested includes |
| Category product count | ✅ | `_count: { products: { where: { status: 'published' } } }` |
| Category delete protection (products, children) | ✅ | Checks `_count.products` and `_count.children` |
| Storefront category list | ✅ | `src/routes/storefront/categories.ts` — visible, tree |
| Storefront category by slug | ✅ | `src/routes/storefront/categories.ts` — `GET /:slug` |
| Brand CRUD API (admin) | ✅ | `src/routes/admin/brands.ts` — list, create, update, delete |
| Brand product count | ✅ | `_count: { products: { where: { status: 'published' } } }` |
| Brand delete protection (products) | ✅ | Checks `_count.products` |
| Storefront brand list | ✅ | `src/routes/storefront/brands.ts` — visible |
| Storefront brand by slug | ✅ | `src/routes/storefront/brands.ts` — `GET /:slug` |
| Industry CRUD API (admin) | ✅ | `src/routes/admin/industries.ts` — list, create, update, delete |
| Industry product count | ✅ | `_count: { products: true }` |
| Industry delete protection | ✅ | Checks `_count.products` |
| Storefront industry list | ✅ | `src/routes/storefront/industries.ts` — visible |
| Storefront industry by slug | ✅ | `src/routes/storefront/industries.ts` — `GET /:slug` |
| Brand logo upload | ❌ | Schema has `logoUrl` but no upload endpoint |
| Fix hardcoded brand filter in frontend | ❌ | Frontend still hardcoded |

---

## PHASE 3: CUSTOMER AUTH & CART ✅

| Task | Status | File |
|------|--------|------|
| Customer registration API | ✅ | `src/routes/storefront/auth.ts` — `POST /register` |
| Customer login API | ✅ | `src/routes/storefront/auth.ts` — `POST /login` |
| Customer logout API | ✅ | `src/routes/storefront/auth.ts` — `POST /logout` |
| Customer `/me` API | ✅ | `src/routes/storefront/auth.ts` — `GET /me` |
| Password hashing (bcrypt, 12 rounds) | ✅ | `bcrypt.hash(password, 12)` |
| JWT with `type: 'customer'` | ✅ | Separate token type for customer vs admin |
| Refresh token (30 days) | ✅ | httpOnly cookie, 30-day expiry |
| Customer auth middleware | ✅ | `authenticateCustomer()` — checks `type === 'customer'` |
| Connect `AuthModal.tsx` to real API | ❌ | Frontend not connected |
| Update `useStore.ts` auth to use JWT | ❌ | Still uses localStorage |
| Password reset flow | ❌ | Not implemented |
| Server-side cart API | ❌ | Optional for Phase 1 — localStorage kept |
| Cart sync API (logged-in users) | ❌ | Not implemented |
| Customer profile API | ❌ | Only `/me` endpoint exists |

---

## PHASE 4: ORDERS & CHECKOUT ⚠️

| Task | Status | File |
|------|--------|------|
| Order creation API | ✅ | `src/routes/storefront/orders.ts` — `POST /` (auth required) |
| Order validation (stock check) | ✅ | Checks `product.stockCount < item.quantity` |
| Order number generation | ✅ | `MS7-ORD-XXXXX` format |
| Shipping cost from settings | ✅ | Reads `checkout.shippingCost` from `store_settings` |
| Tax from settings | ✅ | Reads `checkout.taxRate` from `store_settings` |
| Order items creation | ✅ | Creates `order_items` with snapshot of price |
| Order timeline creation | ✅ | Initial `pending` entry |
| Stock reduction on order | ✅ | Decrements `stockCount` on each item |
| Get own order (customer) | ✅ | `GET /:id` — scoped to `customerId` |
| Request cancellation (customer) | ✅ | `POST /:id/cancel` — restores stock |
| Order list (admin) | ✅ | `src/routes/admin/orders.ts` — filters, pagination |
| Order detail (admin) | ✅ | `GET /:id` |
| Order status update (admin) | ✅ | `PATCH /:id/status` — forward-only flow + cancelled |
| Order timeline tracking | ✅ | Creates `order_timeline` entries |
| Stock restore on cancel | ✅ | Increments `stockCount` |
| Tracking number update (admin) | ✅ | `PATCH /:id/tracking` |
| Cancel order (admin) | ✅ | `POST /:id/cancel` |
| CSV export (admin) | ✅ | `GET /export/csv` |
| Stripe PaymentIntent creation | ❌ | `stripe` package installed but not integrated |
| Stripe webhook handler | ❌ | Not implemented |
| PayPal integration | ❌ | Not implemented |
| Order confirmation email | ❌ | Email system not built |
| Order status update emails | ❌ | Email system not built |
| Invoice PDF generation | ❌ | Not implemented |
| Connect `Checkout.tsx` to real API | ❌ | Frontend not connected |
| Connect `AdminOrders.tsx` to real API | ❌ | Frontend not connected |

### Order Status Flow
```
pending → confirmed → paid → processing → packed → shipped → delivered
                   ↘ cancelled (from any status)
```

---

## PHASE 5: RFQ & OFFERS ⚠️

| Task | Status | File |
|------|--------|------|
| RFQ submission API (public) | ✅ | `src/routes/storefront/rfq.ts` — `POST /` |
| RFQ validation (Zod) | ✅ | All 15 fields validated, consent required |
| RFQ number generation | ✅ | `AT-XXXXX` format |
| Response deadline (SLA) | ✅ | Emergency: 2h, Urgent: 24h, Standard: null |
| RFQ list (admin) | ✅ | `src/routes/admin/rfqs.ts` — filters by urgency, status, search |
| RFQ detail (admin) | ✅ | Includes customer, assignee, items, notes |
| RFQ status update (admin) | ✅ | 8 statuses: new, reviewing, awaiting-supplier, quote-sent, customer-replied, won, lost, closed |
| RFQ assignment (admin) | ✅ | `PATCH /:id/assign` |
| RFQ notes (admin) | ✅ | `POST /:id/notes` — internal notes |
| RFQ respond (admin) | ✅ | `POST /:id/respond` — sets status to quote-sent |
| Offer submission API (public) | ✅ | `src/routes/storefront/offers.ts` — `POST /` |
| Offer number generation | ✅ | `OFF-XXXXX` format |
| Offer expiry (7 days) | ✅ | `expiresAt` set on creation |
| Offer list (admin) | ✅ | `src/routes/admin/offers.ts` — filters by status, product |
| Offer detail (admin) | ✅ | Includes product (price, stock) and RFQ |
| Accept offer (admin) | ✅ | `PATCH /:id/accept` |
| Reject offer (admin) | ✅ | `PATCH /:id/reject` |
| Counter offer (admin) | ✅ | `PATCH /:id/counter` |
| RFQ → Offer conversion | ❌ | `POST /:id/convert-to-offer` not implemented |
| RFQ → Order conversion | ❌ | `POST /:id/convert-to-order` not implemented |
| Offer → Order conversion | ❌ | `POST /:id/convert-to-order` not implemented |
| Offer expiry cron job | ❌ | No background job |
| RFQ response email | ❌ | Email system not built |
| Emergency RFQ notification | ❌ | Email system not built |
| Connect `RFQ.tsx` to real API | ❌ | Frontend not connected |
| Connect `AdminRFQs.tsx` to real API | ❌ | Frontend not connected |
| Connect `AdminOffers.tsx` to real API | ❌ | Frontend not connected |
| Connect Make Offer modal to real API | ❌ | Frontend not connected |

---

## PHASE 6: CONTACT, EMERGENCY, MESSAGES ⚠️

| Task | Status | File |
|------|--------|------|
| Contact form submission API | ✅ | `src/routes/storefront/contact.ts` — `POST /` |
| Emergency request API | ✅ | `src/routes/storefront/contact.ts` — `POST /emergency` |
| Auto-create emergency RFQ | ✅ | Creates `Rfq` with `urgency: 'emergency'` + 2h SLA |
| Link emergency to RFQ | ✅ | `emergency_request.rfq_id` |
| Message list (admin) | ✅ | `src/routes/admin/messages.ts` — filters, pagination |
| Message detail (admin) | ✅ | `GET /:id` |
| Mark as read (admin) | ✅ | `PATCH /:id/read` |
| Archive (admin) | ✅ | `PATCH /:id/archive` |
| Delete (admin) | ✅ | `DELETE /:id` |
| Message reply API | ❌ | Not implemented |
| Convert message to RFQ | ❌ | Not implemented |
| Contact notification email | ❌ | Email system not built |
| Connect `Contact.tsx` to real API | ❌ | Frontend not connected |
| Connect `Emergency.tsx` to real API | ❌ | Frontend not connected |
| Connect `AdminMessages.tsx` to real API | ❌ | Frontend not connected |

---

## PHASE 7: CUSTOMERS, MEDIA, SETTINGS ⚠️

| Task | Status | File |
|------|--------|------|
| Customer list (admin) | ✅ | `src/routes/admin/customers.ts` — search, status filter |
| Customer detail (admin) | ✅ | `GET /:id` — includes orders, RFQs, counts |
| Customer status update | ✅ | `PATCH /:id/status` |
| Media list (admin) | ✅ | `src/routes/admin/media.ts` — search, pagination |
| Media usage check | ✅ | `GET /:id/usage` — which products use this image |
| Media delete (with usage check) | ✅ | `DELETE /:id` — prevents deletion if in use |
| Store settings get (admin) | ✅ | `src/routes/admin/settings.ts` — grouped by category |
| Store settings update (admin) | ✅ | `PUT /` — upserts multiple keys |
| Public settings API | ✅ | `src/routes/storefront/settings.ts` — safe subset |
| Homepage sections get (admin) | ✅ | `src/routes/admin/homepage.ts` — `GET /` |
| Homepage sections update (admin) | ✅ | `PUT /` — replace all sections |
| Homepage sections (storefront) | ✅ | `src/routes/storefront/homepage.ts` — enabled only |
| File upload (multer) | ❌ | `multer` installed but not wired to media route |
| Image optimization (sharp) | ❌ | `sharp` installed but not used |
| Thumbnail generation | ❌ | Not implemented |
| WebP/AVIF conversion | ❌ | Not implemented |
| Connect `AdminCustomers.tsx` to real API | ❌ | Frontend not connected |
| Connect `AdminMedia.tsx` to real API | ❌ | Frontend not connected |
| Connect `AdminSettings.tsx` to real API | ❌ | Frontend not connected |
| Connect `AdminHomepage.tsx` to real API | ❌ | Frontend not connected |

---

## PHASE 8: HOMEPAGE, CONTENT, DASHBOARD ✅

| Task | Status | File |
|------|--------|------|
| Dashboard stats API | ✅ | `src/routes/admin/dashboard.ts` — `GET /stats` — products, orders, RFQs, offers, customers, messages |
| Dashboard alerts API | ✅ | `GET /alerts` — low stock, overdue emergency RFQs |
| Dashboard activity log | ✅ | `GET /activity` — recent audit entries |
| Testimonials list (storefront) | ✅ | `src/routes/storefront/testimonials.ts` — visible only |
| Testimonials CRUD (admin) | ❌ | No admin testimonials route — only storefront read |
| Offices CRUD (admin) | ❌ | No admin offices route |
| Offices list (storefront) | ❌ | No storefront offices route |
| Import testimonials from data | ❌ | Seed has 3 testimonials (not full set from `testimonials.ts`) |
| Connect `AdminDashboard.tsx` to real API | ❌ | Frontend not connected |
| Connect `Home.tsx` to real API | ❌ | Frontend not connected |

---

## PHASE 9: ADMIN USERS & AUDIT LOG ✅

| Task | Status | File |
|------|--------|------|
| Admin user list (owner only) | ✅ | `src/routes/admin/users.ts` — `GET /` |
| Admin user create (owner only) | ✅ | `POST /` — bcrypt hash, role validation |
| Admin user update (owner only) | ✅ | `PUT /:id` |
| Admin user deactivate (owner only) | ✅ | `DELETE /:id` — soft delete (sets `isActive: false`) |
| Change role (owner only) | ✅ | `PATCH /:id/role` |
| Prevent self-deactivation | ✅ | `if (req.params.id === req.user!.id)` |
| Audit log middleware | ✅ | `src/utils/audit.ts` — `logAudit()` |
| Audit logging on all admin CRUD | ✅ | Products, orders, RFQs, offers, auth, contacts |
| Audit log list API | ✅ | `src/routes/admin/audit.ts` — filters by entity, actor, action |
| Audit log includes IP + user agent | ✅ | `logAudit()` accepts `ipAddress` and `userAgent` |
| Connect `AdminUsers.tsx` to real API | ❌ | Frontend not connected |

---

## PHASE 10: SEARCH, SEO, POLISH ⚠️

| Task | Status | File |
|------|--------|------|
| Full-text search API | ✅ | `src/routes/storefront/search.ts` — products, categories, brands |
| Search across name, SKU, description, brand, category | ✅ | Case-insensitive `contains` |
| Search result types (product, category, brand) | ✅ | `type` field in results |
| Search with pagination | ❌ | Returns max 20 results, no pagination |
| Connect `Search.tsx` to real API | ❌ | Frontend not connected |
| Connect `CommandSearch.tsx` to real API | ❌ | Frontend not connected |
| PostgreSQL `ts_vector` full-text search | ❌ | Uses `contains` instead of GIN index |
| Per-page SEO meta tags API | ❌ | Not implemented |
| JSON-LD structured data | ❌ | Not implemented |
| `sitemap.xml` generation | ❌ | Not implemented |
| `robots.txt` | ❌ | Not implemented |
| Email templates (all 17 types) | ❌ | Not implemented |
| Email queue worker | ❌ | `email_queue` table exists but no worker |
| Resend integration | ❌ | `resend` package installed but not used |
| Rate limiting per-route | ⚠️ | Global rate limits applied in `server.ts` |
| Request logging | ❌ | No Morgan or custom logger |

---

## PHASE 11: TESTING & DEPLOYMENT ❌

| Task | Status | Notes |
|------|--------|-------|
| Unit tests (utilities) | ❌ | No test files found |
| Integration tests (API endpoints) | ❌ | No test files found |
| Auth flow tests | ❌ | Not implemented |
| Order flow tests | ❌ | Not implemented |
| RFQ flow tests | ❌ | Not implemented |
| Performance testing | ❌ | Not implemented |
| Security audit (OWASP) | ❌ | Not implemented |
| Production database setup | ❌ | Needs `DATABASE_URL` |
| CI/CD pipeline | ❌ | Not configured |
| Deploy backend to production | ❌ | Not deployed |
| Deploy frontend with real API URLs | ❌ | Frontend still uses static data |
| Docker configuration | ❌ | No `Dockerfile` |
| Health check endpoint | ✅ | `GET /api/health` — checks DB connection |

---

## MIDDLEWARE & UTILITIES

| Component | Status | File |
|-----------|--------|------|
| JWT authentication (admin) | ✅ | `src/middleware/auth.ts` |
| JWT authentication (customer) | ✅ | `src/middleware/auth.ts` |
| Role-based access control | ✅ | 6-role hierarchy |
| Owner-only guard | ✅ | `requireOwner()` |
| Zod body validation | ✅ | `src/middleware/validate.ts` |
| Zod query validation | ✅ | `validateQuery()` |
| Zod params validation | ✅ | `validateParams()` |
| Async error handler | ✅ | `asyncHandler()` |
| Slug generation | ✅ | `src/utils/helpers.ts` |
| Order/RFQ/Offer number generation | ✅ | `src/utils/helpers.ts` |
| Pagination helpers | ✅ | `src/utils/helpers.ts` |
| Price helpers (effective price, on-sale) | ✅ | `src/utils/helpers.ts` |
| Audit logging | ✅ | `src/utils/audit.ts` |
| Prisma include shapes | ✅ | `src/utils/prisma-helpers.ts` |
| Helmet (security headers) | ✅ | `src/server.ts` |
| CORS | ✅ | `src/server.ts` |
| Compression | ✅ | `src/server.ts` |
| Cookie parser | ✅ | `src/server.ts` |
| Rate limiting (public: 100/min) | ✅ | `src/server.ts` |
| Rate limiting (admin: 300/min) | ✅ | `src/server.ts` |
| Multer (file upload) | ⚠️ | Installed, not wired |
| Sharp (image processing) | ⚠️ | Installed, not used |
| Resend (email) | ⚠️ | Installed, not used |
| Stripe (payments) | ⚠️ | Installed, not used |

---

## API ENDPOINT SUMMARY

### Admin Routes (16 route files)
| Route | Methods | Auth |
|-------|---------|------|
| `/api/admin/auth` | POST login, POST refresh, POST logout, GET me | Mixed |
| `/api/admin/products` | GET list, GET detail, POST create, PUT update, DELETE, PATCH bulk | Admin |
| `/api/admin/categories` | GET list, POST create, PUT update, DELETE, PATCH reorder | Admin |
| `/api/admin/brands` | GET list, POST create, PUT update, DELETE | Admin |
| `/api/admin/industries` | GET list, POST create, PUT update, DELETE | Admin |
| `/api/admin/orders` | GET list, GET detail, PATCH status, PATCH tracking, POST cancel, GET export/csv | Admin |
| `/api/admin/rfqs` | GET list, GET detail, PATCH status, PATCH assign, POST notes, POST respond | Admin |
| `/api/admin/offers` | GET list, GET detail, PATCH accept, PATCH reject, PATCH counter | Admin |
| `/api/admin/customers` | GET list, GET detail, PATCH status | Admin |
| `/api/admin/messages` | GET list, GET detail, PATCH read, PATCH archive, DELETE | Admin |
| `/api/admin/media` | GET list, GET usage, DELETE | Admin |
| `/api/admin/settings` | GET, PUT | Admin |
| `/api/admin/homepage` | GET, PUT | Admin |
| `/api/admin/users` | GET list, POST create, PUT update, DELETE, PATCH role | Owner |
| `/api/admin/dashboard` | GET stats, GET alerts, GET activity | Admin |
| `/api/admin/audit` | GET list | Admin |

### Storefront Routes (13 route files)
| Route | Methods | Auth |
|-------|---------|------|
| `/api/storefront/products` | GET list, GET featured, GET new-arrivals, GET emergency, GET detail, GET related | Public |
| `/api/storefront/categories` | GET list, GET by slug | Public |
| `/api/storefront/brands` | GET list, GET by slug | Public |
| `/api/storefront/industries` | GET list, GET by slug | Public |
| `/api/storefront/orders` | POST create, GET detail, POST cancel | Customer |
| `/api/storefront/rfq` | POST submit | Public |
| `/api/storefront/offers` | POST submit | Public |
| `/api/storefront/contact` | POST submit, POST emergency | Public |
| `/api/storefront/search` | GET | Public |
| `/api/storefront/homepage` | GET | Public |
| `/api/storefront/settings` | GET | Public |
| `/api/storefront/testimonials` | GET | Public |
| `/api/auth` | POST register, POST login, POST logout, GET me | Mixed |

### Health Check
| Route | Method | Auth |
|-------|--------|------|
| `/api/health` | GET | Public |

**Total: 70+ endpoints across 29 route files**

---

## REMAINING WORK — PRIORITIZED

### 🔴 P0: Critical (Must ship)

1. **Stripe Payment Integration** — Install webhook, create PaymentIntent, handle events
2. **Email System** — Resend integration, 17 templates, email queue worker
3. **File Upload Pipeline** — Multer → Sharp (optimize, thumbnail) → Storage → DB
4. **Frontend Integration** — Connect all 30+ frontend files to real API
5. **Data Migration Script** — Import 255 products from `src/data/products.ts`
6. **Password Reset** — Request + reset token flow

### 🟡 P1: Important (Should ship)

7. **Admin Testimonials CRUD** — No admin route exists
8. **Admin Offices CRUD** — No admin route exists
9. **RFQ/Offer → Order Conversion** — 3 convert endpoints
10. **Offer Expiry Cron** — Background job to mark expired offers
11. **Invoice PDF Generation** — Order invoices
12. **PostgreSQL Full-Text Search** — Replace `contains` with `ts_vector`
13. **Missing Image Detection** — Periodic scan
14. **Low Stock Email Alerts** — After order + stock updates

### 🟢 P2: Nice to have

15. **Sitemap.xml** — Auto-generated from products/categories
16. **robots.txt** — Static or dynamic
17. **JSON-LD** — Product structured data
18. **Search Analytics** — Log what users search for
19. **Weekly/Monthly Reports** — Email summaries
20. **CSV Import** — Bulk product upload
21. **Docker** — `Dockerfile` + `docker-compose.yml`
22. **Tests** — Unit + integration
23. **CI/CD** — GitHub Actions or similar

---

## ENVIRONMENT VARIABLES NEEDED

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
JWT_SECRET=<64-char-hex>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Storage (Supabase or S3)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
STORAGE_BUCKET=product-images

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@alkatraders.com
RFQ_EMAIL=rfq@alkatraders.com
EMERGENCY_EMAIL=emergency@alkatraders.com
ADMIN_EMAIL=admin@alkatraders.com

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Store Defaults
DEFAULT_CURRENCY=USD
DEFAULT_COUNTRY=AE
WHATSAPP_NUMBER=919726900547
COMPANY_PHONE=+9714XXXXXXX
COMPANY_EMAIL=info@alkatraders.com
```

---

*This tracker maps every requirement from BACKEND_ARCHITECTURE.md to actual code. Use it to prioritize the next implementation sprint.*
