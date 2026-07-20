# Alka Traders — Complete Backend Architecture

> **Date:** June 23, 2026
> **Purpose:** Single-source-of-truth document for building the complete backend. After this, no additional planning is needed.
> **Frontend Stack:** React 19 + Vite + TypeScript + Tailwind CSS + Zustand + React Router + i18next + GSAP + Three.js
> **Total Products:** 255 hardcoded | **Admin Pages:** 16 | **Storefront Pages:** 14 | **Hooks:** 6 | **Components:** ~30

---

## TABLE OF CONTENTS

1. [Executive Summary — Why This Backend Exists](#1-executive-summary)
2. [Current State — Every Single Broken Thing](#2-current-state)
3. [Tech Stack Recommendation](#3-tech-stack)
4. [Database Schema — Every Table, Every Column](#4-database-schema)
5. [API Endpoints — Every Route, Every Request/Response](#5-api-endpoints)
6. [Authentication & Authorization](#6-auth)
7. [File Upload & Image Management](#7-file-upload)
8. [Search & Filtering](#8-search)
9. [Email & Notification System](#9-email)
10. [Payment Processing](#10-payments)
11. [Storefront Workflows — End to End](#11-storefront-workflows)
12. [Admin Workflows — End to End](#12-admin-workflows)
13. [Data Migration — From Static to Real](#13-data-migration)
14. [Security Requirements](#14-security)
15. [Performance Requirements](#15-performance)
16. [Deployment & DevOps](#16-deployment)
17. [Testing Strategy](#17-testing)
18. [Implementation Phases — Ordered Task List](#18-implementation-phases)
19. [Edge Cases & Gotchas](#19-edge-cases)

---

## 1. EXECUTIVE SUMMARY <a name="1-executive-summary"></a>

The frontend is a well-structured UI prototype with 255 hardcoded products, simulated auth, localStorage cart, fake checkout, fake RFQ, fake offers, fake contact messages, and a 16-page admin panel that operates on mock data that resets on every page load. **Every single data operation in the app is a lie.**

The backend must:

1. Store and serve real product data (255+ products with images, specs, pricing, inventory)
2. Handle real user authentication (customer accounts + admin roles)
3. Process real orders with payment integration
4. Capture and manage RFQ submissions with urgency SLAs
5. Capture and manage make-offer requests
6. Handle contact form submissions and emergency requests
7. Manage media library (product images, brand logos, documents)
8. Support a full admin panel with 15 sections of real CRUD operations
9. Provide full-text search with filtering, sorting, and pagination
10. Send transactional emails (order confirmations, RFQ responses, status updates)
11. Support multilingual content (EN/AR/ES) for product names, descriptions, and SEO
12. Maintain an audit log of all admin actions
13. Support role-based access control with 6 permission levels

---

## 2. CURRENT STATE — EVERY SINGLE BROKEN THING <a name="2-current-state"></a>

### 2.1 Products (src/data/products.ts)
- **255 products hardcoded** in a TypeScript array
- `enrichProduct()` generates **deterministic but fake** prices, conditions, descriptions, sale flags, stock counts from product ID character codes
- All product `specs: {}` are empty objects — `getProductSpecs()` in ProductDetail.tsx generates fake specs from character codes
- Products 134–255 reference images that **do not exist** (`product-134.jpg` through `product-255.jpg`)
- `filename` field exists on data but is **not in the Product TypeScript interface** — type-safety gap
- Brand names are **strings not foreign keys** — can't join to brands table
- Category is a string slug — no FK to categories table
- Industry is `string[]` — no join table

### 2.2 Auth (src/store/useStore.ts)
- **Customer auth:** Stores `{name, email}` in Zustand + localStorage with zero validation. Any name/email works.
- **Admin auth:** `adminLogin()` accepts ANY email+password, defaults to owner role. Demo accounts hardcoded.
- No password hashing, no JWT tokens, no sessions, no password reset
- `isLoggedIn` and `user` persist to localStorage but are never verified server-side

### 2.3 Cart (src/store/useStore.ts)
- Cart persists to localStorage via Zustand `saveState/loadState` with `alka-cart` key
- `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart` modify React state + localStorage
- No server-side cart, no cart API, no cart abandonment tracking
- Cart total/count computed client-side via `computeCartTotals()`

### 2.4 Checkout (src/pages/Checkout.tsx)
- **Step 1 (Shipping):** Collects fullName, addressLine1, addressLine2, city, state, postalCode, country. Validates required fields client-side only.
- **Step 2 (Payment):** Card number, expiry, CVV collected in **plaintext React state**. No encryption, no PCI compliance. PayPal is a full UI clone that accepts any input and shows "processing" for 2.2s. Bank transfer shows static instructions.
- **Step 3 (Review):** Shows order summary. "Place Order" calls `generateOrderId()` which creates `MS7-ORD-XXXXX` (random 5-digit). Then `clearCart()` wipes everything. No order saved anywhere.
- **Post-order:** Shows confirmation with order ID. Cancel request flow shows "Cancellation Request Submitted" but does nothing. "Track Order" button navigates to `/products` — no tracking page.
- **Hardcoded values:** Shipping cost is always $25, tax is always 8%, free shipping threshold not implemented.

### 2.5 RFQ (src/pages/RFQ.tsx)
- 3-step form collects: fullName, company, email, phone, country, role, productDesc, partNumber, brand, quantity, deliveryLocation, urgency, notes, source, consent
- On submit: generates random `AT-XXXXX` ID, shows success, **discards all data**
- No email forwarding, no backend storage, no admin notification
- Form data is local component state only — not in Zustand

### 2.6 Make Offer (src/pages/ProductDetail.tsx)
- Modal collects offerPrice and offerEmail
- On submit: shows "Offer Submitted" for 2 seconds, then **deletes everything**
- No offer record created, no admin notification, no email sent

### 2.7 Contact Form (src/pages/Contact.tsx)
- Collects name, email, subject, message
- Shows "Message Sent!" for 3 seconds, then **discards input**
- No backend submission, no email forwarding

### 2.8 Emergency Form (src/pages/Emergency.tsx)
- Collects name, phone, partDesc, vesselName
- Shows "Request Submitted!" for 3 seconds, then **discards input**
- Should create an emergency-priority RFQ

### 2.9 Search (src/pages/Search.tsx)
- Client-side only: filters hardcoded products array by name/SKU/brand
- No full-text search, no fuzzy matching, no search analytics
- Pages search is hardcoded array of 10 page objects

### 2.10 Admin Panel — Every UI-Only Feature

| Page | What It Does | What's Missing |
|------|-------------|----------------|
| AdminDashboard | Shows hardcoded stats, hardcoded "Recent Activity" text | Real stats from DB, real activity log |
| AdminProducts | Operates on static products array via React state. Bulk actions, delete, edit — all lost on refresh | Real CRUD API, persistence |
| AdminProductForm | Shows form, "Save" navigates back with no data saved | Real create/update API, image upload |
| AdminOrders | 24 mock orders from seeded PRNG. Status advance only goes forward. Invoice/tracking buttons show toasts only | Real orders from checkout, real invoice PDF, real tracking |
| AdminRFQs | 16 mock RFQs from Math.random(). Assign, status advance — all mock | Real RFQ data from form submissions |
| AdminOffers | 14 mock offers. Accept/reject — only modify React state | Real offers from make-offer flow |
| AdminCustomers | 24 mock customers. "Send Email" and "New Order" show toasts only | Real customer accounts, order history |
| AdminMessages | 18 mock messages. Compose/send — toast only | Real contact form submissions, internal messaging |
| AdminSettings | Saves to localStorage. Storefront doesn't read from it | Real settings API, storefront reads from DB |
| AdminHomepage | Saves section config to localStorage. Homepage reads from hardcoded components | Real content API, storefront reads from DB |
| AdminCategories | 21 hardcoded categories. CRUD operates on React state only | Real category CRUD API |
| AdminBrands | 12 hardcoded brands. CRUD operates on React state only | Real brand CRUD API, logo upload |
| AdminIndustries | 8 hardcoded industries. CRUD operates on React state only | Real industry CRUD API |
| AdminMedia | Upload input shows toast, delete shows toast — nothing stored | Real file upload/storage, media library API |
| AdminUsers | 6 hardcoded users. Create/edit — state only | Real user management API, role-based auth |

### 2.11 Data Files That Need Backend Equivalents

| File | Contents | Backend Table |
|------|----------|--------------|
| `src/data/products.ts` | 255 products with enrichProduct() | `products`, `product_images`, `product_specs`, `product_industries` |
| `src/data/brands.ts` | 12 brands + marquee items | `brands` |
| `src/data/industries.ts` | 8 industries | `industries` |
| `src/data/testimonials.ts` | 5 testimonials, 5 offices, timeline, team, FAQs | `testimonials`, `offices`, `settings` |
| `src/data/countries.ts` | ~200 countries | Static or `countries` table |
| `src/data/brandImages.ts` | Brand image filenames | Part of `brands.logo` |

### 2.12 localStorage Keys Used

| Key | Used By | Purpose |
|-----|---------|---------|
| `alka-cart` | useStore | Cart items |
| `alka-auth` | useStore | isLoggedIn boolean |
| `alka-user` | useStore | User object {name, email} |
| `ms7-admin-site` | AdminSettings | Site config |
| `ms7-admin-shipping` | AdminSettings | Shipping zones |
| `ms7-admin-payments` | AdminSettings | Payment methods |
| `ms7-admin-notifications` | AdminSettings | Notification prefs |
| `ms7-admin-homepage` | AdminHomepage | Homepage sections |

All of these must be replaced with database-backed API calls.

### 2.13 Hardcoded Values That Must Become Configurable

- WhatsApp number: `919726900547` (hardcoded in 6+ files)
- Email: `rfq@alkatraders.com`, `emergency@alkatraders.com`, `info@alkatraders.com`
- Phone: `+91 97269 00547`
- Shipping cost: `$25` (Checkout.tsx line: `const shippingCost = 25`)
- Tax rate: `8%` (Checkout.tsx line: `const tax = Math.round(subtotal * 0.08 * 100) / 100`)
- Price filter max: `$1000` (Products.tsx: `Math.min(1000, ...)`)
- Page size: `24` (Products.tsx), `20` (AdminProducts), `15` (AdminOrders/AdminCustomers), `12` (AdminRFQs/AdminOffers/AdminMessages)
- Order ID prefix: `MS7-ORD-`
- RFQ ID prefix: `AT-`
- Brand filter: hardcoded 12 slugs in Products.tsx

---

## 3. TECH STACK RECOMMENDATION <a name="3-tech-stack"></a>

### Recommended: Node.js + Express + PostgreSQL + Supabase

**Why this stack:**
- Mimo 2.5 is expert in Node.js/Express backend development
- PostgreSQL handles complex product catalog, full-text search, JSON specs, and relational data
- Supabase provides auth, storage, and real-time subscriptions out of the box
- Express gives full control over API design and middleware
- TypeScript throughout (matching frontend)

### Stack Components

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20 LTS | Server runtime |
| **Framework** | Express.js 4.x | HTTP server, routing, middleware |
| **Language** | TypeScript 5.x | Type safety, shared types with frontend |
| **Database** | PostgreSQL 16 | Primary data store |
| **ORM** | Prisma 5.x | Type-safe database access, migrations |
| **Auth** | Supabase Auth OR custom JWT | User authentication, sessions |
| **File Storage** | Supabase Storage OR AWS S3 | Product images, documents |
| **Email** | Resend OR SendGrid | Transactional emails |
| **Payments** | Stripe | Card payments, webhooks |
| **Search** | PostgreSQL full-text search (ts_vector/ts_query) | Product search |
| **Cache** | Redis (optional) | Session cache, rate limiting |
| **Validation** | Zod | Request validation |
| **Testing** | Vitest + Supertest | Unit + integration tests |
| **Documentation** | Swagger/OpenAPI | API docs |

### Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/marine_shop_seven
DIRECT_URL=postgresql://user:pass@host:5432/marine_shop_seven

# Auth
JWT_SECRET=<random-64-char-hex>
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Supabase (if using)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# File Storage
STORAGE_BUCKET=product-images
STORAGE_ENDPOINT=https://xxx.supabase.co/storage/v1
STORAGE_ACCESS_KEY=xxx
STORAGE_SECRET_KEY=xxx

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@alkatraders.com
RFQ_EMAIL=rfq@alkatraders.com
EMERGENCY_EMAIL=emergency@alkatraders.com
ADMIN_EMAIL=admin@alkatraders.com

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://alkatraders.com
ADMIN_URL=https://alkatraders.com/admin
CORS_ORIGIN=https://alkatraders.com

# Store Defaults
DEFAULT_CURRENCY=USD
DEFAULT_COUNTRY=AE
WHATSAPP_NUMBER=919726900547
COMPANY_PHONE=+9714XXXXXXX
COMPANY_EMAIL=info@alkatraders.com
```

---

## 4. DATABASE SCHEMA — EVERY TABLE, EVERY COLUMN <a name="4-database-schema"></a>

### 4.1 Admin Users

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner','store-manager','inventory-manager','sales-agent','content-manager','viewer')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Frontend references:**
- `AdminUser` interface in `useStore.ts` (line 8): `{name, email, role, avatar?}`
- Roles in `AdminUsers.tsx` (line 20): `'owner' | 'admin' | 'editor' | 'viewer'` — **MISMATCH**: frontend has 4 roles, requirements doc has 6. Backend should use the 6 from requirements.
- `adminLogin()` in `useStore.ts` (line 115): accepts email+password, returns boolean
- `AdminGuard.tsx` (line 9): checks `isAdminLoggedIn`

### 4.2 Customer Users

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  country VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  website VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active','inactive','vip','new')),
  tags TEXT[] DEFAULT '{}',
  internal_notes TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Frontend references:**
- `User` interface in `types/index.ts` (line 149): `{name, email}` — extremely minimal
- `Customer` interface in `AdminCustomers.tsx` (line 37): full shape with orders, stats, tags
- `login()` in `useStore.ts` (line 178): stores `{name, email}` in localStorage
- Checkout shipping form collects: fullName, addressLine1, addressLine2, city, state, postalCode, country

### 4.3 Products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft','published','hidden','archived')),
  availability VARCHAR(20) DEFAULT 'in-stock'
    CHECK (availability IN ('in-stock','sourced','emergency','out-of-stock')),
  condition VARCHAR(30) DEFAULT 'used'
    CHECK (condition IN ('new','unused','used','refurbished','reconditioned')),
  short_description TEXT,
  description TEXT,
  regular_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(12,2),
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,
  currency VARCHAR(3) DEFAULT 'USD',
  show_price BOOLEAN DEFAULT true,
  make_offer_enabled BOOLEAN DEFAULT false,
  minimum_offer_price DECIMAL(12,2),
  stock_count INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  warehouse_location VARCHAR(255),
  public_item_location VARCHAR(255),
  lead_time VARCHAR(100),
  is_new_arrival BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  custom_label VARCHAR(100),
  custom_label_color VARCHAR(20),
  sort_priority INTEGER DEFAULT 0,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  internal_notes TEXT,
  purchase_cost DECIMAL(12,2),
  supplier_reference VARCHAR(255),
  product_type VARCHAR(30) DEFAULT 'physical'
    CHECK (product_type IN ('physical','sourced-on-request','spare-part','surplus')),
  key_features TEXT[],
  compatibility_notes TEXT,
  condition_notes TEXT,
  warranty_notes TEXT,
  included_items TEXT[],
  excluded_items TEXT[],
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_availability ON products(availability);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name_gin ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(sku,'') || ' ' || coalesce(description,''))
);
```

**Frontend references:**
- `Product` interface in `types/index.ts` (line 34): 22 fields
- `ProductFormData` in `AdminProductForm.tsx` (line 38): form fields
- `enrichProduct()` in `products.ts`: generates fake data for missing fields
- Products type `ProductCategory` in `types/index.ts` (line 1): 19 category slugs — these become category IDs

### 4.4 Product Images

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_asset_id UUID REFERENCES media_assets(id),
  url TEXT NOT NULL,
  alt_text VARCHAR(500),
  label VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
```

**Frontend references:**
- `ProductImage` in `types/index.ts` (line 28): `{url, alt, label?}`
- ProductDetail.tsx (line 155-162): only 1 thumbnail shown, `thumbnails` array has 1 entry
- AdminMedia.tsx: upload/delete UI (no backend)
- Products use `product.filename` for image path: `/images/${product.filename}`

### 4.5 Product Specifications

```sql
CREATE TABLE product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_specs_product ON product_specs(product_id);
```

**Frontend references:**
- `Product.specs` in `types/index.ts`: `Record<string, string>` — currently all empty `{}`
- `getProductSpecs()` in `ProductDetail.tsx`: generates fake specs per category
- AdminProductForm.tsx: dynamic key-value spec editor

### 4.6 Product Industries (Join Table)

```sql
CREATE TABLE product_industries (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, industry_id)
);
```

**Frontend references:**
- `Product.industry` in `types/index.ts`: `string[]` — multi-select
- IndustriesTabs.tsx, Industry pages filter by industry

### 4.7 Categories

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon VARCHAR(100),
  seo_title VARCHAR(255),
  seo_description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

**Frontend references:**
- `productCategories` in `products.ts` (line 380): `buildProductCategories()` returns `{id, name, count}`
- `ProductCategory` type in `types/index.ts`: 19 string literals
- AdminCategories.tsx: full tree CRUD with parent/child relationships

### 4.8 Brands

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  sectors TEXT[] DEFAULT '{}',
  description TEXT,
  website VARCHAR(255),
  country VARCHAR(100),
  seo_title VARCHAR(255),
  seo_description TEXT,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_brands_slug ON brands(slug);
```

**Frontend references:**
- `Brand` interface in `types/index.ts` (line 60): `{id, name, slug, sectors, productCount, logo?}`
- `brands` array in `brands.ts`: 12 hardcoded brands
- `brandMarqueeItems` and `brandMarqueeItems2` in `brands.ts`: marquee display data
- AdminBrands.tsx: full CRUD with logo upload, sector management

### 4.9 Industries

```sql
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(100),
  description TEXT,
  pain_points TEXT[] DEFAULT '{}',
  seo_title VARCHAR(255),
  seo_description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Frontend references:**
- `Industry` interface in `types/index.ts` (line 69): `{id, name, icon, description, painPoints, productCount}`
- `industries` array in `industries.ts`: 8 hardcoded industries
- AdminIndustries.tsx: full CRUD

### 4.10 Orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. MS7-ORD-07001
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','paid','processing','packed','shipped','delivered','cancelled')),
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','refunded')),
  payment_intent_id VARCHAR(255), -- Stripe payment intent
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  shipping_full_name VARCHAR(255),
  shipping_address_line1 VARCHAR(255),
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(100),
  tracking_number VARCHAR(100),
  courier VARCHAR(100),
  customer_notes TEXT,
  admin_notes TEXT,
  cancel_requested BOOLEAN DEFAULT false,
  cancel_reason TEXT,
  cancel_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

**Frontend references:**
- `OrderSummary` in `types/index.ts` (line 164): `{orderId, items, shipping, paymentMethod, subtotal, shippingCost, tax, total, estimatedDelivery, status?, cancelRequested?}`
- `Order` in `AdminOrders.tsx` (line 26): full shape with timeline, items, tracking
- `Checkout.tsx`: shipping form, payment form, review step
- `handlePlaceOrder()` in Checkout.tsx: generates random ID, clears cart
- Order statuses in `AdminOrders.tsx` (line 24): 8 statuses
- `STATUS_FLOW` in AdminOrders.tsx: pending → confirmed → paid → processing → packed → shipped → delivered

### 4.11 Order Items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(500) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

**Frontend references:**
- `CartItem` in `types/index.ts` (line 144): `{product: Product, quantity: number}`
- AdminOrders.tsx items: `{productName, sku, quantity, price}`

### 4.12 Order Timeline

```sql
CREATE TABLE order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  note TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_timeline_order ON order_timeline(order_id);
```

**Frontend references:**
- `AdminOrders.tsx` timeline: `{status, date, note}`

### 4.13 RFQ (Request for Quote)

```sql
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. AT-12345
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  -- Contact info (denormalized for quick access)
  full_name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country VARCHAR(100),
  role VARCHAR(100),
  -- Product info
  product_description TEXT NOT NULL,
  part_number VARCHAR(255),
  brand VARCHAR(255),
  quantity INTEGER DEFAULT 1,
  delivery_location VARCHAR(255),
  -- Status
  urgency VARCHAR(20) DEFAULT 'standard'
    CHECK (urgency IN ('standard','urgent','emergency')),
  status VARCHAR(30) DEFAULT 'new'
    CHECK (status IN ('new','reviewing','awaiting-supplier','quote-sent','customer-replied','won','lost','closed')),
  assigned_to UUID REFERENCES admin_users(id),
  -- Source tracking
  source VARCHAR(50),
  consent BOOLEAN DEFAULT false,
  -- Response tracking
  response_deadline TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  -- Internal
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rfqs_urgency ON rfqs(urgency);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_created ON rfqs(created_at DESC);
CREATE INDEX idx_rfqs_emergency ON rfqs(urgency, status) WHERE urgency = 'emergency';
```

**Frontend references:**
- `RFQFormData` in `types/index.ts` (line 110): 15 fields across 3 steps
- `RFQ.tsx`: 3-step form with validation
- `AdminRFQs.tsx` (line 35): full RFQ shape with items, assignedTo, responseCount
- RFQ statuses in AdminRFQs.tsx (line 26): `'new' | 'in-progress' | 'quoted' | 'closed' | 'won' | 'lost'`
- **MISMATCH**: Frontend has 6 statuses, requirements doc has 8. Backend should use the 8 from requirements.
- `RFQUrgency` in AdminRFQs.tsx (line 25): `'critical' | 'high' | 'normal' | 'low'` — **MISMATCH**: frontend uses `standard|urgent|emergency` in RFQ form but `critical|high|normal|low` in admin. Backend should support both mappings.

### 4.14 RFQ Items

```sql
CREATE TABLE rfq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  product_name VARCHAR(500) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rfq_items_rfq ON rfq_items(rfq_id);
```

### 4.15 RFQ Timeline/Notes

```sql
CREATE TABLE rfq_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  author_id UUID REFERENCES admin_users(id),
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.16 Offers (Make an Offer)

```sql
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. OFF-20001
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  offered_price DECIMAL(12,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','countered','expired','converted-to-order')),
  counter_price DECIMAL(12,2),
  admin_notes TEXT,
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_product ON offers(product_id);
CREATE INDEX idx_offers_customer ON offers(customer_email);
```

**Frontend references:**
- Make Offer modal in ProductDetail.tsx: collects `{offerPrice, offerEmail}`
- `AdminOffers.tsx` (line 32): full offer shape with items, terms, validUntil
- Offer statuses in AdminOffers.tsx (line 22): `'pending' | 'accepted' | 'rejected' | 'expired'`

### 4.17 Contact Messages

```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new'
    CHECK (status IN ('new','read','replied','archived')),
  assigned_to UUID REFERENCES admin_users(id),
  internal_notes TEXT,
  source VARCHAR(50) DEFAULT 'contact-form',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contact_messages_status ON contact_messages(status);
```

**Frontend references:**
- Contact.tsx form: name, email, subject, message
- Emergency.tsx form: name, phone, partDesc, vesselName
- AdminMessages.tsx: inbox/sent/starred/trash UI (mock data)

### 4.18 Emergency Requests

```sql
CREATE TABLE emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  part_description TEXT NOT NULL,
  vessel_name VARCHAR(255),
  rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL, -- linked RFQ if created
  status VARCHAR(20) DEFAULT 'new'
    CHECK (status IN ('new','contacted','in-progress','resolved')),
  contacted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Frontend references:**
- Emergency.tsx form: name, phone, partDescription, vesselName
- Should auto-create an emergency-priority RFQ

### 4.19 Media Assets

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type VARCHAR(100),
  file_size INTEGER, -- bytes
  width INTEGER,
  height INTEGER,
  alt_text VARCHAR(500),
  label VARCHAR(100),
  hash VARCHAR(64), -- for duplicate detection
  uploaded_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_media_hash ON media_assets(hash);
```

**Frontend references:**
- AdminMedia.tsx: upload UI, preview modal, delete, productUsageMap
- Image optimization mentions in MOBILE_AUDIT.md

### 4.20 Testimonials

```sql
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  company VARCHAR(255),
  avatar_url TEXT,
  text TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Frontend references:**
- `Testimonial` in `types/index.ts` (line 78): `{id, name, role, company, avatar, text, rating}`
- `testimonials` in `testimonials.ts`: 5 hardcoded testimonials
- Testimonials.tsx section: carousel display

### 4.21 Offices

```sql
CREATE TABLE offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  address TEXT,
  timezone VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  coordinates_lat DECIMAL(10,7),
  coordinates_lng DECIMAL(10,7),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Frontend references:**
- `Office` in `types/index.ts` (line 88): `{city, country, address, timezone, phone, email, coordinates}`
- `offices` in `testimonials.ts`: 5 hardcoded offices
- Contact.tsx: renders office cards

### 4.22 Store Settings

```sql
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category VARCHAR(100),
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Settings keys needed:**

| Key | Type | Source |
|-----|------|--------|
| `site.companyName` | string | AdminSettings.tsx defaultSite |
| `site.tagline` | string | AdminSettings.tsx |
| `site.email` | string | AdminSettings.tsx |
| `site.phone` | string | AdminSettings.tsx |
| `site.address` | string | AdminSettings.tsx |
| `site.city` | string | AdminSettings.tsx |
| `site.country` | string | AdminSettings.tsx |
| `site.currency` | string | AdminSettings.tsx |
| `site.timezone` | string | AdminSettings.tsx |
| `site.seoTitle` | string | AdminSettings.tsx |
| `site.seoDescription` | string | AdminSettings.tsx |
| `site.googleAnalyticsId` | string | AdminSettings.tsx |
| `site.maintenanceMode` | boolean | AdminSettings.tsx |
| `site.whatsappNumber` | string | Hardcoded in 6+ files |
| `site.rfqEmail` | string | Hardcoded |
| `site.emergencyEmail` | string | Hardcoded |
| `shipping.zones` | ShippingZone[] | AdminSettings.tsx |
| `payments.methods` | PaymentMethod[] | AdminSettings.tsx |
| `notifications.prefs` | NotificationPrefs | AdminSettings.tsx |
| `homepage.sections` | Section[] | AdminHomepage.tsx |
| `checkout.shippingCost` | number | Hardcoded $25 |
| `checkout.taxRate` | number | Hardcoded 8% |
| `checkout.freeShippingThreshold` | number | Not implemented |
| `product.lowStockThreshold` | number | AdminSettings.tsx |
| `product.priceFilterMax` | number | Hardcoded $1000 |

### 4.23 Homepage Sections

```sql
CREATE TABLE homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Frontend references:**
- AdminHomepage.tsx: 8 sections with config key-value pairs
- Section types: hero, featured, stats, categories, brands, testimonials, industries, cta

### 4.24 Audit Log

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES admin_users(id),
  actor_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  entity_name VARCHAR(255),
  previous_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### 4.25 Email Queue

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  template VARCHAR(100),
  template_data JSONB,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','retrying')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
```

### 4.26 Webhook Logs

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL, -- 'stripe', etc.
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  status VARCHAR(20) DEFAULT 'received',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. API ENDPOINTS — EVERY ROUTE <a name="5-api-endpoints"></a>

### 5.1 Authentication

| Method | Route | Auth | Purpose | Frontend Usage |
|--------|-------|------|---------|----------------|
| POST | `/api/admin/auth/login` | No | Admin login, returns JWT | AdminLogin.tsx `adminLogin()` |
| POST | `/api/admin/auth/refresh` | Yes | Refresh JWT token | Automatic |
| POST | `/api/admin/auth/logout` | Yes | Invalidate session | AdminSidebar.tsx `adminLogout()` |
| GET | `/api/admin/auth/me` | Yes | Get current admin user | AdminGuard.tsx |
| POST | `/api/admin/auth/password-reset-request` | No | Send reset email | Not implemented |
| POST | `/api/admin/auth/password-reset` | No | Reset with token | Not implemented |
| POST | `/api/auth/register` | No | Customer registration | Not implemented |
| POST | `/api/auth/login` | No | Customer login | AuthModal.tsx `login()` |
| POST | `/api/auth/logout` | Yes | Customer logout | useStore.ts `logout()` |

### 5.2 Products (Storefront)

| Method | Route | Auth | Purpose | Frontend Usage |
|--------|-------|------|---------|----------------|
| GET | `/api/storefront/products` | No | List products with filters, search, pagination | Products.tsx, useProducts.ts |
| GET | `/api/storefront/products/:id` | No | Get single product | ProductDetail.tsx |
| GET | `/api/storefront/products/featured` | No | Get featured products | FeaturedProducts.tsx |
| GET | `/api/storefront/products/new-arrivals` | No | Get new arrivals | Home.tsx |
| GET | `/api/storefront/products/emergency` | No | Get emergency-available products | Emergency.tsx |
| GET | `/api/storefront/products/:id/related` | No | Get related products | ProductDetail.tsx |
| GET | `/api/storefront/products/:id/price` | No | Get product price (with sale check) | getProductPrice() in products.ts |

**Query parameters for list endpoint:**
```
?search=radar
&category=electronics-navigation
&brand=siemens
&industry=marine
&condition=used
&availability=in-stock
&onSale=true
&isNewArrival=true
&isFeatured=true
&makeOffer=true
&priceMin=100
&priceMax=5000
&sort=price-asc|price-desc|name-asc|name-desc|newest|oldest|relevance
&page=1
&limit=24
```

### 5.3 Products (Admin)

| Method | Route | Auth | Purpose | Frontend Usage |
|--------|-------|------|---------|----------------|
| GET | `/api/admin/products` | admin | List all products (including drafts) | AdminProducts.tsx |
| GET | `/api/admin/products/:id` | admin | Get product for editing | AdminProductForm.tsx |
| POST | `/api/admin/products` | admin | Create product | AdminProductForm.tsx |
| PUT | `/api/admin/products/:id` | admin | Update product | AdminProductForm.tsx |
| DELETE | `/api/admin/products/:id` | admin | Delete product | AdminProducts.tsx |
| PATCH | `/api/admin/products/bulk` | admin | Bulk actions (publish, hide, archive, etc.) | AdminProducts.tsx bulk actions |
| GET | `/api/admin/products/export/csv` | admin | Export products as CSV | AdminProducts.tsx |

### 5.4 Categories

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/storefront/categories` | No | List visible categories with product counts |
| GET | `/api/storefront/categories/:slug` | No | Get category with products |
| GET | `/api/admin/categories` | admin | List all categories (tree) |
| POST | `/api/admin/categories` | admin | Create category |
| PUT | `/api/admin/categories/:id` | admin | Update category |
| DELETE | `/api/admin/categories/:id` | admin | Delete category (check for products) |
| PATCH | `/api/admin/categories/:id/reorder` | admin | Reorder categories |

### 5.5 Brands

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/storefront/brands` | No | List visible brands |
| GET | `/api/storefront/brands/:slug` | No | Get brand with products |
| GET | `/api/admin/brands` | admin | List all brands |
| POST | `/api/admin/brands` | admin | Create brand |
| PUT | `/api/admin/brands/:id` | admin | Update brand |
| DELETE | `/api/admin/brands/:id` | admin | Delete brand |
| POST | `/api/admin/brands/:id/logo` | admin | Upload brand logo |

### 5.6 Industries

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/storefront/industries` | No | List visible industries |
| GET | `/api/storefront/industries/:slug` | No | Get industry with products |
| GET | `/api/admin/industries` | admin | List all industries |
| POST | `/api/admin/industries` | admin | Create industry |
| PUT | `/api/admin/industries/:id` | admin | Update industry |
| DELETE | `/api/admin/industries/:id` | admin | Delete industry |

### 5.7 Orders

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/storefront/orders` | customer | Create order from checkout |
| GET | `/api/storefront/orders/:id` | customer | Get order (own orders only) |
| POST | `/api/storefront/orders/:id/cancel` | customer | Request cancellation |
| GET | `/api/admin/orders` | admin | List all orders |
| GET | `/api/admin/orders/:id` | admin | Get order detail |
| PATCH | `/api/admin/orders/:id/status` | admin | Advance order status |
| PATCH | `/api/admin/orders/:id/tracking` | admin | Update tracking info |
| POST | `/api/admin/orders/:id/cancel` | admin | Cancel order |
| GET | `/api/admin/orders/:id/invoice` | admin | Generate/download invoice PDF |
| GET | `/api/admin/orders/export/csv` | admin | Export orders as CSV |

### 5.8 RFQs

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/storefront/rfq` | No | Submit RFQ (public form) |
| GET | `/api/admin/rfqs` | admin | List all RFQs |
| GET | `/api/admin/rfqs/:id` | admin | Get RFQ detail |
| PATCH | `/api/admin/rfqs/:id/status` | admin | Update RFQ status |
| PATCH | `/api/admin/rfqs/:id/assign` | admin | Assign RFQ to staff |
| POST | `/api/admin/rfqs/:id/notes` | admin | Add internal note |
| POST | `/api/admin/rfqs/:id/respond` | admin | Send response to customer |
| POST | `/api/admin/rfqs/:id/convert-to-offer` | admin | Convert RFQ to offer |
| POST | `/api/admin/rfqs/:id/convert-to-order` | admin | Convert RFQ to order |

### 5.9 Offers

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/storefront/offers` | No | Submit make-offer (public) |
| GET | `/api/admin/offers` | admin | List all offers |
| GET | `/api/admin/offers/:id` | admin | Get offer detail |
| PATCH | `/api/admin/offers/:id/accept` | admin | Accept offer |
| PATCH | `/api/admin/offers/:id/reject` | admin | Reject offer |
| PATCH | `/api/admin/offers/:id/counter` | admin | Send counter-offer |
| POST | `/api/admin/offers/:id/convert-to-order` | admin | Convert to order |
| GET | `/api/admin/offers/export/csv` | admin | Export offers as CSV |

### 5.10 Customers (Admin)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/admin/customers` | admin | List all customers |
| GET | `/api/admin/customers/:id` | admin | Get customer detail with order history |
| POST | `/api/admin/customers` | admin | Create customer |
| PATCH | `/api/admin/customers/:id` | admin | Update customer |
| PATCH | `/api/admin/customers/:id/status` | admin | Change customer status |
| POST | `/api/admin/customers/:id/notes` | admin | Add internal note |

### 5.11 Contact Messages

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/storefront/contact` | No | Submit contact form |
| POST | `/api/storefront/emergency` | No | Submit emergency request |
| GET | `/api/admin/messages` | admin | List all messages |
| GET | `/api/admin/messages/:id` | admin | Get message detail |
| PATCH | `/api/admin/messages/:id/read` | admin | Mark as read |
| PATCH | `/api/admin/messages/:id/archive` | admin | Archive message |
| DELETE | `/api/admin/messages/:id` | admin | Delete message |
| POST | `/api/admin/messages/:id/reply` | admin | Reply to message |

### 5.12 Media Library

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/admin/media/upload` | admin | Upload image(s) |
| GET | `/api/admin/media` | admin | List all media assets |
| GET | `/api/admin/media/:id` | admin | Get media detail |
| PUT | `/api/admin/media/:id` | admin | Update alt text, label |
| DELETE | `/api/admin/media/:id` | admin | Delete media (check usage) |
| GET | `/api/admin/media/:id/usage` | admin | Which products use this image |

### 5.13 Homepage Content

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/storefront/homepage` | No | Get enabled sections with config |
| GET | `/api/admin/homepage` | admin | Get all sections |
| PUT | `/api/admin/homepage` | admin | Update all sections (reorder, enable/disable, config) |

### 5.14 Store Settings

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/storefront/settings` | No | Get public settings (currency, whatsapp, phone, etc.) |
| GET | `/api/admin/settings` | admin | Get all settings |
| PUT | `/api/admin/settings` | admin | Update settings |

### 5.15 Admin Users

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/admin/users` | owner | List all admin users |
| POST | `/api/admin/users` | owner | Create admin user |
| PUT | `/api/admin/users/:id` | owner | Update admin user |
| DELETE | `/api/admin/users/:id` | owner | Deactivate admin user |
| PATCH | `/api/admin/users/:id/role` | owner | Change role |

### 5.16 Dashboard

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/admin/dashboard/stats` | admin | Product stats, order stats, RFQ stats |
| GET | `/api/admin/dashboard/alerts` | admin | Low stock, missing images, overdue RFQs |
| GET | `/api/admin/dashboard/activity` | admin | Recent activity log |

### 5.17 Audit Log

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/admin/audit` | admin | List audit logs with filters |

### 5.18 Search

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/storefront/search?q=radar` | No | Full-text search across products, categories, pages |

### 5.19 Testimonials & Offices

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/storefront/testimonials` | No | List visible testimonials |
| GET | `/api/storefront/offices` | No | List offices |
| GET | `/api/admin/testimonials` | content-manager | List all testimonials |
| PUT | `/api/admin/testimonials` | content-manager | Update testimonials |
| GET | `/api/admin/offices` | content-manager | List all offices |
| PUT | `/api/admin/offices` | content-manager | Update offices |

---

## 6. AUTHENTICATION & AUTHORIZATION <a name="6-auth"></a>

### 6.1 Admin Auth Flow

1. Admin submits email + password to `POST /api/admin/auth/login`
2. Server validates against `admin_users` table (bcrypt password check)
3. Server returns JWT access token (15min) + refresh token (7 days)
4. Frontend stores tokens in httpOnly cookies (not localStorage)
5. Every admin API request includes `Authorization: Bearer <token>` header
6. Middleware validates token, attaches `req.user` with `{id, email, role}`
7. Role-based middleware checks permissions per route

### 6.2 Role Permissions Matrix

| Resource | Owner | Store Manager | Inventory Manager | Sales Agent | Content Manager | Viewer |
|----------|-------|--------------|-------------------|-------------|----------------|--------|
| Products | ✅ CRUD | ✅ CRUD | ✅ CRUD | 👁 Read | 👁 Read | 👁 Read |
| Categories | ✅ CRUD | ✅ CRUD | ✅ CRUD | 👁 Read | 👁 Read | 👁 Read |
| Brands | ✅ CRUD | ✅ CRUD | ✅ CRUD | 👁 Read | 👁 Read | 👁 Read |
| Industries | ✅ CRUD | ✅ CRUD | 👁 Read | 👁 Read | ✅ CRUD | 👁 Read |
| Orders | ✅ CRUD | ✅ CRUD | 👁 Read | ✅ Update | 👁 Read | 👁 Read |
| RFQs | ✅ CRUD | ✅ CRUD | 👁 Read | ✅ CRUD | 👁 Read | 👁 Read |
| Offers | ✅ CRUD | ✅ CRUD | 👁 Read | ✅ CRUD | 👁 Read | 👁 Read |
| Customers | ✅ CRUD | ✅ CRUD | 👁 Read | ✅ Read | 👁 Read | 👁 Read |
| Messages | ✅ CRUD | ✅ CRUD | 👁 Read | ✅ CRUD | 👁 Read | 👁 Read |
| Media | ✅ CRUD | ✅ CRUD | ✅ CRUD | 👁 Read | ✅ Upload | 👁 Read |
| Homepage | ✅ CRUD | ✅ CRUD | 👁 Read | 👁 Read | ✅ CRUD | 👁 Read |
| Settings | ✅ CRUD | ⚠️ Limited | 👁 Read | 👁 Read | 👁 Read | 👁 Read |
| Users | ✅ CRUD | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Log | 👁 Read | 👁 Read | 👁 Read | 👁 Read | 👁 Read | 👁 Read |

### 6.3 Customer Auth Flow

1. Customer registers with name + email + password
2. Server creates customer record, sends verification email
3. Customer logs in, receives JWT (7 days) + refresh (30 days)
4. Token stored in httpOnly cookie
5. Customer APIs check `req.user` for ownership

---

## 7. FILE UPLOAD & IMAGE MANAGEMENT <a name="7-file-upload"></a>

### 7.1 Upload Requirements

| Use Case | Max Size | Formats | Optimization |
|----------|----------|---------|-------------|
| Product images | 10MB | JPG, PNG, WebP, AVIF | Auto-generate WebP, thumbnails (400px, 200px) |
| Brand logos | 5MB | PNG, SVG, WebP | Auto-resize to 200x200 |
| Document attachments | 20MB | PDF, DOC, XLS | Store as-is |
| Admin avatars | 2MB | JPG, PNG | Auto-resize to 200x200 |

### 7.2 Upload Flow

1. Frontend sends file to `POST /api/admin/media/upload` (multipart/form-data)
2. Backend validates file type and size
3. Backend uploads to storage bucket (Supabase Storage or S3)
4. Backend generates thumbnail(s) using `sharp` (already in devDependencies)
5. Backend creates `media_assets` record
6. Returns `{id, url, thumbnailUrl, width, height, mimeType, fileSize}`

### 7.3 Image Relationships

- Products reference images via `product_images` table
- Each product has one main image (`is_main = true`) + gallery images
- Images can be shared across products via `media_asset_id`
- Deleting an image checks if any published product uses it
- Missing image detection: compare `product_images.url` against storage

### 7.4 Image Optimization Pipeline

1. On upload: generate WebP version, thumbnail (400px), small thumbnail (200px)
2. Store originals at full resolution
3. Serve WebP to browsers that support it (check Accept header)
4. Use `<picture>` element with AVIF > WebP > JPG fallbacks
5. Add `Cache-Control: public, max-age=31536000, immutable` for hashed filenames

---

## 8. SEARCH & FILTERING <a name="8-search"></a>

### 8.1 Product Search Requirements

**Current frontend search (Products.tsx useProducts.ts):**
- Checks: `product.name`, `product.sku`, `product.brand`
- Brand matching is fragile: `brandSlug.includes(b)` where b is a 3-7 char substring

**Required search capabilities:**

| Search Target | Method | Priority |
|--------------|--------|----------|
| Product name | PostgreSQL `to_tsvector` + `ts_query` | P0 |
| SKU | Exact + prefix match | P0 |
| Brand name | JOIN to brands table, fuzzy match | P0 |
| Category | JOIN to categories table | P0 |
| Description | Full-text search on description | P1 |
| Specs | JSONB search on spec values | P2 |
| Part numbers | Separate `part_numbers` array field | P1 |
| OEM references | Separate `oem_references` array field | P2 |
| Internal tags | Array field search | P2 |
| Alternate SKUs | `alternate_skus` array field | P2 |

### 8.2 Filter Parameters (Frontend → Backend)

From `Products.tsx` and `useProducts.ts`:

```typescript
{
  search?: string;           // Free text search
  categories?: string[];     // Category IDs
  brands?: string[];         // Brand IDs or slugs
  industry?: string;         // Industry ID
  condition?: string;        // new|unused|used|refurbished|reconditioned
  availability?: string;     // in-stock|emergency|sourced|out-of-stock
  onSale?: boolean;          // Only sale items
  isNewArrival?: boolean;    // Only new arrivals
  isFeatured?: boolean;      // Only featured
  makeOffer?: boolean;       // Only make-offer enabled
  priceMin?: number;         // Min price (currently capped at $1000 — MUST FIX)
  priceMax?: number;         // Max price
  sortBy?: string;           // relevance|name-asc|name-desc|category|price-asc|price-desc|newest|oldest
  page?: number;             // Page number
  limit?: number;            // Items per page (default 24)
}
```

### 8.3 Sort Options

| Sort Value | SQL ORDER BY |
|-----------|-------------|
| `relevance` | ts_rank DESC (only when search query present), else sort_priority DESC, created_at DESC |
| `name-asc` | name ASC |
| `name-desc` | name DESC |
| `price-asc` | COALESCE(sale_price, regular_price) ASC |
| `price-desc` | COALESCE(sale_price, regular_price) DESC |
| `newest` | created_at DESC |
| `oldest` | created_at ASC |
| `category` | category name ASC, then name ASC |

### 8.4 Search Response Shape

```typescript
{
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: {
    categories: { id: string; name: string; count: number }[];
    brands: { id: string; name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}
```

---

## 9. EMAIL & NOTIFICATION SYSTEM <a name="9-email"></a>

### 9.1 Required Email Templates

| Trigger | Template | Recipients | Priority |
|---------|----------|-----------|----------|
| Order placed | `order-confirmation` | Customer | P0 |
| Order confirmed | `order-confirmed` | Customer | P1 |
| Order shipped | `order-shipped` | Customer | P0 |
| Order delivered | `order-delivered` | Customer | P1 |
| Order cancelled | `order-cancelled` | Customer + Admin | P0 |
| RFQ received | `rfq-received` | Admin (rfq@ email) | P0 |
| RFQ response | `rfq-response` | Customer | P0 |
| Emergency RFQ | `emergency-rfq` | Admin (emergency@ email) | P0 |
| Offer received | `offer-received` | Admin | P0 |
| Offer accepted | `offer-accepted` | Customer | P0 |
| Offer rejected | `offer-rejected` | Customer | P1 |
| Counter offer | `counter-offer` | Customer | P0 |
| Contact message | `contact-notification` | Admin | P1 |
| Low stock alert | `low-stock-alert` | Admin | P1 |
| Weekly report | `weekly-report` | Admin (configurable email) | P2 |
| Monthly report | `monthly-report` | Admin (configurable email) | P2 |
| Welcome (registration) | `welcome` | Customer | P2 |
| Password reset | `password-reset` | Customer/Admin | P1 |

### 9.2 Email Sending Flow

1. Action triggers email (order placed, RFQ submitted, etc.)
2. Backend creates `email_queue` record with template + data
3. Background worker (or immediate for P0) processes queue
4. Worker renders HTML from template + data
5. Worker sends via Resend/SendGrid API
6. Worker updates `email_queue.status` to `sent` or `failed`
7. Failed emails retry up to 3 times with exponential backoff

### 9.3 Admin Notification Preferences

From `AdminSettings.tsx` notifications tab:

```typescript
{
  orderPlaced: boolean;
  orderConfirmed: boolean;
  orderShipped: boolean;
  orderDelivered: boolean;
  orderCancelled: boolean;
  lowStock: boolean;
  lowStockThreshold: number;
  rfqReceived: boolean;
  rfqAssigned: boolean;
  rfqUrgent: boolean;
  newCustomer: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  reportEmail: string;
}
```

---

## 10. PAYMENT PROCESSING <a name="10-payments"></a>

### 10.1 Payment Methods (from AdminSettings.tsx)

| Method | Provider | Status in Settings |
|--------|----------|-------------------|
| Credit/Debit Card | Stripe | Enabled, Live mode |
| Bank Transfer (Wire) | Manual | Enabled |
| PayPal | PayPal SDK | Disabled, Sandbox mode |
| Letter of Credit (L/C) | Manual | Enabled |

### 10.2 Stripe Integration Flow

1. Customer reaches Step 3 (Review) in checkout
2. Frontend calls `POST /api/storefront/orders` with shipping + cart items
3. Backend creates order (status: `pending`), creates Stripe PaymentIntent
4. Backend returns `clientSecret` to frontend
5. Frontend confirms payment with Stripe.js
6. Stripe webhook fires `payment_intent.succeeded`
7. Backend updates order status to `paid`, reduces stock
8. Backend sends order confirmation email

### 10.3 Bank Transfer Flow

1. Customer selects "Bank Transfer"
2. Order created with status `pending`, payment_status `pending`
3. Admin sees order in "Payment Pending" tab
4. Admin manually confirms payment
5. Order status advances to `confirmed`

### 10.4 PayPal Flow

1. Customer selects PayPal, clicks "Pay with PayPal"
2. Redirect to PayPal SDK (not a fake modal)
3. PayPal redirects back with payment confirmation
4. PayPal webhook fires
5. Backend updates order

### 10.5 Stock Management Rules

- Stock reduces when order status reaches `paid` (for card/PayPal) or `confirmed` (for bank transfer)
- Stock restores when order is cancelled
- `stock_count` on product decremented atomically
- If `stock_count` reaches 0, availability auto-changes to `out-of-stock`
- Low stock alert triggered when `stock_count <= low_stock_threshold`

---

## 11. STOREFRONT WORKFLOWS — END TO END <a name="11-storefront-workflows"></a>

### 11.1 Browse Products

1. User visits `/products`
2. Frontend calls `GET /api/storefront/products?page=1&limit=24`
3. Backend returns products + filter counts + pagination
4. User applies filters → frontend adds query params → re-fetches
5. User clicks product → navigates to `/product/:id`
6. Frontend calls `GET /api/storefront/products/:id`
7. Backend returns product + specs + images + related products

### 11.2 Add to Cart

1. User clicks "Add to Cart" on product card
2. Frontend calls `addToCart(product)` in Zustand store
3. Cart stored in localStorage (Phase 1) or synced to server (Phase 2)
4. Cart drawer opens showing added item
5. Cart badge updates in navbar

### 11.3 Checkout

1. User clicks "Checkout" → redirected to `/checkout`
2. **Step 1 (Shipping):** User fills shipping form → validates → clicks "Continue"
3. **Step 2 (Payment):** User selects payment method → fills details → clicks "Review Order"
4. **Step 3 (Review):** User reviews order summary → clicks "Place Order"
5. **Backend:** Creates order → processes payment → reduces stock → sends confirmation email
6. **Post-order:** Shows confirmation page with order ID, tracking button, cancel option

### 11.4 RFQ Submission

1. User visits `/rfq`
2. **Step 1 (Contact):** Name, company, email, phone, country, role
3. **Step 2 (Product):** Description, part number, brand, quantity, delivery location
4. **Step 3 (Urgency):** Standard/Urgent/Emergency selection, notes, source, consent
5. **Submit:** Backend creates RFQ, sends confirmation email to customer, notification to admin
6. **Emergency:** Emergency RFQs get priority SLA (response within 2 hours)

### 11.5 Make Offer

1. User views product detail page
2. Clicks "Make an Offer" (if `make_offer_enabled`)
3. Enters offered price + email
4. **Submit:** Backend creates offer record, sends notification to admin
5. Admin reviews, accepts/rejects/counters
6. Customer notified of decision

### 11.6 Contact Form

1. User visits `/contact`
2. Fills name, email, subject, message
3. **Submit:** Backend creates contact_message, sends notification to admin
4. Admin reviews, replies, optionally converts to RFQ

### 11.7 Emergency Request

1. User visits `/emergency`
2. Fills name, phone, part description, vessel name
3. **Submit:** Backend creates emergency_request + emergency-priority RFQ
4. Admin gets immediate notification (email + dashboard alert)
5. SLA: respond within 2 hours

### 11.8 Search

1. User types in search bar (Cmd+K or `/search` page)
2. Frontend debounces 300ms, then calls `GET /api/storefront/search?q=radar`
3. Backend runs full-text search across products, categories, pages
4. Returns ranked results with type indicators (product, page, category)
5. Search analytics logged (what users search for)

---

## 12. ADMIN WORKFLOWS — END TO END <a name="12-admin-workflows"></a>

### 12.1 Add Product (Complete Flow)

1. Admin clicks "Add Product" → navigates to `/admin/products/new`
2. **Basics tab:** Name*, SKU* (unique), Brand* (select/create), Category* (select), Condition*, Product Type
3. **Images tab:** Upload main image*, upload gallery images, drag-to-reorder, set alt text, add labels
4. **Pricing tab:** Regular price*, sale price, sale date range, currency, show/hide price, make-offer toggle, minimum offer price
5. **Inventory tab:** In-stock toggle, stock count, low-stock threshold, availability, warehouse, lead time
6. **Specifications tab:** Dynamic key-value pairs (add/remove rows)
7. **Shipping tab:** Key features, compatibility notes, condition notes, warranty, included/excluded items
8. **SEO tab:** Meta title, description, keywords, OG image
9. **Admin Notes tab:** Internal notes, purchase cost, supplier reference
10. **Preview:** Click "Preview" → opens `/product/:id` in new tab
11. **Save:** Validates required fields → creates product → shows success → redirects to product list

### 12.2 Handle RFQ (Complete Flow)

1. Admin opens RFQ Inbox (`/admin/rfqs`)
2. Sees all RFQs with urgency/status badges
3. Filters by urgency (emergency first!) or status
4. Clicks RFQ card → slide-over opens
5. Reviews: customer info, product details, urgency, items
6. **Quick actions:**
   - Assign to team member (Ahmed K., Sarah M., etc.)
   - Advance status (new → in-progress → quoted → won)
   - Create Offer (navigates to offer creation with pre-filled data)
   - Add internal notes
7. **Response:** Sends quote via email (or WhatsApp-ready message)
8. **Emergency SLA:** If urgency=emergency, admin must respond within 2 hours

### 12.3 Process Order (Complete Flow)

1. Admin opens Orders (`/admin/orders`)
2. Sees order list with status tabs (Pending, Confirmed, Paid, etc.)
3. Clicks order → slide-over opens
4. Reviews: customer info, items, totals, shipping address, payment method
5. **Status advance:** Only goes forward (pending → confirmed → paid → processing → packed → shipped → delivered)
6. **Tracking:** When status reaches "shipped", admin enters tracking number + courier
7. **Cancel:** Admin can cancel at any point → stock restored
8. **Invoice:** Generates downloadable PDF invoice
9. **Timeline:** Full status history shown with timestamps

### 12.4 Manage Media Library

1. Admin opens Media (`/admin/media`)
2. Sees grid of all uploaded images with file info
3. **Upload:** Drag-and-drop or click to upload → auto-optimizes
4. **Search:** By filename, product, SKU, brand
5. **Preview:** Click image → modal with details, usage info, alt text editor
6. **Delete:** Shows which products use the image → prevents deletion if in use
7. **Duplicate detection:** Checks filename hash before upload

### 12.5 Update Store Settings

1. Admin opens Settings (`/admin/settings`)
2. **Site Config tab:** Company name, contact info, SEO, analytics, maintenance mode
3. **Shipping Zones tab:** Add/edit/delete zones, set rates, free shipping thresholds
4. **Payment Methods tab:** Enable/disable, configure credentials, test/live mode
5. **Notifications tab:** Toggle email notifications per event, set thresholds
6. **Save:** Persists to database → storefront immediately reflects changes

---

## 13. DATA MIGRATION — FROM STATIC TO REAL <a name="13-data-migration"></a>

### 13.1 Migration Script Requirements

Write a Node.js script that:

1. Reads `src/data/products.ts` and extracts all 255 products
2. Reads `src/data/brands.ts` and extracts all 12 brands
3. Reads `src/data/industries.ts` and extracts all 8 industries
4. Reads `src/data/testimonials.ts` and extracts testimonials, offices, timeline, team, FAQs
5. Creates database records for each entity
6. Maps `Product.brand` string → `brands.id` UUID
7. Maps `Product.category` string → `categories.id` UUID
8. Maps `Product.industry` string[] → `product_industries` join records
9. Creates product images from `Product.images` array
10. Generates slugs from names
11. Sets realistic prices (keep the `enrichProduct()` generated prices as starting point)
12. Creates initial admin user: `admin@alkatraders.com`

### 13.2 Data Mapping

| Frontend Field | Database Column | Notes |
|---------------|----------------|-------|
| `product.id` | `products.id` | Generate new UUID, keep old ID as `legacy_id` |
| `product.filename` | Derive from `product_images` | Map filename to image record |
| `product.name` | `products.name` | Direct |
| `product.brand` | `products.brand_id` | Lookup by brand name |
| `product.sku` | `products.sku` | Direct, ensure unique |
| `product.category` | `products.category_id` | Lookup by category slug |
| `product.industry` | `product_industries` | Join table |
| `product.availability` | `products.availability` | Direct |
| `product.specs` | `product_specs` | Key-value rows (currently all empty) |
| `product.description` | `products.description` | Direct |
| `product.condition` | `products.condition` | Direct |
| `product.price` | `products.regular_price` | Direct |
| `product.salePrice` | `products.sale_price` | Direct |
| `product.onSale` | Derive | If salePrice exists and is lower |
| `product.inStock` | Derive | If stockCount > 0 |
| `product.stockCount` | `products.stock_count` | Direct |
| `product.customLabel` | `products.custom_label` | Direct |
| `product.customLabelColor` | `products.custom_label_color` | Direct |
| `product.images` | `product_images` | Image records |
| `product.isNewArrival` | `products.is_new_arrival` | Direct |
| `product.dateAdded` | `products.created_at` | Parse date string |
| `product.makeOffer` | `products.make_offer_enabled` | Direct |

---

## 14. SECURITY REQUIREMENTS <a name="14-security"></a>

### 14.1 Authentication Security

- Passwords: bcrypt with salt rounds ≥ 12
- JWT: RS256 algorithm, short expiry (15min access, 7d refresh)
- Tokens stored in httpOnly, secure, SameSite=Strict cookies
- No sensitive data in JWT payload (only id, email, role)
- Session invalidation on password change
- Account lockout after 5 failed login attempts (15min cooldown)

### 14.2 API Security

- Rate limiting: 100 req/min for public APIs, 300 req/min for authenticated
- CORS: restrict to frontend domain
- Input validation: Zod schemas on every endpoint
- SQL injection: prevented by Prisma ORM (parameterized queries)
- XSS: escape all user-generated content in responses
- CSRF: SameSite cookies + CSRF token for state-changing requests
- File upload: validate MIME type, max size, scan for malware
- No sensitive data in URLs (order IDs are opaque UUIDs, not sequential)

### 14.3 Payment Security

- **Never** store card numbers on your server
- Use Stripe Elements for card input (PCI compliance handled by Stripe)
- Webhook signature verification for Stripe events
- Idempotency keys for payment operations

### 14.4 Data Security

- Environment variables for all secrets (never in code)
- Database connections over SSL
- Backup encryption
- GDPR: customer data export and deletion endpoints
- Audit log for all admin actions

### 14.5 Headers (netlify.toml already has some)

Add to API responses:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 15. PERFORMANCE REQUIREMENTS <a name="15-performance"></a>

### 15.1 Database Performance

- Indexes on all foreign keys, search fields, status fields
- Composite indexes for common filter combinations
- Connection pooling (PgBouncer or Prisma pool)
- Query optimization: avoid N+1 (use `include` in Prisma)
- Pagination: cursor-based for large datasets, offset for admin tables

### 15.2 API Performance

- Response time: < 200ms for list endpoints, < 100ms for single resource
- Caching: Redis cache for product listings (invalidate on update)
- CDN: Product images served from CDN with long cache headers
- Compression: gzip/brotli for API responses

### 15.3 Frontend Performance (Backend Impact)

- API responses should include only needed fields (sparse fieldsets)
- Product list API should return paginated results, not all 255+
- Image URLs should include dimensions for `srcset` generation
- Search should return pre-computed filter counts

---

## 16. DEPLOYMENT & DEVOPS <a name="16-deployment"></a>

### 16.1 Recommended Deployment

| Component | Service | Why |
|-----------|---------|-----|
| Backend API | Railway or Render | Easy Node.js deployment, PostgreSQL included |
| Database | Supabase (PostgreSQL) | Free tier, auth included, storage included |
| File Storage | Supabase Storage | Free tier, integrated with database |
| Frontend | Netlify (already configured) | Static hosting, CDN |
| Email | Resend | Simple API, generous free tier |
| Payments | Stripe | Industry standard |

### 16.2 Docker Configuration

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 16.3 CI/CD Pipeline

1. Push to `main` branch
2. Run tests (Vitest)
3. Run type check (TypeScript)
4. Build backend
5. Deploy to staging
6. Run smoke tests
7. Deploy to production

---

## 17. TESTING STRATEGY <a name="17-testing"></a>

### 17.1 Unit Tests

- All utility functions (price calculation, slug generation, validation)
- All Prisma queries (mock Prisma client)
- All middleware (auth, rate limiting, validation)
- All email templates (render correctly)

### 17.2 Integration Tests

- Every API endpoint (happy path + error cases)
- Authentication flow (register, login, refresh, logout)
- Order flow (create, pay, ship, deliver, cancel)
- RFQ flow (submit, assign, respond, convert)
- File upload flow (upload, optimize, delete)

### 17.3 Test Commands

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests
npm run test:coverage # Coverage report
```

---

## 18. IMPLEMENTATION PHASES — ORDERED TASK LIST <a name="18-implementation-phases"></a>

### Phase 0: Project Setup (Day 1-2)

- [ ] Initialize backend project with Express + TypeScript + Prisma
- [ ] Set up PostgreSQL database (Supabase or local)
- [ ] Configure environment variables
- [ ] Set up project structure: `src/routes/`, `src/middleware/`, `src/services/`, `src/utils/`
- [ ] Configure ESLint + Prettier for backend
- [ ] Set up Vitest for testing
- [ ] Create Prisma schema with all tables from Section 4
- [ ] Run initial migration
- [ ] Set up Supabase Storage bucket for images
- [ ] Configure CORS for frontend domain

### Phase 1: Core Auth & Products (Day 3-7)

- [ ] Implement admin auth: login, JWT generation, refresh, logout
- [ ] Implement auth middleware (JWT validation, role checking)
- [ ] Seed admin user: `admin@alkatraders.com`
- [ ] Implement product CRUD API (admin)
- [ ] Write migration script to import 255 products from `src/data/products.ts`
- [ ] Import brands from `src/data/brands.ts`
- [ ] Import categories (build tree structure)
- [ ] Import industries from `src/data/industries.ts`
- [ ] Implement product image upload (Supabase Storage)
- [ ] Implement storefront product list API with filtering/pagination
- [ ] Implement storefront product detail API
- [ ] Implement product search (PostgreSQL full-text)
- [ ] Connect frontend `useProducts.ts` to real API
- [ ] Connect frontend `AdminProducts.tsx` to real API
- [ ] Connect frontend `AdminProductForm.tsx` to real API
- [ ] Remove `src/data/products.ts` hardcoded data
- [ ] **Test:** Create/edit/delete products via admin, verify storefront updates

### Phase 2: Categories, Brands, Industries (Day 8-10)

- [ ] Implement category CRUD API (admin) with tree structure
- [ ] Implement brand CRUD API (admin) with logo upload
- [ ] Implement industry CRUD API (admin)
- [ ] Implement storefront category/brand/industry list APIs
- [ ] Connect frontend `AdminCategories.tsx` to real API
- [ ] Connect frontend `AdminBrands.tsx` to real API
- [ ] Connect frontend `AdminIndustries.tsx` to real API
- [ ] Fix hardcoded brand filter in `Products.tsx` (line: `const brandSlugs = [...]`)
- [ ] Fix price range filter (remove $1000 cap)
- [ ] **Test:** CRUD operations on categories/brands/industries, verify storefront filters work

### Phase 3: Customer Auth & Cart (Day 11-14)

- [ ] Implement customer registration API
- [ ] Implement customer login/logout API
- [ ] Implement password reset flow
- [ ] Connect frontend `AuthModal.tsx` to real API
- [ ] Update `useStore.ts` auth state to use JWT (not localStorage)
- [ ] Implement server-side cart (optional: can keep localStorage Phase 1)
- [ ] Implement cart sync API (for logged-in users)
- [ ] Implement customer profile API
- [ ] **Test:** Register, login, logout, password reset

### Phase 4: Orders & Checkout (Day 15-20)

- [ ] Implement order creation API
- [ ] Implement Stripe integration (PaymentIntent creation)
- [ ] Implement Stripe webhook handler
- [ ] Implement order list/detail API (admin)
- [ ] Implement order status update API (admin)
- [ ] Implement order timeline API
- [ ] Implement tracking number update API
- [ ] Implement order cancellation API (customer + admin)
- [ ] Implement stock reduction on order confirmation
- [ ] Implement stock restoration on cancellation
- [ ] Connect frontend `Checkout.tsx` to real API
- [ ] Connect frontend `AdminOrders.tsx` to real API
- [ ] Implement order confirmation email
- [ ] Implement order status update emails
- [ ] Implement invoice PDF generation
- [ ] **Test:** Complete checkout flow, verify order appears in admin

### Phase 5: RFQ & Offers (Day 21-25)

- [ ] Implement RFQ submission API (public)
- [ ] Implement RFQ list/detail API (admin)
- [ ] Implement RFQ status update API
- [ ] Implement RFQ assignment API
- [ ] Implement RFQ notes API
- [ ] Implement RFQ response email
- [ ] Implement emergency RFQ priority handling
- [ ] Implement offer submission API (public)
- [ ] Implement offer list/detail API (admin)
- [ ] Implement offer accept/reject/counter API
- [ ] Implement offer-to-order conversion
- [ ] Implement offer expiry cron job
- [ ] Connect frontend `RFQ.tsx` to real API
- [ ] Connect frontend `AdminRFQs.tsx` to real API
- [ ] Connect frontend `AdminOffers.tsx` to real API
- [ ] Connect Make Offer modal in `ProductDetail.tsx` to real API
- [ ] **Test:** Submit RFQ → admin receives → responds → customer notified

### Phase 6: Contact, Emergency, Messages (Day 26-28)

- [ ] Implement contact form submission API
- [ ] Implement emergency request API (creates emergency RFQ)
- [ ] Implement contact message list/detail API (admin)
- [ ] Implement message status updates (read, archive, delete)
- [ ] Implement message reply API
- [ ] Connect frontend `Contact.tsx` to real API
- [ ] Connect frontend `Emergency.tsx` to real API
- [ ] Connect frontend `AdminMessages.tsx` to real API
- [ ] **Test:** Submit contact form → admin sees message → replies

### Phase 7: Customers, Media, Settings (Day 29-33)

- [ ] Implement customer list/detail API (admin)
- [ ] Implement customer order history API
- [ ] Implement customer status update API
- [ ] Connect frontend `AdminCustomers.tsx` to real API
- [ ] Implement media library API (upload, list, delete, usage check)
- [ ] Connect frontend `AdminMedia.tsx` to real API
- [ ] Implement store settings API (get/set)
- [ ] Implement shipping zones API
- [ ] Implement payment methods API
- [ ] Implement notification preferences API
- [ ] Connect frontend `AdminSettings.tsx` to real API
- [ ] Make storefront read settings from API (WhatsApp number, phone, email, etc.)
- [ ] **Test:** Update settings → storefront reflects changes immediately

### Phase 8: Homepage, Content, Dashboard (Day 34-37)

- [ ] Implement homepage sections API (get/update)
- [ ] Connect frontend `AdminHomepage.tsx` to real API
- [ ] Make homepage read sections from API
- [ ] Implement testimonials CRUD API
- [ ] Implement offices CRUD API
- [ ] Connect frontend `AdminDashboard.tsx` to real API
- [ ] Implement dashboard stats API (real counts, not hardcoded)
- [ ] Implement dashboard alerts API (low stock, missing images, overdue RFQs)
- [ ] Implement activity log API
- [ ] Import testimonials, offices, FAQs from `src/data/testimonials.ts`
- [ ] **Test:** Dashboard shows real stats, homepage reads from API

### Phase 9: Admin Users & Audit Log (Day 38-40)

- [ ] Implement admin user CRUD API (owner only)
- [ ] Implement role-based permission middleware
- [ ] Connect frontend `AdminUsers.tsx` to real API
- [ ] Implement audit log middleware (auto-log all admin actions)
- [ ] Implement audit log list API with filters
- [ ] Add audit logging to all admin CRUD operations
- [ ] **Test:** Create admin user with limited role → verify permissions

### Phase 10: Search, SEO, Polish (Day 41-45)

- [ ] Implement full search API across products, categories, pages
- [ ] Connect frontend `Search.tsx` to real API
- [ ] Connect `CommandSearch.tsx` to real API
- [ ] Implement per-page SEO meta tags API
- [ ] Add JSON-LD structured data for products
- [ ] Generate `sitemap.xml`
- [ ] Create `robots.txt`
- [ ] Add email templates for all notification types
- [ ] Implement email queue worker
- [ ] Add rate limiting middleware
- [ ] Add request logging
- [ ] **Test:** Search returns relevant results, SEO tags render correctly

### Phase 11: Testing & Deployment (Day 46-50)

- [ ] Write unit tests for all utility functions
- [ ] Write integration tests for all API endpoints
- [ ] Write tests for auth flow, order flow, RFQ flow
- [ ] Performance testing (load test product list API)
- [ ] Security audit (OWASP checklist)
- [ ] Set up production database
- [ ] Configure CI/CD pipeline
- [ ] Deploy backend to production
- [ ] Deploy frontend with real API URLs
- [ ] Verify all 16 admin pages work with real data
- [ ] Verify all 14 storefront pages work with real data
- [ ] Monitor error rates and performance

---

## 19. EDGE CASES & GOTCHAS <a name="19-edge-cases"></a>

### 19.1 Frontend Mismatches to Fix

| Issue | Location | Fix |
|-------|----------|-----|
| Brand filter hardcoded to 12 slugs | Products.tsx line 14 | Fetch brands from API |
| Price filter capped at $1000 | Products.tsx line 98 | Use max price from products |
| ProductCard not used in Products.tsx | Products.tsx (inline JSX) | Refactor to use shared ProductCard |
| Manual debounce instead of useDebounce hook | Products.tsx lines 55-66 | Use existing useDebounce hook |
| Admin roles mismatch (4 vs 6) | AdminUsers.tsx vs requirements | Use 6 roles from requirements |
| RFQ urgency mismatch (3 vs 4 levels) | RFQ.tsx vs AdminRFQs.tsx | Map standard→normal, urgent→high, emergency→critical |
| `font-extrabold` on Space Grotesk elements | Multiple TSX files | Already fixed (changed to font-bold) |
| DM Sans only loads weights 400-700 | index.css Google Fonts import | Already fixed (expanded to 400-900) |
| style.css was dead code | style.css | Already deleted |

### 19.2 Data Consistency Issues

- Products reference images that don't exist (134-255) — migration must handle gracefully
- `Product.filename` not in TypeScript interface — add `filename?: string` to Product type
- Product specs all empty `{}` — migration should create placeholder specs or skip
- `getProductSpecs()` in ProductDetail generates fake data — remove after real specs exist
- `enrichProduct()` in products.ts generates fake data — remove after migration

### 19.3 Business Logic Gotchas

- **Sale price validation:** Must be lower than regular price
- **Stock atomicity:** Use database transactions for stock updates
- **Concurrent orders:** Two customers ordering last item → race condition
- **Currency handling:** Store all prices in USD, convert display only
- **Timezone:** All dates stored as UTC, convert for display
- **Order number uniqueness:** Use database sequence, not random
- **RFQ number uniqueness:** Use database sequence
- **Image deletion:** Check all product references before deleting
- **Category deletion:** Check for products in category + children
- **Brand deletion:** Check for products with that brand
- **Offer expiry:** Cron job to mark expired offers daily
- **Low stock alert:** Check after every order + stock update
- **Missing image detection:** Periodic scan of product_images vs storage

### 19.4 Multilingual Support

- Product names, descriptions should have optional `name_ar`, `name_es`, `description_ar`, `description_es` fields
- Category names should have translation fields
- Brand descriptions should have translation fields
- Industry descriptions should have translation fields
- UI strings already handled by i18next (en.json, ar.json, es.json)
- RTL support: CSS `[dir="rtl"]` rules needed
- Arabic text can be 30% longer than English — UI must accommodate

### 19.5 WhatsApp Integration

The frontend hardcodes `wa.me/919726900547` in 6+ files. Backend should:
- Store WhatsApp number in `store_settings`
- Provide API endpoint to get public contact info
- Frontend should fetch and use dynamic number
- Consider WhatsApp Business API for automated responses to RFQs

---

## APPENDIX A: COMPLETE FILE INVENTORY

Every file that needs changes when the backend is built:

### Files to DELETE (after migration)
- `src/data/products.ts` (replaced by API)
- `src/data/brands.ts` (replaced by API)
- `src/data/industries.ts` (replaced by API)
- `src/data/testimonials.ts` (replaced by API)
- `src/data/brandImages.ts` (replaced by API)
- `style.css` (already deleted)

### Files to MODIFY (connect to API)
- `src/store/useStore.ts` — Replace localStorage with API calls
- `src/hooks/useProducts.ts` — Fetch from API instead of static import
- `src/hooks/useAddToCart.ts` — Add API sync option
- `src/hooks/useAdminDashboard.ts` — Fetch real stats
- `src/pages/Home.tsx` — Fetch featured products, testimonials from API
- `src/pages/Products.tsx` — Fetch from API, fix brand filter, fix price cap
- `src/pages/ProductDetail.tsx` — Fetch from API, remove fake specs
- `src/pages/Shop.tsx` — Fetch from API
- `src/pages/Checkout.tsx` — Submit orders to API, real payment
- `src/pages/RFQ.tsx` — Submit RFQs to API
- `src/pages/Contact.tsx` — Submit to API
- `src/pages/Emergency.tsx` — Submit to API
- `src/pages/Search.tsx` — Search via API
- `src/pages/Brands.tsx` — Fetch from API
- `src/pages/Industries.tsx` — Fetch from API
- `src/pages/admin/AdminDashboard.tsx` — Fetch real stats
- `src/pages/admin/AdminProducts.tsx` — Fetch from API
- `src/pages/admin/AdminProductForm.tsx` — Submit to API
- `src/pages/admin/AdminOrders.tsx` — Fetch from API
- `src/pages/admin/AdminRFQs.tsx` — Fetch from API
- `src/pages/admin/AdminOffers.tsx` — Fetch from API
- `src/pages/admin/AdminCustomers.tsx` — Fetch from API
- `src/pages/admin/AdminMessages.tsx` — Fetch from API
- `src/pages/admin/AdminSettings.tsx` — Fetch/save via API
- `src/pages/admin/AdminHomepage.tsx` — Fetch/save via API
- `src/pages/admin/AdminCategories.tsx` — Fetch from API
- `src/pages/admin/AdminBrands.tsx` — Fetch from API
- `src/pages/admin/AdminIndustries.tsx` — Fetch from API
- `src/pages/admin/AdminMedia.tsx` — Upload to API
- `src/pages/admin/AdminUsers.tsx` — Fetch from API
- `src/pages/admin/AdminLogin.tsx` — Use real auth API
- `src/components/sections/Hero.tsx` — Fetch hero config from API
- `src/components/sections/FeaturedProducts.tsx` — Fetch from API
- `src/components/sections/CategoriesGrid.tsx` — Fetch from API
- `src/components/sections/IndustriesTabs.tsx` — Fetch from API
- `src/components/sections/Testimonials.tsx` — Fetch from API
- `src/components/sections/RFQSection.tsx` — Fetch from API
- `src/components/sections/BrandsMarquee.tsx` — Fetch from API
- `src/components/sections/StatsBar.tsx` — Fetch from API
- `src/components/auth/AuthModal.tsx` — Use real auth API
- `src/components/cart/CartDrawer.tsx` — Optionally sync to API
- `src/components/layout/Navbar.tsx` — Fetch settings for dynamic content
- `src/components/layout/Footer.tsx` — Fetch settings for dynamic content
- `src/components/admin/AdminGuard.tsx` — Use JWT validation
- `src/types/index.ts` — Add missing fields (filename, etc.)

### Files to CREATE (new backend code)
- `backend/` — Complete Express backend project
- `backend/prisma/schema.prisma` — Database schema
- `backend/src/server.ts` — Entry point
- `backend/src/routes/` — All API route files
- `backend/src/middleware/` — Auth, validation, error handling
- `backend/src/services/` — Business logic
- `backend/src/utils/` — Helpers
- `backend/src/templates/` — Email templates
- `backend/prisma/seed.ts` — Seed script
- `backend/scripts/migrate-data.ts` — Data migration script

---

*This document is the complete, exhaustive blueprint for building the Alka Traders backend. Every data shape, every API endpoint, every database column, every workflow, every edge case, and every security requirement has been documented. After implementing all tasks in Phase 0-11, the frontend will be fully functional with real data, real auth, real payments, and real admin management.*
