# Audit Execution Prompt — Alkatraders (complete, hardened)

You are executing a **code-fix pass for the production audit** of this monorepo
(React/Vite frontend in `src/`, Node/Express + Prisma backend in `backend/`).
Work from the current working tree. **Minimal, surgical changes only** — the
audit is a set of correctness/consistency defects, not a redesign. Do not add
new functions, new architecture, new libraries, or new persistence mechanisms
unless a task below explicitly requires it.

## Guardrails (apply to everything)

1. **Never print, commit, or paste the committed admin password.** The audit
   found a real admin seed password committed in `backend/.env.example` (tracked
   in git history, see task A). Refer to it only as `[redacted ADMIN_PASSWORD]`.
   If you must quote it to search for it, use a grep over git history, never
   echo it into your output.
2. **Do not redesign, re-architect, or invent new states.** Prefer existing
   order statuses, settings keys, endpoints, and store flows. When a defect is
   a missing guard or an inconsistency, fix it with the smallest change that
   uses existing mechanisms.
3. **Do not change deployment configuration or architecture.** Hostinger
   (frontend + backend) is out of scope except to verify nothing you touch
   breaks it (task L).
4. **Do not delete unrelated uncommitted work.** The working tree intentionally
   contains untracked files (`backend/eslint.config.js`,
   `src/components/admin/toast-context.ts`, `src/hooks/useTickerNow.ts`) and many
   in-progress modifications. Leave all of them untouched except where a task
   explicitly names a file. The only stray files that may be deleted are the
   accidental `src/nul` and `NUL` artifacts if they exist.
5. **Do not weaken server-side price authority.** The server always recomputes
   order totals from the product table. Client-sent prices are display-only
   estimates. Never change that contract.
6. **Preserve the test baseline.** Current verified baseline: **375 frontend
   tests** and **255 backend tests** (total 630; audit baseline is 625 =
   frontend ≥ 375 + backend ≥ 250). The final result must remain at or above
   the audit baseline. A test expectation may only change when an explicitly
   required behavior change legitimately alters it, and that change must be
   intentional and explained.

## Task A — Committed credential (backend/.env.example)

- `backend/.env.example` contains a real admin seed password as
  `ADMIN_PASSWORD=...` (the audit's highest-severity item).
- Replace the value with an unambiguous placeholder (e.g. `change-me`).
- **Check git history** (`git log -S <the value> -- backend/.env.example`) and
  confirm the credential's reach: it is committed in history, so scrubbing the
  file alone is insufficient. Ensure it no longer appears in any **tracked**
  configuration (`.env.example`, `database/*.sql`, seeds, docs) or in the
  current working tree. Do **not** rewrite git history — that is a deploy-time
  decision for the owner — but report exactly which commits contain it.
- Because it is in history, the credential is compromised: **flag that the
  admin password must be rotated** and that any environment/deployment that
  reused it must be updated. Do not rotate anything yourself; surface it as a
  required follow-up.
- Verify the placeholder survives `git status` as the only change to this file
  plus any other files where the value was mirrored.

## Task B — JWT_SECRET hardening + dead-code verification

- `backend/src/utils/env.ts` populates a development fallback `JWT_SECRET` and,
  in production, now **refuses to boot** without a real secret
  (`FATAL [startup] JWT_SECRET is required in production`).
- The audit notes the module-load guards in `backend/src/middleware/auth.ts`
  and `backend/src/services/authService.ts` (each throws
  `FATAL: JWT_SECRET environment variable is required`) are **dead code**:
  `env.ts` runs first and always populates the variable.
- After fixing `env.ts`, **verify those guards against the new contract** and
  reconcile them:
  - If they can never fire (env.ts guarantees a value in every boot path,
    including tests), remove them or document them accurately — they must not
    stay as misleading dead guards.
  - If any boot path (e.g. a test importing those modules directly without
    env.ts) can bypass env.ts, keep a correct guard that matches the real
    behavior.
- Confirm `backend/src/server.ts`'s secret-length/keyword warnings still apply
  to the fallback path and to user-supplied production secrets.

## Task C — Customer + admin session restoration via httpOnly cookies

- Session restoration must go through the existing refresh endpoints —
  `/auth/refresh` (customer) and `/admin/auth/refresh` (admin) — using the
  existing httpOnly refresh cookies.
- The store already restores in-memory access tokens before calling `/me`
  (`src/lib/api/core.ts`, `loadCustomerSession`/`loadAdminSession` in
  `src/store/useStore.ts`). **Do not add any new persistence mechanism**
  (no new localStorage fields, no new tokens, no session storage) to make
  sessions survive reloads.
- Verify both flows end-to-end in code: page reload → refresh endpoint called
  with httpOnly cookie → access token restored → `/me` succeeds → user/admin
  state restored. Fix any gap (e.g. admin route guards that fail after reload).

## Task D — Free-shipping copy: unify on $500

- The configured rule is **$500** (`checkout.freeShippingThreshold = 500` in
  the DB seeds, and the topbar/locales already say "$500").
- **Locate every remaining customer-facing `$100` free-shipping reference**, not
  just the one known component. Known stale location:
  `src/pages/TermsOfService.tsx` (~lines 149–151: "$100" freight rules).
- Grep the whole repo for `$100` / `100` freight claims (check `src/pages`,
  `src/locales/*.json`, `public/llms-full.txt`, and any marketing copy), update
  each to **$500**, and keep the wording consistent with the shipping rule
  (free shipping on orders at/above $500).
- Do not touch `src/test/formatPrice.test.ts` (`$100.00` is a formatting test,
  not copy).

## Task E — Free-shipping configuration must come from settings

- `createOrder()` in `backend/src/services/orderMutations.ts` must read
  `checkout.freeShippingThreshold` from the store settings table and compute
  shipping as `subtotal >= threshold ? 0 : baseShippingCost`.
- **The `500` value is only the fallback default** (`|| 500`), never a
  hardcoded rule. Verify the same setting key is honored everywhere totals are
  computed (backend `createOrder`, frontend estimate in `src/pages/Checkout.tsx`
  and `src/pages/checkout/CheckoutSuccess.tsx` via `useStoreSettings`).
- Confirm the setting is exported by `getPublicSettings()` so the frontend
  estimate matches the server rule, and that both agree on the boundary
  (`>= threshold` = free).

## Task F — Stock failure must never leave an order falsely paid

- Trace the **entire PayPal capture → stock decrement → order status** flow:
  - `handleCaptureCompleted` (PayPal webhook),
  - `capturePaypalOrder` (storefront capture route),
  - `updateOrderStatus` (`paid`) in `backend/src/services/orderMutations.ts`.
- The atomic decrement (`$executeRawUnsafe ... WHERE stockCount >= qty`) can
  return 0 rows. A failed decrement must **not** leave the order marked
  `paid`/`confirmed`. Verify each path:
  - reverts the order to a consistent existing state (the previous status, or
    `pending` where no prior state exists) — **do not invent a new order state**,
  - records a timeline/audit note that manual review is required,
  - surfaces the failure (HTTP error / webhook log) instead of silently
    succeeding.
- Pre-flight checks are allowed before charging the customer, but the critical
  requirement is the post-decrement invariant: **payment-confirmed ⇒ stock
  decremented**. Add a test for each path (webhook, capture, admin confirm).

## Task G — Refund failure must not produce a false "refunded" state

- Inspect the existing cancellation/refund transaction flow
  (`restoreStockAndRefund` and `updateOrderStatus('cancelled')` in
  `backend/src/services/orderMutations.ts`, and `processPaypalRefund`).
- The defect to prevent: **stock restored + PayPal refund failed + order marked
  `paymentStatus: refunded`**.
- Preserve consistency using existing states and logic:
  - If a PayPal refund is required and fails, do **not** mark the order
    refunded; log the failure and record a timeline note that a manual refund is
    required.
  - Only set `paymentStatus: refunded` when the refund actually succeeded or no
    automated refund is required.
- Do not introduce new states or a new refund mechanism; reuse the existing
  timeline/audit facilities.

## Task H — Cart stale price (real latent bug)

- The cart persists the **full `Product` snapshot** in localStorage
  (`loadState<CartItem[]>('cart', [])` in `src/store/useStore.ts`), and all
  totals/counts (`computeCartTotals`) are derived from that snapshot. When an
  admin changes a product's price or sale status, the persisted cart keeps
  showing the old price in the drawer and checkout estimate.
- Fix the stale display using the **existing product data/API architecture** —
  e.g. revalidate the persisted cart's prices against fresh product data when
  the cart is loaded/rendered (storefront products endpoint / existing product
  fetch), and/or drop stale fields on rehydration. Pick the smallest approach
  that does not add new persistence.
- **Do not weaken server-side price authority**: `createOrder()` recomputes
  totals from the DB and must remain the source of truth. The client estimate
  may be corrected, but the server total is authoritative and the client must
  never dictate prices.
- Add/adjust a unit test covering the rehydrated-cart price refresh.

## Task I — 5-minute idempotency: audit, don't redesign

- The audit flags order-creation idempotency as a production concern. The
  existing implementation stores the client key as a `[idem:...]` marker in
  `customerNotes` and dedupes via `findFirst` (`createOrder` in
  `backend/src/services/orderMutations.ts`; `X-Idempotency-Key` is an allowed
  CORS header).
- **Audit and verify the existing behavior** (does the client send a key? does
  the dedupe race protect against double-submit?). Do **not** redesign
  idempotency or extend it into a new mechanism. Only correct it if the
  existing implementation can be safely fixed in place without introducing new
  architecture — otherwise report the residual risk and leave it.

## Task J — Production environment verification (not just var existence)

- Check that production cannot accidentally resolve to `http://localhost:5173`
  for customer-facing URLs. This is stronger than checking env vars exist —
  verify each **consumer** of the URL:
  - PayPal `return_url`/`cancel_url` (`backend/src/services/paypalService.ts`
    currently falls back to `http://localhost:5173`),
  - password-reset links (`backend/src/services/authService.ts`),
  - transactional emails (`backend/src/services/emailTemplates.ts`),
  - CORS origins and admin URLs (`backend/src/server.ts`).
- `backend/src/utils/env.ts` already warns in production when `FRONTEND_URL` or
  `CORS_ORIGIN` is missing or points at localhost. Verify that warning covers
  all the consumers above and that production config files (`.env.production`,
  Hostinger env) actually set real `https://` values.
- Add tests for URL construction where practical (e.g. PayPal return URL uses
  the configured `FRONTEND_URL`, not the localhost fallback, when set).

## Task K — Working tree hygiene

- Stray files `src/nul` and `NUL` (from a past `> nul` redirect) are
  untracked artifacts; they may be deleted.
- **Do not delete or modify any other untracked or uncommitted work**, and do
  not commit anything unless explicitly asked.

## Task L — No accidental deployment changes

- Verify the fixes do not break the deployment path:
  - **Hostinger** (primary — `backend/` service + built frontend,
    incl. `.hostinger/config.json` env).
- Do not change deployment architecture, build commands, or runtime settings.
  If a fix touches a file consumed by deployment (env defaults, build output,
  settings seeds), confirm the deployment still functions with the change.

## Task M — Verification gate (CI + local)

The audit baseline CI (`.github/workflows/ci.yml`) enforces:
frontend `tsc --noEmit` + frontend tests + frontend build; backend `tsc
--noEmit` + `prisma generate`/`db push` + backend tests + backend build,
with a Postgres 16 service.

- **Verify `.github/workflows/ci.yml` itself** is still coherent after the
  fixes (steps, working-directories, env vars, Postgres service) — CI is part
  of the deliverable, not just a local convenience.
- Run and pass locally:
  - Frontend: `npx tsc --noEmit`, `npm run test`, `npm run build`.
  - Backend: `npx tsc --noEmit`, `npm run test`, `npm run build`
    (working directory `backend/`; tests use a mocked Prisma client, so no
    database is needed locally).
- Test counts must remain ≥ the Task-6 baseline; add tests for the new
  invariants in Tasks F, G, H, and J.

## Output requirements

- Summarize each task as: **found → changed → verified**, with file paths and
  test counts before/after.
- **Do not print the redacted credential value** anywhere in your summary.
- List any residual risks you chose not to fix (e.g. idempotency redesign,
  history rewrite, password rotation) with the reason each is deferred.
- End with the exact commands you ran and their results.
