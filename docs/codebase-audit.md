# Codebase Audit — Alka Traders

> Audit date: 2026-08-14
> Scope: full monorepo (React/Vite frontend in `src/`, Node/Express + Prisma backend in `backend/`, e2e in `e2e/`).
> Method: inspected structure, ran `tsc`, `eslint`, all unit + e2e test suites, checked security middleware, docs, and git history.

---

## Scorecard

| Aspect | Score | Verdict |
|---|---|---|
| **Architecture** | 7/10 | Solid layering, some oddities |
| **Code quality** | 6/10 | Lint is red, real hook bugs |
| **Type safety** | 8/10 | Clean `tsc` across 476 files |
| **Testing** | 8/10 | 662 unit + 9 e2e suites, all green |
| **Security** | 7/10 | Strong hardening, one history leak |
| **Performance** | 8/10 | Genuinely well-optimized |
| **Documentation** | 2/10 | Zero README, no API docs |
| **DevOps / CI** | 8/10 | CI, multi-platform deploy, ops hardening |
| **Maintainability** | 6/10 | Big files, prefix hack, SQL drift |
| **Overall** | **7/10** | Launch-ready but rough edges |

---

## Project facts

| Metric | Value |
|---|---|
| Total LOC (TS/TSX/CSS/SQL) | ~61,500 |
| TypeScript/TSX files | 476 |
| Frontend LOC (`src/`) | ~37,500 |
| Backend LOC (`backend/src`) | ~12,000 |
| Prisma models | 26 |
| Prisma migrations | 2 |
| Unit test files | 38 (32 frontend + 21 backend files) |
| Unit tests passing | 662 (387 frontend + 275 backend) |
| Playwright e2e specs | 9 (smoke, auth, admin, api, cart-checkout, rfq-search, storefront, responsive, accessibility) |
| Commits | 179, conventional prefixes (`feat/fix/chore/perf`) |
| Deploy targets | Hostinger (primary — frontend + backend) |

---

## Strengths

### Architecture — 7/10
- Clean `routes → services → prisma` layering; storefront/admin/webhooks route split.
- `shared/` directory holds canonical API types consumed by both frontend and backend.
- 26 Prisma models with real (non-squashed) migrations.

### Type safety — 8/10
- `tsc -b --noEmit` passes for the whole repo — frontend and backend.
- Shared canonical types, strict-mode discipline across 476 files.

### Testing — 8/10
- 387 frontend + 275 backend unit tests, all passing.
- 9 Playwright e2e suites including accessibility and responsive checks.
- CI runs tests against a real Postgres 16 service.

### Security hardening — strong foundation
- Helmet with a strict, explicit CSP.
- CORS allowlist (`PRODUCTION_CORS_ORIGINS` merged with env value).
- CSRF tokens, global + per-user rate limiting, XSS sanitization middleware.
- Refuses to boot in production without a real `JWT_SECRET`; validates URL env vars against localhost fallbacks.
- Health endpoint redacts driver/host/error details in production.
- Correct `trust proxy` setting for the reverse proxy (rate limiting + secure cookies work).

### Performance — 8/10
- Lazy route splitting with skeleton loaders (no white flash).
- GET response cache (node-cache) for whitelisted storefront reads.
- Prerendering + sitemap generation into the static build.
- Static asset caching (`maxAge: 1y, immutable`), PWA, code splitting.
- Neon free-tier cold-start wake endpoint; frontend pings it on load and tab-visibility.

### Ops / resilience
- Graceful shutdown (SIGTERM/SIGINT) that drains the email queue.
- Email queue processor with retries; DB connect retries with exponential backoff.
- Startup banner written to stderr so platforms that only surface stderr.log still show boot state.
- Health/wake endpoints with wake-aware `SELECT 1`.

---

## Issues found

### High severity

1. **Admin credential committed to git history** (security)
   `docs/audit-execution-prompt.md` documents that a real admin seed password was
   committed via `backend/.env.example` and is reachable through git history
   (`git log -S <value>`). It has been scrubbed to `change-me` in the working
   tree, but **history still contains it**.
   → **Required follow-up: rotate the admin password** in the DB and in any
   environment/deployment that reused it. Do not rewrite history without the
   owner's decision.

2. **Lint fails — 4 errors, 2 warnings** (code quality, latent bugs)
   `npm run lint` is red with **real react-hooks violations**, not style nits:
   - `src/pages/account/OrderHistory.tsx:29` — `useOrders()` called conditionally (rules-of-hooks).
   - `src/pages/admin/AdminProducts.tsx:56-57` — refs accessed during render.
   - `src/hooks/useOptimisticMutation.ts:49` — refs accessed during render.
   - `src/pages/Industries.tsx:20` — unstable `useEffect` dependency (warning).
   - `src/components/admin/ProductPreviewModal.tsx:20` — fast-refresh export warning.
   These can cause runtime crashes or stale-render bugs. CI currently does not run lint, so these ship silently.

### Medium severity

3. **Zero documentation** — no README anywhere in the repo. No setup guide, no
   env-var reference, no API docs. The only file in `docs/` is an AI-agent audit
   runbook. For ~61k LOC this is the biggest onboarding gap.

4. **Ad-hoc SQL outside migrations** — `database/` contains one-shot scripts
   (`MEGA_SETUP.sql`, `cleanup.sql`, `update-admin-login.sql`,
   `update-contact-info.sql`, `schema.sql`, `seed.sql`) that can drift from the
   Prisma schema/migrations.

5. **God-files** — `AdminProducts.tsx` (534), `Navbar.tsx` (527),
   `useProductForm.ts` (525), `Products.tsx` (497), `useStore.ts` (488).

6. **`any` escapes** in API layer, e.g. `src/lib/api/admin.ts` (`asset: any`).

7. **Monorepo layout inconsistency** — frontend source at root `src/`, backend
   in `backend/`, and a `frontend/` dir that only holds a dist artifact. The
   shared-types module exists but the frontend re-exports it via
   `src/lib/api-types.ts` for backward compat.

### Low severity / nits

8. **Dual API prefix registration** — every route is mounted under both `/api`
   and `/api/v1` via a loop. Works, but doubles route registration and adds
   middleware overhead; sunset the `/api` prefix once clients migrate.

9. **Dev fallback `JWT_SECRET`** hardcoded in `backend/src/utils/env.ts`
   (safe in dev only; production refuses to boot without a real secret).

10. **81 MB of `public/` assets** (hero.mp4, images) — weighs down deploys and
    first paint; consider lazy-loading/compressing the video.

11. **`package.json` version pinned at `0.0.0`** — never bumped across 179 commits.

12. **No test coverage gate** in CI.

---

## Verification run (2026-08-14)

```
typecheck        PASS  (tsc -b --noEmit, frontend + backend)
lint             FAIL  (4 errors, 2 warnings — react-hooks violations)
frontend tests   387 passed / 387
backend tests    275 passed / 275
playwright       not run locally (requires live dev servers + DB)
```

---

## Recommended fixes, in order

1. **Rotate the admin password** that leaked into git history (highest severity).
2. **Fix the 4 lint errors** — real react-hooks violations; also add `npm run lint` to CI so they can't regress.
3. **Write a README** — setup, env vars, test/build commands, deploy notes.
4. Move ad-hoc SQL into Prisma migrations; drop the duplicate `/api` prefix.
5. Split the largest components (AdminProducts, Navbar, useStore).
6. Enforce a coverage gate in CI.
