# Alka Traders — Mobile Responsiveness & Image Performance Audit

> **Date:** June 14, 2026  
> **Stack:** React + Vite + Tailwind CSS + GSAP + Framer Motion  
> **Target:** 99% mobile users, all major mobile browsers  

---

## 1. IMAGE LOADING — Current State & Issues

### 1.1 How Images Are Loaded

| Aspect | Current State | Issue? |
|--------|--------------|--------|
| **Image format** | All `.jpeg` originals served as-is | ❌ No WebP/AVIF conversion — jpeg files are large |
| **Image path** | `/images/{filename}` served from Vite's `public/` folder | ❌ No CDN, no optimization pipeline |
| **Lazy loading** | Only 3 files use `loading="lazy"`: `Products.tsx`, `FeaturedProducts.tsx`, `HeroProductMarquee.tsx` | ❌ Most images load eagerly including below-fold |
| **Image sizing** | No `width`/`height` attributes on most `<img>` tags | ❌ Causes layout shift (CLS) |
| **Responsive images** | No `srcset` or `<picture>` elements | ❌ Same large image served on all screen sizes |
| **Alt text** | Present on most images | ✅ Good |
| **Error handling** | `onError` fallback hides image or shows placeholder | ✅ Present |
| **Netlify config** | Basic `netlify.toml` — no image headers, no caching rules, no compression config | ❌ Missing performance headers |

### 1.2 Files Loading Images

| File | Image Count | Lazy? | Notes |
|------|------------|-------|-------|
| `Hero.tsx` | 1 (rotating product) | ❌ No | Above-fold hero — acceptable |
| `FeaturedProducts.tsx` | 8 product cards | ✅ Yes | Good |
| `Products.tsx` | N products | ✅ Yes | Good |
| `ProductDetail.tsx` | 5 thumbnails + 1 main | ❌ No | 5 thumbs load eagerly |
| `HeroProductMarquee.tsx` | N marquee items | ✅ Yes | Good |
| `BrandsMarquee.tsx` | 0 (text only) | N/A | — |
| `Navbar.tsx` | 1 (logo) | ❌ No | Always visible — acceptable |
| `Footer.tsx` | 1 (logo) | ❌ No | Always visible — acceptable |
| `CartDrawer.tsx` | 1 per cart item | ❌ No | In drawer — acceptable |
| `Checkout.tsx` | 1 per order item | ❌ No | Post-purchase — acceptable |

### 1.3 What's Missing for Image Performance

- [ ] No `<picture>` with WebP/AVIF sources
- [ ] No `width`/`height` on `<img>` tags (CLS issue)
- [ ] No image CDN (Cloudinary, imgix, Cloudflare Images)
- [ ] No Netlify Headers config for caching
- [ ] No `decoding="async"` on lazy images
- [ ] No placeholder/blur-up technique while loading
- [ ] No responsive `srcset` for different viewports
- [ ] Logo images in Navbar/Footer not optimized

---

## 2. VIEWPORT & META CONFIGURATION

| File | Setting | Current |
|------|---------|---------|
| `index.html` | `<meta name="viewport">` | `width=device-width, initial-scale=1.0` ✅ |
| `index.html` | `theme-color` | ❌ Missing — no browser chrome theming |
| `index.html` | `apple-mobile-web-app-capable` | ❌ Missing — no PWA hints |
| `index.html` | `description` meta | ❌ Missing — no SEO description |
| `index.html` | Preconnect to Google Fonts | ❌ Missing — fonts load late |

---

## 3. TAILWIND BREAKPOINTS IN USE

The app uses Tailwind's default breakpoints:

| Prefix | Min-Width | Label | Usage |
|--------|-----------|-------|-------|
| (none) | 0px | Mobile-first default | All base styles |
| `sm:` | 640px | Small tablets | Product grids, trust signals |
| `md:` | 768px | Tablets | 2-col layouts, side-by-side content |
| `lg:` | 1024px | Small desktops | 3-4 col grids, sidebar layouts |
| `xl:` | 1280px | Large desktops | 4-col product grids |

---

## 4. COMPONENT-BY-COMPONENT MOBILE AUDIT

### 4.1 NAVBAR (`Navbar.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile (<lg) | Hamburger menu → full-width dropdown overlay |
| Desktop (≥lg) | Horizontal nav links + "Request Quote" CTA |
| WhatsApp/Phone icons | Hidden on `<sm`, visible `sm+` |
| Brand text | Always visible, fixed `text-[28px]` — may be too large on very small screens (<360px) |
| Mobile menu | Links + WhatsApp/Call grid (2-col) + RFQ CTA |
| Scroll behavior | Sticky with `backdrop-blur-xl`, shadow on scroll |

**Potential mobile issues:**
- Brand text `text-[28px]` is hardcoded — no responsive scaling
- No swipe-to-close on mobile menu
- Cart badge uses `min-w-[18px]` — could clip on very long numbers

### 4.2 HERO (`Hero.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Single column: copy → CTA → trust signals → product showcase |
| Desktop (≥lg) | 2-column: left copy + right glass card product showcase |
| Headline | `clamp(48px, 7.5vw, 92px)` — scales down to 48px on mobile |
| Trust signals | `grid sm:grid-cols-3` → 1-col on mobile, 3-col on sm+ |
| Product marquee | Two rows, always horizontal scroll |
| Ambient glow effects | `w-[600px]` and `w-[500px]` absolute blobs — may cause paint issues on low-end mobile |
| Animations | GSAP scroll reveal with delays — 5 staggered elements |
| CTA buttons | `flex-wrap` — stacks on narrow screens ✅ |

**Potential mobile issues:**
- Large `blur-[120px]` and `blur-[100px]` elements are expensive on mobile GPU
- `min-h-[calc(100svh-76px)]` uses `svh` — good for iOS Safari ✅
- Word cycling animation every 3s — could be distracting on mobile

### 4.3 STATS BAR (`StatsBar.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Stats stack/wrap (`flex-wrap`), dividers hidden |
| Desktop | 4 stats in a row with vertical dividers |
| Padding | `p-5 md:p-7` |

**Potential mobile issues:**
- `StatCounter` has `min-w-[200px]` — on a 320px screen with padding, only 1 stat fits per row
- Numbers use `clamp(38px, 5vw, 68px)` — scales down fine

### 4.4 CATEGORIES GRID (`CategoriesGrid.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | 1-column cards |
| Tablet (≥md) | 2-column |
| Desktop (≥lg) | 3-column |
| Card content | Tilt effect (Framer Motion) — may lag on low-end mobile |

**Potential mobile issues:**
- TiltCard uses `useMotionValue` + `useTransform` — potential performance hit on mobile
- `perspective: 1200px` on parent — GPU-intensive

### 4.5 HOW IT WORKS (`HowItWorks.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Steps stack vertically, timeline line hidden |
| Desktop (≥lg) | Horizontal timeline with dots, line animates on scroll |
| Step dots | `w-14 h-14` fixed size — fine on mobile |
| GSAP | Timeline line + dot stagger animations |

**Potential mobile issues:**
- Timeline line is `hidden lg:block` — no mobile equivalent
- Steps stack but lose the visual timeline connection

### 4.6 INDUSTRIES TABS (`IndustriesTabs.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Horizontal scrollable tab bar (`overflow-x-auto flex-nowrap`) |
| Desktop (≥md) | Wrapped tabs, flex-wrap |
| Content panel | Icon hidden on mobile (`hidden md:flex`) |

**Potential mobile issues:**
- Horizontal scroll tabs with no scroll indicator
- `-mx-6 px-6` edge-to-edge scroll — good pattern ✅

### 4.7 FEATURED PRODUCTS (`FeaturedProducts.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | 2-column product grid |
| Tablet (≥md) | 3-column |
| Desktop (≥lg) | 4-column |
| Cards | Maritime card with hover lift effect |

**Potential mobile issues:**
- Product names in `<h4>` with `min-h-[40px]` — fixed height could clip long names
- Price uses `text-2xl` — hardcoded, no responsive scaling

### 4.8 BRANDS MARQUEE (`BrandsMarquee.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| All sizes | Infinite horizontal marquee, always scrolling |
| Speed | 25s-30s per loop |

**Potential mobile issues:**
- Continuous animation on mobile — battery drain
- No `prefers-reduced-motion` respect

### 4.9 RFQ SECTION (`RFQSection.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Stacked: copy → form |
| Desktop (≥lg) | 2-column: 42% copy + 58% form |
| Form inputs | Full-width, proper padding |
| Spotlight effect | `radial-gradient` follows mouse — not applicable on touch |

**Potential mobile issues:**
- Mouse-tracking spotlight effect is useless on touch devices
- Form padding `p-7 md:p-9` — fine

### 4.10 TESTIMONIALS (`Testimonials.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | 1-column cards |
| Tablet (≥md) | 2-column |
| Desktop (≥lg) | 3-column |

**Potential mobile issues:**
- None significant — clean stacking

### 4.11 FOOTER (`Footer.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | 1-column stack |
| Tablet (≥md) | 2-column |
| Desktop (≥lg) | 4-column with custom widths |

**Potential mobile issues:**
- `pt-16 pb-0` — bottom padding is 0, content may feel cramped
- Footer links are small `text-sm` — touch targets may be too small (<44px)

### 4.12 PRODUCTS PAGE (`Products.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | 1-column filter sidebar (toggle button) |
| sm | 2-column product grid |
| md | 3-column |
| xl | 4-column |
| Sidebar | Hidden by default on mobile, toggled with "Show/Hide Filters" button |

**Potential mobile issues:**
- Filter toggle text is tiny `text-xs`
- Sort dropdown uses custom SVG arrow — may not style consistently

### 4.13 PRODUCT DETAIL (`ProductDetail.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Stacked: gallery → details |
| Desktop (≥lg) | 2-column: gallery (1.1fr) + details (1fr) |
| Thumbnails | Horizontal scroll on mobile (`overflow-x-auto`) |
| Main image | `h-[300px] sm:h-[400px]` |
| Spec grid | `grid-cols-[140px_1fr]` — fixed 140px label column |
| Action buttons | `grid-cols-1 sm:grid-cols-2` |
| Offer modal | `max-w-[420px]`, full-width on mobile |

**Potential mobile issues:**
- Spec grid `140px` label column — on 320px screens, only 180px for values
- Thumbnail row has no scroll indicator
- Image gallery "Hover to zoom" text is useless on mobile

### 4.14 RFQ PAGE (`RFQ.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Stacked form |
| Desktop (≥lg) | 2-column: form + FAQ sidebar |
| Progress steps | Hidden labels on mobile (`hidden sm:block`) |
| Urgency cards | `grid-cols-1 sm:grid-cols-3` |

**Potential mobile issues:**
- Progress step labels hidden on mobile — user can't see "Contact/Product/Urgency" names
- Form inputs use `py-3` — good touch target ✅

### 4.15 CHECKOUT (`Checkout.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Stacked checkout |
| Desktop (≥md) | 2-column: form + order summary |
| Payment buttons | Full-width |
| PayPal modal | `max-w-[460px]` |

**Potential mobile issues:**
- Step labels hidden on mobile (`hidden sm:block`)
- Cart item images `h-12 w-12` — tiny on mobile

### 4.16 EMERGENCY PAGE (`Emergency.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Stacked layout |
| Desktop (≥lg) | 2-column: clock + contacts |
| CTAs | `flex-wrap` — stacks properly |
| GSAP | Pulsing glow, spinning clock, scroll-triggered contacts |

**Potential mobile issues:**
- GSAP `scale: 1.02` pulse + spinning clock — expensive on mobile
- Form padding `p-6 sm:p-10` — fine

### 4.17 SEARCH / COMMAND (`CommandSearch.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| All sizes | Centered modal, `max-w-[600px]` |
| Results | `max-h-[400px] overflow-y-auto` |

**Potential mobile issues:**
- Results list touch targets are `py-3` — acceptable
- Keyboard shortcut hint `Ctrl+K` — not applicable on mobile

### 4.18 AUTH MODAL (`AuthModal.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| Mobile | Top-aligned, scrollable (`flex-start`) |
| Desktop (≥sm) | Centered |

**Potential mobile issues:**
- None — properly handles mobile with `items-start sm:items-center`

### 4.19 CART DRAWER (`CartDrawer.tsx`)

| Breakpoint | Behavior |
|-----------|----------|
| All sizes | Full-width slide-in from right, `max-w-[460px]` |
| Product images | `h-12 w-12` — small |

**Potential mobile issues:**
- Cart images are very small on mobile
- Swipe-to-close not implemented

---

## 5. GLOBAL CSS & RESPONSIVE PATTERNS

### 5.1 Base Responsive Utilities (`index.css`)

| Property | Value | Applied To |
|----------|-------|-----------|
| `scroll-behavior` | `smooth` | `html` |
| `-webkit-overflow-scrolling` | ❌ Not set | Needed for iOS smooth scroll |
| `overflow-x` | `clip` | `html`, `body` — prevents horizontal scroll ✅ |
| `::selection` | Gold tint | All text |

### 5.2 Scrollbar Styling

Custom scrollbar in `index.css`:
```css
::-webkit-scrollbar { width: 8px }
::-webkit-scrollbar-thumb { background: var(--border) }
```
⚠️ Not styled for mobile — iOS hides scrollbars by default (fine)

### 5.3 No `prefers-reduced-motion` Support

- GSAP animations run unconditionally
- Marquee animations run unconditionally  
- No media query to reduce/disable animations for users who prefer reduced motion

### 5.4 No Touch-Specific Optimizations

- No `touch-action` CSS properties
- No `user-select` management for product names
- No pull-to-refresh prevention
- No viewport zoom prevention (intentional — good for accessibility ✅)

---

## 6. ANIMATION & PERFORMANCE CONCERNS ON MOBILE

| Feature | File | Mobile Impact |
|---------|------|--------------|
| GSAP scroll reveals | Hero, HowItWorks, Emergency, About | Medium — multiple ScrollTrigger instances |
| Framer Motion tilt cards | CategoriesGrid | High — per-card motion values |
| CSS gradient text animation | Hero (6s infinite) | Low — GPU-composited |
| Marquee (2 marquees) | Hero, BrandsMarquee | Medium — continuous transform |
| Product word cycling | Hero (3s interval) | Low — DOM swap |
| Spotlight radial gradient | RFQSection | Low on mobile (no mouse) |
| Backdrop blur | Hero glass card, modals | High — expensive on mobile GPU |
| Shimmer button effect | maritime-btn-primary | Low — pseudo-element |

---

## 7. MISSING MOBILE BEST PRACTICES

### 7.1 Touch Targets

- Some buttons/links are `text-xs` with no minimum height — may be <44px touch target
- Footer links: `text-sm` with `gap-2.5` — may be too tight
- Filter labels in Products page: `py-2 text-xs` — small

### 7.2 Safe Areas (iOS)

- No `env(safe-area-inset-*)` usage
- Navbar is `sticky top-0` — may overlap with iOS status bar
- No `viewport-fit=cover` in meta tag

### 7.3 Font Sizing

- Body: `font-size: 16px` — good, respects user preferences ✅
- Many elements use `text-xs` (12px), `text-[11px]`, `text-[10px]`, `text-[9px]` — very small on mobile
- Price text uses `text-2xl` (24px) — hardcoded, no responsive scaling

### 7.4 Layout

- Max widths: `max-w-[1280px]`, `max-w-[1320px]`, `max-w-[1320px]` — inconsistent values
- Padding: Mix of `px-6` (24px) and `px-4` (16px) — inconsistent edge padding
- Gaps: Mix of `gap-5`, `gap-6`, `gap-7`, `gap-8`, `gap-10`, `gap-12` — no clear system

---

## 8. NETLIFY CONFIGURATION — Current vs Needed

### Current (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### What's Missing

- No `[[headers]]` for cache control on images
- No `[[headers]]` for security headers
- No `_headers` file for granular path-based caching
- No image optimization headers (Content-Type, Cache-Control)
- No preconnect/preload hints
- No compression config (Netlify does this automatically, but explicit is better)

---

## 9. SUMMARY — PRIORITIES FOR MOBILE FIX

### P0 — Critical (Blocks Good UX on Mobile)

1. **Image performance** — No lazy loading on most images, no WebP, no responsive srcset
2. **Touch targets** — Many interactive elements below 44px minimum
3. **Font sizes** — Extensive use of 9-11px text unreadable on small phones
4. **No `prefers-reduced-motion`** — Animations can't be disabled
5. **Backdrop blur** — Expensive on mobile GPU, causes jank

### P1 — High (Degrades Mobile Experience)

6. **Safe area insets** — iOS notch/home indicator not respected
7. **Navbar brand text** — Fixed 28px, no responsive scaling
8. **Spec grid on ProductDetail** — 140px fixed label column too wide on mobile
9. **Marquee animations** — Continuous scroll drains battery
10. **Missing `<meta>` tags** — No theme-color, no description, no preconnect

### P2 — Medium (Polish)

11. **Inconsistent max-widths** — 1280px vs 1320px
12. **Inconsistent padding** — px-4 vs px-6 mix
13. **Footer bottom padding** — pb-0 feels cramped
14. **Cart drawer images** — 48px thumbnails too small
15. **No pull-to-refresh prevention**
