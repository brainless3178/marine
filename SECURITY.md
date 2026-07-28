# Security Documentation — Alka Traders

## 1. Accepted Risks (npm Vulnerabilities)

### 1.1 `brace-expansion` — DoS via Unbounded Expansion

| Field | Value |
|-------|-------|
| **Severity** | High |
| **CVE** | [CVE-2024-37367](https://github.com/advisories/GHSA-99hc-2j5v-rqmr) |
| **Affected** | `brace-expansion` <= 5.0.7 |
| **Path** | `vite-plugin-pwa` → `workbox-build` → `rollup-plugin-off-main-thread` → `ejs` → `jake` → `filelist` → `minimatch` → `brace-expansion` |
| **Exploitable** | ❌ **Build-time only** — not present in browser bundle |
| **Risk** | Minimal. The vulnerability can only be triggered during `npm run build` if a malicious config causes `brace-expansion` to process an unbounded expansion. It cannot be exploited by end users visiting the site. |
| **Fix available** | `npm audit fix --force` (upgrades `vite-plugin-pwa` to 1.2.0, breaking change). Not applied because the risk is build-time only and the breaking change requires testing. |

### 1.2 `react-router` — RSC Mode CSRF Bypass

| Field | Value |
|-------|-------|
| **Severity** | High |
| **CVE** | Pending (GitHub Advisory) |
| **Affected** | `react-router` >= 7.12.0, < 8.3.0 |
| **Path** | `react-router` → `react-router-dom` |
| **Exploitable** | ❌ **Not exploitable in client-side React SPA** |
| **Risk** | The vulnerability affects React Server Components (RSC) mode, where an action can be executed before a 400 response is returned. Our application is a pure client-side Vite SPA with no RSC usage. The `react-router-dom` version is pinned at `^7.18.1` for stable client-side routing. |
| **Resolution** | Wait for `react-router` 8.x stable release, then upgrade. No action required for client-side usage. |

---

## 2. Security Headers Audit (Helmet Configuration)

All security headers are configured via `helmet` middleware in `backend/src/server.ts` (line 112).

### 2.1 Content Security Policy (CSP)

| Directive | Value | Notes |
|-----------|-------|-------|
| `default-src` | `'self'` | Baseline |
| `script-src` | `'self'`, `https://www.paypal.com`, `https://www.paypalobjects.com` | PayPal SDK |
| `style-src` | `'self'`, `'unsafe-inline'`, `https://fonts.googleapis.com` | Google Fonts |
| `img-src` | `'self'`, `data:`, `https:`, `https://res.cloudinary.com` | Cloudinary CDN |
| `connect-src` | `'self'`, `https://api-m.paypal.com`, `https://www.paypal.com`, `https://res.cloudinary.com` | PayPal + Cloudinary |
| `frame-src` | `https://www.paypal.com`, `https://sandbox.paypal.com` | PayPal iframes |
| `frame-ancestors` | `'none'` | Anti-clickjacking |
| `font-src` | `'self'`, `https://fonts.gstatic.com`, `data:` | Google Fonts |
| `object-src` | `'none'` | Block plugins |
| `base-uri` | `'self'` | Prevent base URI injection |
| `form-action` | `'self'` | Prevent form action hijacking |
| `manifest-src` | `'self'` | PWA manifest |
| `upgrade-insecure-requests` | Enabled | Auto-upgrade HTTP to HTTPS |

**Status: ✅ Comprehensive — no gaps identified.**

### 2.2 Other Headers

| Header | Value | Status |
|--------|-------|--------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | ✅ 1 year, preload ready |
| `X-Content-Type-Options` | `nosniff` | ✅ (set by Helmet default) |
| `X-Frame-Options` | `DENY` | ✅ (via `frame-ancestors: 'none'`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Cross-Origin-Embedder-Policy` | Disabled | ⚠️ Intentionally disabled for cross-origin resources |
| `Cross-Origin-Opener-Policy` | `same-origin` | ✅ |
| `Cross-Origin-Resource-Policy` | `cross-origin` | ✅ Required for CDN resources |

**Status: ✅ All headers correctly configured for this application's needs.**

---

## 3. Additional Security Measures

| Measure | Status | Notes |
|---------|--------|-------|
| **Rate Limiting (IP-based)** | ✅ `express-rate-limit` — 100 req/min public, 300 admin |
| **Rate Limiting (per-user)** | ✅ Custom `createUserAwareLimiter` for authenticated endpoints |
| **CSRF Protection** | ✅ Custom middleware with double-submit cookie pattern |
| **XSS Sanitization** | ✅ `sanitize` middleware on all request bodies |
| **Input Validation** | ✅ Zod schemas on all 24 mutation routes |
| **SQL Injection** | ✅ Prisma ORM (parameterized queries by default) |
| **PayPal Webhook Verification** | ✅ Signature verification + SSRF guard on `cert_url` |
| **Sentry Error Tracking** | ✅ `@sentry/react` on frontend + backend |
| **Helmet** | ✅ All headers configured (see §2) |

---

## 4. Recommended Improvements (Non-Critical)

1. **Upgrade `vite-plugin-pwa`** when `workbox-build` updates its `brace-expansion` dependency (tracking)
2. **Upgrade `react-router-dom`** to 8.x stable when released (resolves RSC CSRF advisory)
3. **Monitor HSTS preload status** — re-submit to [hstspreload.org](https://hstspreload.org) if domain changes
4. **Environment variable secrets** — rotate `JWT_SECRET`, `PAYPAL_CLIENT_SECRET` quarterly

---

*Last updated: July 2026*
