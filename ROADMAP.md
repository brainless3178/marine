# 🎯 Roadmap: 78% → 100% Codebase Score

> **Project:** Alka Traders — Marine & Industrial E-Commerce Platform  
> **Date:** July 28, 2026  
> **Total Estimated Effort:** ~147 hours (~3–4 weeks focused work)

---

## 📊 Current State → Target State

| Category | Current | Target | Gap | Points to Gain |
|----------|---------|--------|-----|----------------|
| 🏗️ Architecture | 88 | 100 | 12 | +12 |
| 🔒 Security | 87 | 100 | 13 | +13 |
| 🎨 Frontend Quality | 79 | 100 | 21 | +21 |
| ⚙️ Backend Quality | 80 | 100 | 20 | +20 |
| 🧪 Testing | 74 | 100 | 26 | +26 |
| 📐 Code Quality | 76 | 100 | 24 | +24 |
| 📊 Performance | 85 | 100 | 15 | +15 |
| 📦 Dependencies | 86 | 100 | 14 | +14 |

---

## 🔧 Phase 1: Code Quality (76→100) — Biggest Impact

> **The #1 blocker. 24 points to gain.**

### 1.1 Eliminate `as any` Casts (220+ instances → 0)

| Location | Count | Fix |
|----------|-------|-----|
| `src/hooks/useProductForm.ts` | 12 | Type form data properly, create `ProductFormData` generics |
| `src/hooks/useDashboardData.ts` | 8 | Type `Promise.allSettled` results with discriminated unions |
| `src/hooks/useAdminDashboard.ts` | 6 | Same — type API responses properly |
| `src/hooks/useLiveOrders.ts` | 1 | Use `ApiOrder[]` from `api-types.ts` |
| `src/pages/admin/*.tsx` (10 files) | ~40 | Each `mapApi*()` function needs proper parameter types instead of `(x: any)` |
| `src/pages/Checkout.tsx` | 8 | Type PayPal callback params |
| `src/pages/RFQ.tsx` | 3 | Type form update function |
| `src/pages/ProfileEdit.tsx` | 3 | Use typed `User` from api-types |
| `backend/src/middleware/auth.ts` | 2 | Fix `SignOptions` — use `expiresIn` as a typed `JwtPayload` field |
| `backend/src/routes/admin/*.ts` | ~15 | Type `where: any` query builders with `Prisma.XxxWhereInput` |
| `backend/src/services/email.ts` | 10 | Type `templateData` properly |
| `backend/src/middleware/validate.ts` | 2 | Use Zod inferred types instead of `as any` cast |
| `backend/src/__tests__/integration.test.ts` | 10 | These are OK — test mocks legitimately use `as any` |

**Estimated effort:** ~12 hours

### 1.2 Replace Silent `catch {}` Blocks (31 frontend + 14 backend → 0)

Every `catch {}` should either:
- Log to Sentry: `catch (e) { captureException(e) }`
- Set error state: `catch (e) { setError(e.message) }`
- Be documented why it's intentionally empty: `catch { /* expected: CSRF token fetch during page load */ }`

| File | Count | Fix |
|------|-------|-----|
| `src/lib/api.ts` | 4 | Log to Sentry — these are CSRF token and refresh failures |
| `src/store/useStore.ts` | 5 | 2 are intentional (logout ignores), 3 should log |
| `src/pages/Shop.tsx` | 3 | Set fallback state |
| `src/pages/Search.tsx`, Products, ProductDetail | 3 | Set empty results state |
| `src/components/admin/dashboard/*.tsx` | 7 | Log errors |
| `backend/src/middleware/auth.ts` | 2 | Log warning — JWT verification failure |
| `backend/src/routes/admin/auth.ts` | 1 | Log warning |
| `backend/src/routes/storefront/auth.ts` | 2 | Log warning |

**Estimated effort:** ~3 hours

### 1.3 Decompose 20 Large Files (>400 lines)

| File | Lines | Split Into |
|------|-------|-----------|
| `Checkout.tsx` | 750 | `CheckoutShipping`, `CheckoutPayment`, `CheckoutReview`, `CheckoutSuccess` |
| `AdminSettings.tsx` | 719 | `SettingsGeneral`, `SettingsShipping`, `SettingsPayments`, `SettingsNotifications` |
| `AdminOrders.tsx` | 689 | `OrderTable`, `OrderFilters`, `OrderDetailModal`, `TrackingModal` |
| `api.ts` | 628 | `api/core.ts`, `api/storefront.ts`, `api/admin.ts`, `api/auth.ts` |
| `AdminInsights.tsx` | 592 | Already has 51 sub-components — refactor to use dynamic imports |
| `AdminCustomers.tsx` | 550 | `CustomerTable`, `CustomerCreateModal`, `CustomerDetailModal` |
| `AuthModal.tsx` | 543 | `LoginForm`, `RegisterForm`, `AuthTabs` |
| `email.ts` | 516 | `email/templates/order.ts`, `email/templates/rfq.ts`, `email/templates/contact.ts` |
| `AdminProducts.tsx` | 413 | Already partially split — extract `useProductList` hook |
| `useProductForm.ts` | 452 | Split into `useProductForm`, `useProductImages`, `useProductSpecs` |
| `products.ts` (backend) | 581 | Extract to `services/productService.ts` |
| `orders.ts` (backend) | 347 | Extract to `services/orderService.ts` |
| `rfqs.ts` (backend) | 300 | Extract to `services/rfqService.ts` |

**Estimated effort:** ~20 hours

---

## 🧪 Phase 2: Testing (74→100) — Second Biggest Impact

### 2.1 Fix Pre-existing Test Failure

`adapters.test.ts` — 1 failing test across multiple sessions. Fix or update the test.

**Estimated effort:** ~1 hour

### 2.2 Add Backend Unit Tests (Currently 0 unit tests)

| Module | Current Tests | Needed |
|--------|--------------|--------|
| `services/email.ts` | 0 | 10+ (template rendering, queue processing) |
| `middleware/auth.ts` | 0 | 8+ (JWT sign/verify, role checking) |
| `middleware/csrf.ts` | Partial | Complete coverage |
| `middleware/sanitize.ts` | Partial | Complete coverage |
| `utils/paypal.ts` | 0 | 6+ (create order, capture, refund) |
| `utils/helpers.ts` | 0 | 5+ (formatPrice, slugify, etc.) |
| Route handlers | Integration only | Add unit tests with mocked Prisma |

**Estimated effort:** ~15 hours

### 2.3 Add Frontend Page-Level Tests

Currently only `Button` and `Card` components are tested. Add tests for:

| Component | Priority |
|-----------|----------|
| `CartDrawer` | High — core e-commerce flow |
| `CommandSearch` | High — frequently used |
| `ProductCard` | High — renders on every listing |
| `Checkout` | High — critical business flow |
| `AdminDashboard` | Medium |
| `AdminProductForm` | Medium |
| `SEO` component | Medium |
| `Navbar` | Medium |

**Estimated effort:** ~12 hours

### 2.4 Add Dashboard Component Tests

51 dashboard components have **zero tests**. Add smoke tests for each:

```tsx
// Pattern: render without crashing + basic assertions
describe('BusinessHealthScore', () => {
  it('renders score', () => { ... })
  it('handles zero data', () => { ... })
})
```

**Estimated effort:** ~8 hours

### 2.5 Increase E2E Coverage

Current: 88 tests across 8 spec files. Add:
- Payment flow E2E (PayPal sandbox)
- RFQ submission end-to-end
- Admin product CRUD workflow
- User registration → order placement flow
- Search and filter interactions

**Estimated effort:** ~10 hours

---

## ⚙️ Phase 3: Backend Quality (80→100)

### 3.1 Create Service Layer

Extract business logic from 18 route files into services:

```
backend/src/
  services/
    email.ts              (exists)
    productService.ts     (NEW — 28 Prisma calls from products.ts)
    orderService.ts       (NEW — 25 Prisma calls from orders.ts)
    rfqService.ts         (NEW — 20 Prisma calls from rfqs.ts)
    mediaService.ts       (NEW — 11 Prisma calls from media.ts)
    customerService.ts    (NEW)
    authService.ts        (NEW — extract from routes)
```

**Estimated effort:** ~15 hours

### 3.2 Add Shared Types Package

Create `shared/` directory with types used by both frontend and backend:

```
shared/
  types.ts          — Product, Order, User, etc.
  api-responses.ts  — All API response shapes
  validation.ts     — Zod schemas (used by both sides)
```

This eliminates the 40+ `as any` casts caused by type mismatches between `types/index.ts` and `api-types.ts`.

**Estimated effort:** ~8 hours

---

## 🏗️ Phase 4: Architecture (88→100)

### 4.1 Add API Response Middleware

Standardize all API responses with a consistent envelope:

```ts
interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
  details?: FieldError[]
  pagination?: Pagination
}
```

**Estimated effort:** ~4 hours

### 4.2 Add Request Validation at Route Level

Currently `validate.ts` middleware exists but not all routes use it. Add Zod validation to every route:
- Admin: products create/update, orders status update, settings update
- Storefront: RFQ submit, offer submit, contact form, order create

**Estimated effort:** ~6 hours

### 4.3 Add API Versioning Prefix

`/api/v1/storefront/products` instead of `/api/storefront/products` — future-proofing.

**Estimated effort:** ~3 hours

---

## 🔒 Phase 5: Security (87→100)

### 5.1 Fix Remaining npm Vulnerability

The react-router RSC CSRF bypass (affects 7.12.0–8.2.0) is not exploitable in client-side React, but for a perfect score:
- Option A: Wait for `react-router-dom` 8.x release
- Option B: Pin `react-router` to a version before 7.12.0 if possible
- Option C: Document the accepted risk formally

**Estimated effort:** ~1 hour (documentation)

### 5.2 Add Security Headers Audit

Run `npx helmet-inspector` or similar to verify all CSP directives are optimal.

**Estimated effort:** ~1 hour

### 5.3 Add Rate Limiting per User

Currently rate limiting is per-IP. Add per-user rate limiting for authenticated endpoints.

**Estimated effort:** ~3 hours

---

## 📊 Phase 6: Performance (85→100)

### 6.1 Replace GSAP + framer-motion Duplication

Use **only** framer-motion (more React-native). Remove GSAP from:
- `About.tsx` (GSAP ScrollTrigger)
- `HowItWorks.tsx` (GSAP ScrollTrigger)
- `Emergency.tsx` (GSAP ScrollTrigger)

Replace with framer-motion's `useInView` + `motion.div` animations.

**Estimated effort:** ~4 hours

### 6.2 Add React Query / SWR for Data Caching

Currently every page re-fetches on mount. Add `@tanstack/react-query` for:
- Automatic caching of product listings
- Deduplication of concurrent requests
- Background refetching
- Optimistic updates for cart operations

**Estimated effort:** ~12 hours

### 6.3 Add Service Worker / PWA Support

Add offline support for product listings and static assets.

**Estimated effort:** ~6 hours

### 6.4 Dynamic Import Three.js

```ts
const GlobeScene = lazy(() => import('./GlobeScene'))
```

Only load the ~200KB Three.js bundle when the Network page is visited.

**Estimated effort:** ~1 hour

---

## 📦 Phase 7: Dependencies (86→100)

### 7.1 Remove GSAP (if replaced by framer-motion)

~50KB saved from bundle.

### 7.2 Audit `papaparse` Usage

Only used in `AdminProducts.tsx` for CSV import. Consider:
- Keeping it (it's small, ~20KB)
- Or replacing with a manual CSV parser

### 7.3 Remove `three` from Main Bundle

Dynamic import as mentioned in Phase 6.

**Estimated effort:** ~2 hours total

---

## 📅 Implementation Timeline

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| 1. Code Quality (`as any`, catch blocks, decomposition) | ~35 hrs | +24 pts | 🔴 Critical |
| 2. Testing (fix failures, backend tests, page tests, E2E) | ~46 hrs | +26 pts | 🔴 Critical |
| 3. Backend Quality (service layer, shared types) | ~23 hrs | +20 pts | 🟡 High |
| 4. Architecture (validation, response envelope, versioning) | ~13 hrs | +12 pts | 🟡 High |
| 5. Security (vuln fix, rate limiting) | ~5 hrs | +13 pts | 🟢 Medium |
| 6. Performance (remove GSAP, React Query, PWA) | ~23 hrs | +15 pts | 🟢 Medium |
| 7. Dependencies (cleanup) | ~2 hrs | +14 pts | 🟢 Low |

---

## 🚀 Recommended Execution Order

```
Week 1: Phase 1 (Code Quality) — biggest score impact per hour
  → Eliminate `as any` casts
  → Fix silent catch blocks
  → Start decomposing large files

Week 2: Phase 2 (Testing) — second biggest impact
  → Fix pre-existing test failure
  → Add backend unit tests
  → Add page-level component tests

Week 3: Phase 3 + 4 (Backend + Architecture)
  → Create service layer
  → Add shared types
  → Add request validation

Week 4: Phase 5 + 6 + 7 (Security + Performance + Deps)
  → Fix npm vulnerabilities
  → Replace GSAP with framer-motion
  → Add React Query
  → Dynamic import Three.js
```

---

## ✅ Definition of Done (100% Score)

| Category | 100% Criteria |
|----------|---------------|
| 🏗️ Architecture | Shared types, service layer, API versioning, response envelope, validation on all routes |
| 🔒 Security | 0 npm vulnerabilities, per-user rate limiting, CSP audit passed |
| 🎨 Frontend Quality | No file >400 lines, no inline styles for static values, full i18n, dark/light theme everywhere |
| ⚙️ Backend Quality | Service layer for all routes, 0 `as any` in production code, typed middleware |
| 🧪 Testing | 0 failing tests, backend unit tests for all modules, page-level tests, 120+ E2E tests |
| 📐 Code Quality | 0 `as any` casts, 0 silent catch blocks, ESLint `no-explicit-any` rule enabled |
| 📊 Performance | No duplicate animation libs, React Query caching, PWA support, Three.js lazy-loaded |
| 📦 Dependencies | 0 unused deps, all at latest versions, 0 vulnerabilities |
