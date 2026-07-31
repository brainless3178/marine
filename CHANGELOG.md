# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] — WCAG AA Accessibility Overhaul

### Summary

Full codebase contrast audit across 7 batches, fixing ~120+ WCAG AA failures in both light and dark mode. Final audit: **25/25 active checks pass**, 3 false positives excluded (decorative border, focus ring non-text threshold, resolved token pair).

### Token Fixes (`src/index.css`)

| Token | Before | After | Purpose |
|-------|--------|-------|---------|
| `--accent-primary` (light) | `#1a73e8` | `#1a6eda` | 4.28:1 → 4.65:1 on `--primary-bg` |
| `--text-muted` (light) | `#64748b` | `#5b6b80` | 4.31:1 → 4.93:1 on `--surface-soft` (fixed 45+ component instances) |
| `--input-border` (light) | `#cbd5e1` | `#7d8e9f` | 1.36:1 → 3.05:1 on `--primary-bg` (at WCAG 3:1 ceiling) |
| `--input-placeholder` (light) | `#64748b` | `#5f6c80` | 4.34:1 → 4.52:1 on `--input-bg` |

### Dark Mode Button Text Fix

**Problem:** 24+ components used `text-white` on `bg-[var(--accent-primary)]`, which fails in dark mode (white on `#5ea3f8` = 2.60:1).

**Fix:** Replaced `text-white` with `text-[var(--btn-blue-text)]` across all accent-primary buttons:
- Light mode: `--btn-blue-text` = `#ffffff` (4.65:1 on `#1a6eda`) ✅
- Dark mode: `--btn-blue-text` = `#0f1419` (6.41:1 on `#5ea3f8`) ✅

**Files changed:** `Button.tsx`, `ProductCard.tsx`, `Brands.tsx`, `Checkout.tsx`, `Contact.tsx`, `ForgotPassword.tsx`, `Home.tsx`, `NotFound.tsx`, `ProductDetail.tsx`, `RFQ.tsx`, `ResetPassword.tsx`, `Shop.tsx`, `TrackOrder.tsx`, `IndustriesTabs.tsx`

**hover:text-white fix:** 4 outline buttons (`Shop.tsx`, `Home.tsx`, `ProductDetail.tsx`, `IndustriesTabs.tsx`) also had `hover:text-white` which flashed white on hover in dark mode. Changed to `hover:text-[var(--btn-blue-text)]`.

### Focus Ring Consolidation

Replaced per-component `shadow-[...]` focus rings with a single global CSS rule:

```css
:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
input:focus-visible, textarea:focus-visible, select:focus-visible {
  outline: 2px solid var(--accent-primary); outline-offset: 2px; border-color: var(--accent-primary);
}
```

**Components updated:** `LoginForm.tsx`, `RegisterForm.tsx`, `SearchInput.tsx`, `ProductFilters.tsx`, `CheckoutShipping.tsx`, `CheckoutSuccess.tsx`

### Component-Level Fixes

| Batch | Component | Fix | Before → After |
|-------|-----------|-----|----------------|
| 3 | `LoginForm.tsx`, `RegisterForm.tsx` | Input icon contrast | `text-muted` → `text-secondary` |
| 3 | `SearchInput.tsx`, `SearchResultItem.tsx` | Search icon contrast | `text-muted` → `text-secondary` |
| 4 | `Navbar.tsx` | Cart count + RFQ CTA | `text-white` → `text-[var(--btn-blue-text)]` |
| 4 | `Home.tsx` | Navy section label | `accent-primary` → `white` |
| 5 | `Hero.tsx` | CTA orange darkened | `#ff6b00` → `#c45200` (4.61:1) |
| 5 | `Testimonials.tsx` | Avatar initial | `accent-primary` → `accent-primary-hover` (6.23:1) |
| 5 | `CategoriesGrid.tsx` | Blue badge | `accent-primary` → `accent-primary-hover` + bg opacity 10% |
| 5 | `CategoriesGrid.tsx` | Gold badge | `accent-gold` → `text-secondary` (9.60:1) |
| 6 | `IndustriesTabs.tsx` | Active tab button | `text-white` → `text-[var(--btn-blue-text)]` |
| 7 | `admin.css` | Badge light-mode backgrounds | Recalibrated for 4.5:1 minimum |

### Dead Token Cleanup

Removed unused CSS variables from all 3 theme blocks:
- `--focus-ring-blue` (defined but never referenced by any component)
- `--hero-pseudo-teal` (defined but never referenced)

### WCAG Compliance Comments

Added documentation comments on critical tokens:
- `--input-border`: Notes 3:1 ceiling (`#7d8e9f` on `#f1f5f9` = 3.07:1)
- `--btn-blue-text`: Notes pairing dependency with `--accent-primary` in both modes

### Audit Methodology

- **Thresholds:** WCAG AA — 4.5:1 normal text, 3:1 large text (≥18pt / ≥14pt bold), 3:1 non-text/UI components
- **Scope:** All `.tsx` files in `src/`, all CSS files, token definitions in `index.css`
- **Batches:** 7 sequential batches (global tokens → auth/forms → search → landing sections → navigation/footer → admin panel → final sweep)
- **Verification:** Automated contrast ratio computation, manual code review, build validation

### Hero CTA Token Promotion

Promoted hardcoded Hero CTA orange values to CSS variables for reusability:
- `--hero-cta-orange: #c45200` (4.61:1 white on orange)
- `--hero-cta-orange-hover: #a84400`
- `--hero-cta-orange-shadow: rgba(196, 82, 0, 0.28)`

**Files changed:** `src/index.css` (token definitions), `src/components/sections/Hero.tsx` (usage)

### Stats

| Metric | Value |
|--------|-------|
| Files changed | 129 |
| Token fixes | 7 |
| Component fixes | 30+ |
| Dead tokens removed | 2 |
| WCAG AA checks | 25/25 pass |
| Build status | ✅ Clean |
