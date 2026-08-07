# Alka Traders — Marine & Industrial Equipment E-Commerce

> Leading supplier & exporter of used/unbranded marine and industrial equipment. Built with React 19, Vite 8, TypeScript 6, Prisma, Express, and PostgreSQL.

## 🏗️ Architecture

```
┌─────────────────────┐     /api/*      ┌─────────────────────┐
│  Netlify (SPA)      │ ──────────────► │  Render (Backend)   │
│  React 19 + Vite 8  │                 │  Express + Prisma   │
│  Tailwind CSS       │                 │  Node.js 20         │
└─────────────────────┘                 └──────────┬──────────┘
                                                   │
                                        ┌──────────▼──────────┐
                                        │     NeonDB           │
                                        │  PostgreSQL (cloud)  │
                                        └─────────────────────┘
```

## ✨ Features

### Storefront
- **Product Catalog** — 255+ products with advanced search, filters (category, brand, condition, price, availability), and sorting
- **Product Details** — Image gallery with zoom, specifications, related products, make-offer flow
- **Cart & Checkout** — Full cart with PayPal integration, bank transfer, and card payment options
- **RFQ System** — Multi-step request-for-quote form with urgency levels (standard/urgent/emergency)
- **Make an Offer** — Customers can negotiate prices on any product
- **Brands & Industries** — Dedicated pages with marquee showcases and filterable grids
- **Emergency Procurement** — 24/7 emergency parts sourcing with WhatsApp integration
- **Multi-language** — English, Arabic (RTL), Spanish support via i18next
- **SEO** — react-helmet-async with meta tags, OG images, canonical URLs
- **Responsive Design** — Mobile-first, works from 280px to 4K ultra-wide
- **Cookie Consent** — GDPR-ready cookie consent banner

### Admin Panel
- **Dashboard** — Real-time stats, alerts, quick actions
- **Products** — Full CRUD, CSV import/export, product duplication, image upload with drag-and-drop
- **Media Library** — Upload, grid/list view, search, filter, bulk delete
- **Orders** — Status management, tracking, cancellation, invoice PDF
- **RFQs** — Assign, status updates, internal notes, customer responses
- **Offers** — Accept/reject/counter, convert to order
- **Customers** — CRUD, status management, order history
- **Messages** — Inbox, folders, send, archive
- **Brands, Categories, Industries** — Full CRUD with reorder
- **Homepage Content** — Section editor for hero, featured products, testimonials
- **Settings** — Site, shipping, payments, notifications configuration
- **Users & Roles** — Owner, admin, editor, viewer with permission-based access
- **Audit Log** — Track all admin actions with actor, entity, and timestamp
- **Insights** — 30+ dashboard widgets (revenue, inventory, customer analytics)

### Backend API
- **Authentication** — JWT + httpOnly refresh cookies + CSRF double-submit
- **Rate Limiting** — Per-endpoint rate limits with Redis-ready architecture
- **Email System** — 14 email templates via Resend with queue processor
- **PayPal Integration** — Webhooks, order creation, capture
- **File Upload** — Multer + Sharp for image processing
- **Audit Logging** — All admin actions logged with actor, entity, values
- **Sentry** — Error tracking with session replay and data scrubbing

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (or NeonDB)
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/alishasaiyed1996-dev/alka-traders.git
cd alka-traders
npm install
cd backend && npm install
```

### 2. Configure Environment

```bash
# Frontend
cp .env.example .env

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL, JWT secret, API keys
```

### 3. Setup Database

```bash
cd backend
npx prisma generate
npx prisma db push
ADMIN_PASSWORD=your-password npx tsx prisma/seed.ts
```

### 4. Run Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Visit http://localhost:5173

### Default Admin Credentials
- **Email:** sales@alkatraders.co
- **Password:** *(set during seed via ADMIN_PASSWORD env var)*

## 📁 Project Structure

```
alka-traders/
├── src/                          # Frontend (React + Vite)
│   ├── components/               # Reusable UI components
│   │   ├── admin/                # Admin panel components
│   │   ├── auth/                 # Auth modal
│   │   ├── cart/                 # Cart drawer
│   │   ├── layout/               # Navbar, Footer
│   │   ├── sections/             # Homepage sections
│   │   ├── seo/                  # SEO component
│   │   └── ui/                   # OptimizedImage, ProductCard, etc.
│   ├── data/                     # Static data (products, brands, etc.)
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # API client, utils
│   ├── pages/                    # Page components
│   │   └── admin/                # 17 admin pages
│   ├── test/                     # Unit tests
│   ├── types/                    # TypeScript types
│   ├── i18n/                     # Translations (en/ar/es)
│   ├── index.css                 # Global styles
│   └── App.tsx                   # Router + lazy loading
├── backend/                      # Backend (Express + Prisma)
│   ├── prisma/                   # Schema + seed
│   ├── src/
│   │   ├── routes/               # API routes
│   │   │   ├── admin/            # 12 admin route files
│   │   │   ├── storefront/       # 8 storefront route files
│   │   │   └── webhooks/         # PayPal webhooks
│   │   ├── middleware/            # Auth, CSRF, rate limit
│   │   ├── services/             # Email service
│   │   └── utils/                # Helpers, audit, storage
│   └── package.json
├── e2e/                          # Playwright E2E tests
├── netlify.toml                  # Netlify config
├── render.yaml                   # Render Blueprint
├── DEPLOYMENT.md                 # Step-by-step deployment guide
└── package.json
```

## 🧪 Testing

```bash
# Unit tests (189 tests)
npm run test

# E2E tests (Playwright)
npx playwright test

# Build check
npm run build

# Backend tests
cd backend && npm test
```

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step instructions.

### Quick Deploy
1. **Backend:** Create a Render web service from the GitHub repo
2. **Frontend:** Connect the repo to Netlify
3. **Database:** NeonDB (already configured)
4. **Set env vars** on both platforms per DEPLOYMENT.md

## 🔒 Security

- JWT tokens stored in memory (not localStorage)
- httpOnly refresh cookies
- CSRF double-submit token pattern
- CSP, HSTS, X-Frame-Options headers
- Rate limiting on auth endpoints
- Input sanitization with XSS protection
- Sentry data scrubbing for sensitive headers
- No `dangerouslySetInnerHTML` or `eval()` usage

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TypeScript 6, Tailwind CSS |
| State | Zustand |
| Routing | React Router v7 |
| Animation | Framer Motion, GSAP |
| 3D | Three.js + React Three Fiber |
| i18n | i18next + react-i18next |
| Backend | Express 4, TypeScript, Prisma ORM |
| Database | PostgreSQL (NeonDB) |
| Auth | JWT + httpOnly cookies + CSRF |
| Email | Resend |
| Payments | PayPal |
| Monitoring | Sentry |
| Hosting | Netlify (frontend) + Render (backend) |
| Testing | Vitest, Testing Library, Playwright |

## 📄 License

Private — Alka Traders © 2026
