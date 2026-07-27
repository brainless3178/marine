-- ============================================================================
-- ALKA TRADERS — MEGA SETUP SQL
-- ============================================================================
-- SINGLE FILE: Schema + Seed Data
-- Run this ONCE to set up the entire database from scratch.
--
-- Admin Login:  admin@alkatraders.com / admin123
-- Customer Login: customer@alkatraders.com / customer123
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. DROP EXISTING TABLES (clean slate)
-- ============================================================================
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS homepage_sections CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;
DROP TABLE IF EXISTS emergency_requests CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS rfq_notes CASCADE;
DROP TABLE IF EXISTS rfq_items CASCADE;
DROP TABLE IF EXISTS rfqs CASCADE;
DROP TABLE IF EXISTS order_timeline CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_industries CASCADE;
DROP TABLE IF EXISTS product_specs CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Drop views
DROP VIEW IF EXISTS v_product_health CASCADE;
DROP VIEW IF EXISTS v_order_summary CASCADE;
DROP VIEW IF EXISTS v_rfq_pipeline CASCADE;
DROP VIEW IF EXISTS v_monthly_revenue CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- 2. ADMIN USERS
-- ============================================================================
CREATE TABLE admin_users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'viewer',
    avatar_url    TEXT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- ============================================================================
-- 3. CUSTOMERS
-- ============================================================================
CREATE TABLE customers (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(255) NOT NULL,
    phone          VARCHAR(50),
    company        VARCHAR(255),
    country        VARCHAR(100),
    city           VARCHAR(100),
    address        TEXT,
    website        VARCHAR(255),
    status         VARCHAR(20)  NOT NULL DEFAULT 'active',
    tags           TEXT[]       DEFAULT '{}',
    internal_notes TEXT,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_country ON customers(country);

-- ============================================================================
-- 4. CATEGORIES
-- ============================================================================
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon            VARCHAR(100),
    seo_title       VARCHAR(255),
    seo_description TEXT,
    sort_order      INT          NOT NULL DEFAULT 0,
    is_visible      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- ============================================================================
-- 5. BRANDS
-- ============================================================================
CREATE TABLE brands (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    logo_url        TEXT,
    sectors         TEXT[]       DEFAULT '{}',
    description     TEXT,
    website         VARCHAR(255),
    country         VARCHAR(100),
    seo_title       VARCHAR(255),
    seo_description TEXT,
    is_visible      BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_sort ON brands(sort_order);

-- ============================================================================
-- 6. INDUSTRIES
-- ============================================================================
CREATE TABLE industries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    icon            VARCHAR(100),
    description     TEXT,
    pain_points     TEXT[]       DEFAULT '{}',
    seo_title       VARCHAR(255),
    seo_description TEXT,
    sort_order      INT          NOT NULL DEFAULT 0,
    is_visible      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_industries_slug ON industries(slug);

-- ============================================================================
-- 7. PRODUCTS
-- ============================================================================
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                VARCHAR(255) NOT NULL UNIQUE,
    name                VARCHAR(500) NOT NULL,
    sku                 VARCHAR(100) NOT NULL UNIQUE,
    brand_id            UUID REFERENCES brands(id) ON DELETE SET NULL,
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'draft',
    availability        VARCHAR(20)  NOT NULL DEFAULT 'in-stock',
    condition           VARCHAR(30)  NOT NULL DEFAULT 'used',
    short_description   TEXT,
    description         TEXT,
    regular_price       DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price          DECIMAL(12,2),
    sale_starts_at      TIMESTAMPTZ,
    sale_ends_at        TIMESTAMPTZ,
    currency            VARCHAR(3)   NOT NULL DEFAULT 'USD',
    show_price          BOOLEAN      NOT NULL DEFAULT TRUE,
    make_offer_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    minimum_offer_price DECIMAL(12,2),
    stock_count         INT          NOT NULL DEFAULT 0,
    low_stock_threshold INT          NOT NULL DEFAULT 10,
    warehouse_location  VARCHAR(255),
    public_item_location VARCHAR(255),
    lead_time           VARCHAR(100),
    is_new_arrival      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_featured         BOOLEAN      NOT NULL DEFAULT FALSE,
    custom_label        VARCHAR(100),
    custom_label_color  VARCHAR(20),
    sort_priority       INT          NOT NULL DEFAULT 0,
    seo_title           VARCHAR(255),
    seo_description     TEXT,
    seo_keywords        TEXT,
    og_image_url        TEXT,
    canonical_url       TEXT,
    internal_notes      TEXT,
    purchase_cost       DECIMAL(12,2),
    supplier_reference  VARCHAR(255),
    product_type        VARCHAR(30)  NOT NULL DEFAULT 'physical',
    key_features        TEXT[]       DEFAULT '{}',
    compatibility_notes TEXT,
    condition_notes     TEXT,
    warranty_notes      TEXT,
    included_items      TEXT[]       DEFAULT '{}',
    excluded_items      TEXT[]       DEFAULT '{}',
    legacy_id           VARCHAR(50),
    created_by          UUID REFERENCES admin_users(id),
    updated_by          UUID REFERENCES admin_users(id),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_availability ON products(availability);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = TRUE;
CREATE INDEX idx_products_stock ON products(stock_count);
CREATE INDEX idx_products_sort ON products(sort_priority DESC, created_at DESC);

-- ============================================================================
-- 8. PRODUCT IMAGES
-- ============================================================================
CREATE TABLE product_images (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_asset_id UUID,
    url            TEXT NOT NULL,
    alt_text       VARCHAR(500),
    label          VARCHAR(100),
    sort_order     INT          NOT NULL DEFAULT 0,
    is_main        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================================================
-- 9. PRODUCT SPECIFICATIONS
-- ============================================================================
CREATE TABLE product_specs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    value      TEXT NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    is_public  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_specs_product ON product_specs(product_id);

-- ============================================================================
-- 10. PRODUCT INDUSTRIES (Many-to-Many)
-- ============================================================================
CREATE TABLE product_industries (
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    industry_id  UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, industry_id)
);

CREATE INDEX idx_product_industries_industry ON product_industries(industry_id);

-- ============================================================================
-- 11. ORDERS
-- ============================================================================
CREATE TABLE orders (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number             VARCHAR(50)  NOT NULL UNIQUE,
    customer_id              UUID REFERENCES customers(id) ON DELETE SET NULL,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'pending',
    payment_method           VARCHAR(50),
    payment_status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
    payment_intent_id        VARCHAR(255),
    subtotal                 DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_cost            DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax                      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total                    DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency                 VARCHAR(3)   NOT NULL DEFAULT 'USD',
    shipping_full_name       VARCHAR(255),
    shipping_address_line1   VARCHAR(255),
    shipping_address_line2   VARCHAR(255),
    shipping_city            VARCHAR(100),
    shipping_state           VARCHAR(100),
    shipping_postal_code     VARCHAR(20),
    shipping_country         VARCHAR(100),
    tracking_number          VARCHAR(100),
    courier                  VARCHAR(100),
    customer_notes           TEXT,
    admin_notes              TEXT,
    cancel_requested         BOOLEAN      NOT NULL DEFAULT FALSE,
    cancel_reason            TEXT,
    cancel_requested_at      TIMESTAMPTZ,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- ============================================================================
-- 12. ORDER ITEMS
-- ============================================================================
CREATE TABLE order_items (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(500) NOT NULL,
    product_sku  VARCHAR(100),
    quantity     INT          NOT NULL DEFAULT 1,
    unit_price   DECIMAL(12,2) NOT NULL,
    total_price  DECIMAL(12,2) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================================================
-- 13. ORDER TIMELINE
-- ============================================================================
CREATE TABLE order_timeline (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL,
    note       TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_timeline_order ON order_timeline(order_id);

-- ============================================================================
-- 14. RFQ (Request for Quote)
-- ============================================================================
CREATE TABLE rfqs (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_number         VARCHAR(50)  NOT NULL UNIQUE,
    customer_id        UUID REFERENCES customers(id) ON DELETE SET NULL,
    full_name          VARCHAR(255) NOT NULL,
    company            VARCHAR(255),
    email              VARCHAR(255) NOT NULL,
    phone              VARCHAR(50),
    country            VARCHAR(100),
    role               VARCHAR(100),
    product_description TEXT NOT NULL,
    part_number        VARCHAR(255),
    brand              VARCHAR(255),
    quantity           INT          NOT NULL DEFAULT 1,
    delivery_location  VARCHAR(255),
    urgency            VARCHAR(20)  NOT NULL DEFAULT 'standard',
    status             VARCHAR(30)  NOT NULL DEFAULT 'new',
    assigned_to        UUID REFERENCES admin_users(id),
    source             VARCHAR(50),
    consent            BOOLEAN      NOT NULL DEFAULT FALSE,
    response_deadline  TIMESTAMPTZ,
    first_response_at  TIMESTAMPTZ,
    internal_notes     TEXT,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfqs_urgency ON rfqs(urgency);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_created ON rfqs(created_at DESC);

-- ============================================================================
-- 15. RFQ ITEMS
-- ============================================================================
CREATE TABLE rfq_items (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id       UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    product_name VARCHAR(500) NOT NULL,
    quantity     INT          NOT NULL DEFAULT 1,
    unit         VARCHAR(50),
    notes        TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfq_items_rfq ON rfq_items(rfq_id);

-- ============================================================================
-- 16. RFQ NOTES
-- ============================================================================
CREATE TABLE rfq_notes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    author_id   UUID REFERENCES admin_users(id),
    note        TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 17. OFFERS (Make an Offer)
-- ============================================================================
CREATE TABLE offers (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_number   VARCHAR(50)  NOT NULL UNIQUE,
    product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
    rfq_id         UUID REFERENCES rfqs(id) ON DELETE SET NULL,
    customer_id    UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    offered_price  DECIMAL(12,2) NOT NULL,
    quantity       INT          NOT NULL DEFAULT 1,
    message        TEXT,
    status         VARCHAR(20)  NOT NULL DEFAULT 'pending',
    counter_price  DECIMAL(12,2),
    admin_notes    TEXT,
    expires_at     TIMESTAMPTZ,
    responded_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_product ON offers(product_id);

-- ============================================================================
-- 18. CONTACT MESSAGES
-- ============================================================================
CREATE TABLE contact_messages (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    subject        VARCHAR(500),
    message        TEXT NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'new',
    assigned_to    UUID REFERENCES admin_users(id),
    internal_notes TEXT,
    source         VARCHAR(50)  NOT NULL DEFAULT 'contact-form',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_messages_status ON contact_messages(status);

-- ============================================================================
-- 19. EMERGENCY REQUESTS
-- ============================================================================
CREATE TABLE emergency_requests (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(255) NOT NULL,
    phone            VARCHAR(50)  NOT NULL,
    part_description TEXT NOT NULL,
    vessel_name      VARCHAR(255),
    rfq_id           UUID REFERENCES rfqs(id) ON DELETE SET NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'new',
    contacted_at     TIMESTAMPTZ,
    resolved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 20. MEDIA ASSETS
-- ============================================================================
CREATE TABLE media_assets (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename      VARCHAR(500) NOT NULL,
    original_name VARCHAR(500),
    url           TEXT NOT NULL,
    thumbnail_url TEXT,
    mime_type     VARCHAR(100),
    file_size     INT,
    width         INT,
    height        INT,
    alt_text      VARCHAR(500),
    label         VARCHAR(100),
    hash          VARCHAR(64),
    uploaded_by   UUID REFERENCES admin_users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_assets_hash ON media_assets(hash);

-- ============================================================================
-- 21. TESTIMONIALS
-- ============================================================================
CREATE TABLE testimonials (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    role       VARCHAR(255),
    company    VARCHAR(255),
    avatar_url TEXT,
    text       TEXT NOT NULL,
    rating     INT          NOT NULL DEFAULT 5,
    sort_order INT          NOT NULL DEFAULT 0,
    is_visible BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 22. OFFICES
-- ============================================================================
CREATE TABLE offices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city            VARCHAR(255) NOT NULL,
    country         VARCHAR(255) NOT NULL,
    address         TEXT,
    timezone        VARCHAR(100),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    coordinates_lat  DECIMAL(10,7),
    coordinates_lng  DECIMAL(10,7),
    sort_order      INT          NOT NULL DEFAULT 0,
    is_visible      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 23. STORE SETTINGS
-- ============================================================================
CREATE TABLE store_settings (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key        VARCHAR(255) NOT NULL UNIQUE,
    value      JSONB NOT NULL,
    category   VARCHAR(100),
    updated_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_store_settings_key ON store_settings(key);

-- ============================================================================
-- 24. HOMEPAGE SECTIONS
-- ============================================================================
CREATE TABLE homepage_sections (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_type VARCHAR(50)  NOT NULL,
    label        VARCHAR(255) NOT NULL,
    is_enabled   BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order   INT          NOT NULL DEFAULT 0,
    config       JSONB        NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 25. AUDIT LOG
-- ============================================================================
CREATE TABLE audit_logs (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id       UUID REFERENCES admin_users(id),
    actor_email    VARCHAR(255),
    action         VARCHAR(100) NOT NULL,
    entity_type    VARCHAR(100) NOT NULL,
    entity_id      UUID,
    entity_name    VARCHAR(255),
    previous_value JSONB,
    new_value      JSONB,
    ip_address     INET,
    user_agent     TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- 26. EMAIL QUEUE
-- ============================================================================
CREATE TABLE email_queue (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email      VARCHAR(255) NOT NULL,
    to_name       VARCHAR(255),
    subject       VARCHAR(500) NOT NULL,
    html_body     TEXT NOT NULL,
    text_body     TEXT,
    template      VARCHAR(100),
    template_data JSONB,
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
    attempts      INT          NOT NULL DEFAULT 0,
    max_attempts  INT          NOT NULL DEFAULT 3,
    last_error    TEXT,
    sent_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);

-- ============================================================================
-- 27. WEBHOOK LOGS
-- ============================================================================
CREATE TABLE webhook_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source     VARCHAR(50)  NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload    JSONB,
    status     VARCHAR(20)  NOT NULL DEFAULT 'received',
    error      TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS: Auto-update `updated_at` columns
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admin_users_updated    BEFORE UPDATE ON admin_users    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated      BEFORE UPDATE ON customers      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_categories_updated     BEFORE UPDATE ON categories     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_brands_updated         BEFORE UPDATE ON brands         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_industries_updated     BEFORE UPDATE ON industries     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated       BEFORE UPDATE ON products       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orders_updated         BEFORE UPDATE ON orders         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_rfqs_updated           BEFORE UPDATE ON rfqs           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_offers_updated         BEFORE UPDATE ON offers         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_contact_messages_updated BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_store_settings_updated BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_homepage_sections_updated BEFORE UPDATE ON homepage_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW v_product_health AS
SELECT
    p.id, p.name, p.sku, p.status, p.availability, p.stock_count,
    p.low_stock_threshold, b.name AS brand_name, c.name AS category_name,
    CASE
        WHEN p.stock_count = 0 THEN 'out-of-stock'
        WHEN p.stock_count <= p.low_stock_threshold THEN 'low-stock'
        ELSE 'healthy'
    END AS stock_health,
    (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) AS image_count,
    p.created_at, p.updated_at
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status != 'archived';

CREATE OR REPLACE VIEW v_order_summary AS
SELECT
    o.id, o.order_number, o.status, o.payment_status, o.total, o.currency,
    c.name AS customer_name, c.email AS customer_email,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
    o.tracking_number, o.created_at, o.updated_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS order_count,
    SUM(total) AS revenue,
    AVG(total) AS avg_order_value
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================================================
-- ============================================================================
--
--                    SEED DATA STARTS HERE
--
-- ============================================================================
-- ============================================================================

-- ============================================================================
-- S0. USERS
-- ============================================================================
-- Admin: admin@alkatraders.com / admin123
INSERT INTO admin_users (id, email, password_hash, name, role, is_active)
VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'admin@alkatraders.com',
    '$2b$12$UtNaVqpn/YUv/EHSuC/zD.4.JHBV0aKM4SN5KgvYcaljwwlTAJKjK',
    'Store Owner',
    'owner',
    TRUE
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Test Customer: customer@alkatraders.com / customer123
INSERT INTO customers (id, email, password_hash, name, phone, company, country, status)
VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'customer@alkatraders.com',
    '$2b$12$6q5Vgt7golk5tlL7HrcO4O8z2XT0WrFOUGAjvCNBKOzASaiP/sYHq',
    'Test Customer',
    '+1 555 123 4567',
    'Test Company Inc.',
    'United States',
    'active'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name;

-- ============================================================================
-- S1. CATEGORIES (19)
-- ============================================================================
INSERT INTO categories (id, name, slug, icon, sort_order, is_visible) VALUES
('c0000001-0000-4000-8000-000000000001', 'Marine Equipment',        'marine',             'Ship',            0,  TRUE),
('c0000002-0000-4000-8000-000000000002', 'Electrical Automation',   'electrical',         'Zap',             1,  TRUE),
('c0000003-0000-4000-8000-000000000003', 'Hydraulic Systems',       'hydraulic',          'Droplet',         2,  TRUE),
('c0000004-0000-4000-8000-000000000004', 'Pneumatic Systems',       'pneumatic',          'Wind',            3,  TRUE),
('c0000005-0000-4000-8000-000000000005', 'Industrial Spare Parts',  'spares',             'Settings',        4,  TRUE),
('c0000006-0000-4000-8000-000000000006', 'Surplus Inventory',       'surplus',            'Warehouse',       5,  TRUE),
('c0000007-0000-4000-8000-000000000007', 'Lifting & Handling',      'lifting-handling',   'ArrowUpFromLine', 6,  TRUE),
('c0000008-0000-4000-8000-000000000008', 'Tools & Equipment',       'tools-equipment',    'Wrench',          7,  TRUE),
('c0000009-0000-4000-8000-000000000009', 'Safety Equipment',        'safety',             'ShieldCheck',     8,  TRUE),
('c0000010-0000-4000-8000-000000000010', 'Hand Tools',              'hand-tools',         'Hammer',          9,  TRUE),
('c0000011-0000-4000-8000-000000000011', 'Ship Navigation',         'ship-navigation',    'Compass',         10, TRUE),
('c0000012-0000-4000-8000-000000000012', 'Marine Pumps',            'marine-pumps',       'Droplets',        11, TRUE),
('c0000013-0000-4000-8000-000000000013', 'Engine Spare Parts',      'engine-spare',       'Cog',             12, TRUE),
('c0000014-0000-4000-8000-000000000014', 'Engine Parts',            'engine-parts',       'Cog',             13, TRUE),
('c0000015-0000-4000-8000-000000000015', 'Motors & Components',     'motor-components',   'Zap',             14, TRUE),
('c0000016-0000-4000-8000-000000000016', 'Ship Machinery',          'ship-machinery',     'Ship',            15, TRUE),
('c0000017-0000-4000-8000-000000000017', 'Hydraulic Pumps',         'hydraulic-pumps',    'Droplet',         16, TRUE),
('c0000018-0000-4000-8000-000000000018', 'Rigging & Lashing',       'rigging',            'Anchor',          17, TRUE),
('c0000019-0000-4000-8000-000000000019', 'Other Business & Industrial', 'other-business', 'Package',         18, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- S2. BRANDS (22 core)
-- ============================================================================
INSERT INTO brands (id, name, slug, sectors, sort_order, is_visible) VALUES
('b0000001-0000-4000-8000-000000000001', 'ABB',              'abb',              ARRAY['Marine','Industrial','Automation'],       0,  TRUE),
('b0000002-0000-4000-8000-000000000002', 'Siemens',          'siemens',          ARRAY['Marine','Industrial','Automation'],       1,  TRUE),
('b0000003-0000-4000-8000-000000000003', 'Parker Hannifin',  'parker',           ARRAY['Marine','Industrial','Hydraulic'],        2,  TRUE),
('b0000004-0000-4000-8000-000000000004', 'Bosch Rexroth',    'bosch-rexroth',    ARRAY['Industrial','Hydraulic','Automation'],    3,  TRUE),
('b0000005-0000-4000-8000-000000000005', 'Schneider Electric','schneider',       ARRAY['Industrial','Automation'],                4,  TRUE),
('b0000006-0000-4000-8000-000000000006', 'Danfoss',          'danfoss',          ARRAY['Marine','Industrial'],                    5,  TRUE),
('b0000007-0000-4000-8000-000000000007', 'Honeywell',        'honeywell',        ARRAY['Marine','Industrial','Automation'],       6,  TRUE),
('b0000008-0000-4000-8000-000000000008', 'Emerson',          'emerson',          ARRAY['Industrial','Automation'],                7,  TRUE),
('b0000009-0000-4000-8000-000000000009', 'Festo',            'festo',            ARRAY['Industrial','Pneumatic'],                 8,  TRUE),
('b0000010-0000-4000-8000-000000000010', 'SMC',              'smc',              ARRAY['Industrial','Pneumatic'],                 9,  TRUE),
('b0000011-0000-4000-8000-000000000011', 'Grundfos',         'grundfos',         ARRAY['Marine','Industrial'],                    10, TRUE),
('b0000012-0000-4000-8000-000000000012', 'Atlas Copco',      'atlas-copco',      ARRAY['Industrial','Pneumatic'],                 11, TRUE),
('b0000013-0000-4000-8000-000000000013', 'Wartsila',         'wartsila',         ARRAY['Marine'],                                12, TRUE),
('b0000014-0000-4000-8000-000000000014', 'Alfa Laval',       'alfa-laval',       ARRAY['Marine','Industrial'],                    13, TRUE),
('b0000015-0000-4000-8000-000000000015', 'Kongsberg',        'kongsberg',        ARRAY['Marine'],                                14, TRUE),
('b0000016-0000-4000-8000-000000000016', 'SKF',              'skf',              ARRAY['Industrial'],                             15, TRUE),
('b0000017-0000-4000-8000-000000000017', 'IFM',              'ifm',              ARRAY['Industrial','Automation'],                16, TRUE),
('b0000018-0000-4000-8000-000000000018', 'Pepperl+Fuchs',    'pepperl-fuchs',    ARRAY['Industrial','Automation'],                17, TRUE),
('b0000019-0000-4000-8000-000000000019', 'Sick AG',          'sick',             ARRAY['Industrial','Automation'],                18, TRUE),
('b0000020-0000-4000-8000-000000000020', 'Omron',            'omron',            ARRAY['Industrial','Automation'],                19, TRUE),
('b0000021-0000-4000-8000-000000000021', 'Phoenix Contact',  'phoenix-contact',  ARRAY['Industrial','Automation'],                20, TRUE),
('b0000022-0000-4000-8000-000000000022', 'Rittal',           'rittal',           ARRAY['Industrial'],                             21, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- S3. INDUSTRIES (6)
-- ============================================================================
INSERT INTO industries (id, name, slug, icon, description, pain_points, sort_order, is_visible) VALUES
('10000001-0000-4000-8000-000000000001', 'Marine Shipping',       'marine-shipping',      'Ship',
 'Vessel fleet operators and ship managers trust Alka Traders for urgent OEM spare parts.',
 ARRAY['Critical equipment failure mid-voyage','Long lead times from OEMs','Inconsistent quality from unauthorized parts'], 0, TRUE),
('10000002-0000-4000-8000-000000000002', 'Shipyards & Drydocks',  'shipyards',           'Anchor',
 'Drydock and repair facilities rely on our broad inventory.',
 ARRAY['Tight drydock schedules','Bulk sourcing coordination','Hydraulic system integration'], 1, TRUE),
('10000003-0000-4000-8000-000000000003', 'Oil & Gas',              'oil-gas',             'Flame',
 'Upstream and downstream operators trust our certified stock.',
 ARRAY['ATEX/IECEx certification requirements','Remote offshore locations','Emergency shutdown failures'], 2, TRUE),
('10000004-0000-4000-8000-000000000004', 'Power Generation',      'power-generation',    'Zap',
 'Power plant procurement teams source turbine components and switchgear.',
 ARRAY['Aging infrastructure','Grid compliance','Seasonal peak demand'], 3, TRUE),
('10000005-0000-4000-8000-000000000005', 'Manufacturing',         'manufacturing',       'Factory',
 'Production line managers reduce downtime by sourcing automation components.',
 ARRAY['Line stoppage costs','Obsolescence management','MRO inventory balancing'], 4, TRUE),
('10000006-0000-4000-8000-000000000006', 'Chemical Processing',   'chemical-processing', 'FlaskConical',
 'Chemical plant procurement requires compliance-grade sourcing.',
 ARRAY['SIL certification documentation','Corrosion-resistant specifications','Batch production schedules'], 5, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- S4. PRODUCTS (28 sample products)
-- ============================================================================
INSERT INTO products (id, slug, name, sku, brand_id, category_id, status, availability, condition, description, regular_price, stock_count, make_offer_enabled, is_new_arrival, is_featured, legacy_id, created_by, updated_by) VALUES
('50000001-0000-4000-8000-000000000001', 'gps-nav-3200',   'Marine GPS Navigator',          'GPS-NAV-3200',    'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'reconditioned', 'Marine GPS Navigator — marine & industrial equipment. SKU: GPS-NAV-3200.', 3200, 11, TRUE, FALSE, TRUE, 'prod-001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000002-0000-4000-8000-000000000002', 'dcm-450-pk',     'Deck Crane Hydraulic Motor',    'DCM-450-PK',      'b0000003-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'used',          'Deck Crane Hydraulic Motor — marine & industrial equipment. SKU: DCM-450-PK.', 4500, 5, TRUE, FALSE, TRUE, 'prod-002', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000003-0000-4000-8000-000000000003', 'vhf-7800-sm',    'VHF Marine Radio',              'VHF-7800-SM',     'b0000002-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'new',           'VHF Marine Radio — marine & industrial equipment. SKU: VHF-7800-SM.', 1800, 8, TRUE, FALSE, FALSE, 'prod-003', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000004-0000-4000-8000-000000000004', 'rad-ant-220',    'Radar Antenna Unit',            'RAD-ANT-220',     'b0000007-0000-4000-8000-000000000007', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'refurbished',   'Radar Antenna Unit — marine & industrial equipment. SKU: RAD-ANT-220.', 5600, 3, TRUE, FALSE, FALSE, 'prod-004', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000005-0000-4000-8000-000000000005', 'ecdis-9600',     'ECDIS Navigation Display',      'ECDIS-9600',      'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'published', 'emergency',   'unused',        'ECDIS Navigation Display — marine & industrial equipment. SKU: ECDIS-9600.', 8900, 1, TRUE, FALSE, TRUE, 'prod-005', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000006-0000-4000-8000-000000000006', 'mds-sens-44',    'Marine Diesel Engine Sensor',   'MDS-SENS-44',     'b0000004-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'reconditioned', 'Marine Diesel Engine Sensor — marine & industrial equipment. SKU: MDS-SENS-44.', 1500, 7, TRUE, FALSE, FALSE, 'prod-006', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000007-0000-4000-8000-000000000007', 'lrm-2200-sm',    'Lifeboat Release Mechanism',    'LRM-2200-SM',     'b0000002-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001', 'published', 'emergency',   'used',          'Lifeboat Release Mechanism — marine & industrial equipment. SKU: LRM-2200-SM.', 6200, 1, TRUE, FALSE, FALSE, 'prod-007', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000008-0000-4000-8000-000000000008', 'awm-550-ab',     'Anchor Windlass Motor',         'AWM-550-AB',      'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'new',           'Anchor Windlass Motor — marine & industrial equipment. SKU: AWM-550-AB.', 7800, 4, TRUE, FALSE, TRUE, 'prod-008', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000009-0000-4000-8000-000000000009', 'bws-150-df',     'Bilge Water Separator',         'BWS-150-DF',      'b0000006-0000-4000-8000-000000000006', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'refurbished',   'Bilge Water Separator — marine & industrial equipment. SKU: BWS-150-DF.', 3400, 6, TRUE, FALSE, FALSE, 'prod-009', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000010-0000-4000-8000-000000000010', 'megm-880',       'Marine Exhaust Gas Monitor',    'MEGM-880',        'b0000008-0000-4000-8000-000000000008', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'unused',        'Marine Exhaust Gas Monitor — marine & industrial equipment. SKU: MEGM-880.', 4100, 9, TRUE, FALSE, FALSE, 'prod-010', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000011-0000-4000-8000-000000000011', 'btp-3200-se',    'Bow Thruster Control Panel',    'BTP-3200-SE',     'b0000005-0000-4000-8000-000000000005', 'c0000001-0000-4000-8000-000000000001', 'published', 'emergency',   'reconditioned', 'Bow Thruster Control Panel — marine & industrial equipment. SKU: BTP-3200-SE.', 5500, 1, TRUE, FALSE, FALSE, 'prod-011', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000012-0000-4000-8000-000000000012', 'mfd-9000',       'Marine Fire Detection System',  'MFD-9000',        'b0000007-0000-4000-8000-000000000007', 'c0000001-0000-4000-8000-000000000001', 'published', 'emergency',   'used',          'Marine Fire Detection System — marine & industrial equipment. SKU: MFD-9000.', 9200, 1, TRUE, FALSE, TRUE, 'prod-012', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000013-0000-4000-8000-000000000013', 'hhc-600-pk',     'Hatch Cover Hydraulic Cylinder','HHC-600-PK',      'b0000003-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'new',           'Hatch Cover Hydraulic Cylinder — marine & industrial equipment. SKU: HHC-600-PK.', 2800, 10, TRUE, TRUE, FALSE, 'prod-013', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000014-0000-4000-8000-000000000014', 'mbp-250-gf',     'Marine Ballast Pump',           'MBP-250-GF',      'b0000011-0000-4000-8000-000000000011', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'refurbished',   'Marine Ballast Pump — marine & industrial equipment. SKU: MBP-250-GF.', 4200, 3, TRUE, FALSE, FALSE, 'prod-014', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000015-0000-4000-8000-000000000015', 'sga-400-br',     'Steering Gear Actuator',        'SGA-400-BR',      'b0000004-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000001', 'published', 'emergency',   'unused',        'Steering Gear Actuator — marine & industrial equipment. SKU: SGA-400-BR.', 6700, 1, TRUE, FALSE, FALSE, 'prod-015', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000016-0000-4000-8000-000000000016', 'ams-7700',       'Marine Alarm Monitoring System', 'AMS-7700',        'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'reconditioned', 'Marine Alarm Monitoring System — marine & industrial equipment. SKU: AMS-7700.', 5100, 5, TRUE, FALSE, FALSE, 'prod-016', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000017-0000-4000-8000-000000000017', 'dfl-led-300',    'Deck Floodlight LED',           'DFL-LED-300',     'b0000005-0000-4000-8000-000000000005', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'used',          'Deck Floodlight LED — marine & industrial equipment. SKU: DFL-LED-300.', 800, 12, TRUE, FALSE, FALSE, 'prod-017', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000018-0000-4000-8000-000000000018', 'mac-500-ac',     'Marine Air Compressor',         'MAC-500-AC',      'b0000012-0000-4000-8000-000000000012', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'new',           'Marine Air Compressor — marine & industrial equipment. SKU: MAC-500-AC.', 8500, 2, TRUE, FALSE, TRUE, 'prod-018', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000019-0000-4000-8000-000000000019', 'sbas-100-sm',    'Ship Bell Alarm System',        'SBAS-100-SM',     'b0000002-0000-4000-8000-000000000002', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'refurbished',   'Ship Bell Alarm System — marine & industrial equipment. SKU: SBAS-100-SM.', 1200, 7, TRUE, FALSE, FALSE, 'prod-019', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000020-0000-4000-8000-000000000020', 'mfp-400-al',     'Marine Fuel Purifier',          'MFP-400-AL',      'b0000014-0000-4000-8000-000000000014', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'unused',        'Marine Fuel Purifier — marine & industrial equipment. SKU: MFP-400-AL.', 5800, 4, TRUE, FALSE, FALSE, 'prod-020', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000021-0000-4000-8000-000000000021', 'ljl-led-10',     'Life Jacket Light',             'LJL-LED-10',      'b0000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'published', 'emergency',   'reconditioned', 'Life Jacket Light — marine & industrial equipment. SKU: LJL-LED-10.', 350, 1, TRUE, FALSE, FALSE, 'prod-021', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000022-0000-4000-8000-000000000022', 'mpss-200-br',    'Marine Propeller Shaft Seal',   'MPSS-200-BR',     'b0000004-0000-4000-8000-000000000004', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'used',          'Marine Propeller Shaft Seal — marine & industrial equipment. SKU: MPSS-200-BR.', 2100, 6, TRUE, FALSE, FALSE, 'prod-022', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000023-0000-4000-8000-000000000023', 'gcu-6000',       'Gyro Compass Unit',             'GCU-6000',        'b0000015-0000-4000-8000-000000000015', 'c0000001-0000-4000-8000-000000000001', 'published', 'emergency',   'new',           'Gyro Compass Unit — marine & industrial equipment. SKU: GCU-6000.', 7200, 1, TRUE, FALSE, FALSE, 'prod-023', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000024-0000-4000-8000-000000000024', 'ats-200-ht',     'Auto Tensioning System',        'ATS-200-HT',      'b0000003-0000-4000-8000-000000000003', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'refurbished',   'Auto Tensioning System — marine & industrial equipment. SKU: ATS-200-HT.', 3800, 5, TRUE, FALSE, FALSE, 'prod-024', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000025-0000-4000-8000-000000000025', 'mewp-500-kr',    'Marine Exhaust Water Pump',     'MEWP-500-KR',     'b0000006-0000-4000-8000-000000000006', 'c0000001-0000-4000-8000-000000000001', 'published', 'in-stock',    'used',          'Marine Exhaust Water Pump — marine & industrial equipment. SKU: MEWP-500-KR.', 2600, 8, TRUE, FALSE, FALSE, 'prod-025', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000026-0000-4000-8000-000000000026', 'acs880-vfd',     'Variable Speed Drive 2.2kW',    'ACS880-01-02A7',  'b0000001-0000-4000-8000-000000000001', 'c0000002-0000-4000-8000-000000000002', 'published', 'emergency',   'new',           'Variable Speed Drive 2.2kW — electrical automation. SKU: ACS880-01-02A7.', 2200, 2, TRUE, TRUE, TRUE, 'prod-031', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000027-0000-4000-8000-000000000027', 's7-1500-plc',    'PLC CPU Module S7-1500',        '6ES7511-1AK02',   'b0000002-0000-4000-8000-000000000002', 'c0000002-0000-4000-8000-000000000002', 'published', 'emergency',   'new',           'PLC CPU Module S7-1500 — electrical automation. SKU: 6ES7511-1AK02.', 4500, 1, TRUE, FALSE, TRUE, 'prod-032', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
('50000028-0000-4000-8000-000000000028', 'lc1d40-contactor','Contactor 40A 3-Pole',          'LC1D40M7C',       'b0000005-0000-4000-8000-000000000005', 'c0000002-0000-4000-8000-000000000002', 'published', 'in-stock',    'new',           'Contactor 40A 3-Pole — electrical automation. SKU: LC1D40M7C.', 3200, 15, TRUE, FALSE, FALSE, 'prod-033', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- S4b. PRODUCT IMAGES
-- ============================================================================
INSERT INTO product_images (product_id, url, alt_text, label, is_main, sort_order)
SELECT id, '/images/' || legacy_id || '.avif', name || ' - Main View', 'Main', TRUE, 0
FROM products
WHERE legacy_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- S4c. PRODUCT INDUSTRIES
-- ============================================================================
INSERT INTO product_industries (product_id, industry_id)
SELECT p.id, i.id FROM products p, industries i
WHERE p.legacy_id IN ('prod-001','prod-002','prod-003','prod-004','prod-005','prod-006','prod-007','prod-008','prod-009','prod-010','prod-011','prod-012','prod-013','prod-014','prod-015','prod-016','prod-017','prod-018','prod-019','prod-020','prod-021','prod-022','prod-023','prod-024','prod-025')
AND i.slug = 'marine-shipping'
ON CONFLICT DO NOTHING;

INSERT INTO product_industries (product_id, industry_id)
SELECT p.id, i.id FROM products p, industries i
WHERE p.legacy_id IN ('prod-031','prod-032','prod-033')
AND i.slug = 'manufacturing'
ON CONFLICT DO NOTHING;

INSERT INTO product_industries (product_id, industry_id)
SELECT p.id, i.id FROM products p, industries i
WHERE p.legacy_id IN ('prod-031','prod-033')
AND i.slug = 'power-generation'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- S5. TESTIMONIALS (3)
-- ============================================================================
INSERT INTO testimonials (name, role, company, text, rating, sort_order, is_visible) VALUES
('Capt. R. Krishnamurthy', 'Chief Engineer, MV Pacific Fortune', 'Pacific Bulk Carriers', 'Critical hydraulic pump failure mid-voyage. Alka Traders delivered in 26 hours. Absolutely lifesaving service.', 5, 0, TRUE),
('Sarah J. Hoffmann', 'Global Procurement Manager', 'Rheinstahl Industrial GmbH', 'Consolidated invoicing, better pricing, faster delivery. ROI was immediate. Our go-to supplier for marine parts.', 5, 1, TRUE),
('Dinesh Patel', 'Head of Sourcing', 'Reliance Engineering Works', 'Emergency ABB drive delivered within 18 hours. No substitutes, no compromise. Highly recommended.', 5, 2, TRUE),
('noraedward', 'Verified Buyer', '', 'Item: ROTHENBERGER ROLeak PRO LEAK DETECTOR GAS SNIFFER. Very helpful seller. They investigated the issue I had when the delivery company delivered my parcel to the wrong person. Was very quick to address the situation, keep me informed and get the parcel delivered to me. Would recommend.', 5, 3, TRUE),
('b2esurplus', 'Verified Buyer — B2E Surplus', 'Back to Earth Surplus', 'Item: RIDGID D223 PIPE THREADER RATCHET 1 INCH SQUARE DRIVE. Five star transaction. Good shipping. Good packaging. Item as described. Good quality product in good condition. Good appearance. Thank you for the good transaction! At B2E Surplus, we buy and sell a lot of similar merchandise. We are always interested in bulk lots and/or good deals on industrial supplies.', 5, 4, TRUE),
('fuegocat77', 'Verified Buyer', '', 'RECORD 91 1/2 C Pipe Vise received as pictured on eBay. Shipping was very fast and FREE, with unexpectedly quick delivery from India. Packaging could have been better. Item shipped in corrugated cardboard box completely wrapped in duct tape. Vise itself was heavily covered in bubble wrap. Box was padded with pieces of Styrofoam on the sides and top, but not the bottom. As a result, the front mounting pad wore through the box, resulting in scraped paint. Nothing broken, so not an issue.', 5, 5, TRUE);

-- ============================================================================
-- S6. OFFICES (4)
-- ============================================================================
INSERT INTO offices (city, country, address, timezone, phone, email, coordinates_lat, coordinates_lng, sort_order, is_visible) VALUES
('BHAVNAGAR', 'India', 'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA', 'Asia/Kolkata', '+91 97269 00547', 'info@alkatraders.com', 21.7645, 72.1519, 0, TRUE);

-- ============================================================================
-- S7. STORE SETTINGS (11)
-- ============================================================================
INSERT INTO store_settings (key, value, category, updated_by) VALUES
('site.companyName',       '"Alka Traders"',           'site', 'a0000000-0000-4000-8000-000000000001'),
('site.tagline',           '"Marine and Industrial Equipment"', 'site', 'a0000000-0000-4000-8000-000000000001'),
('site.email',             '"info@alkatraders.com"',   'site', 'a0000000-0000-4000-8000-000000000001'),
('site.phone',             '"+91 97269 00547"',        'site', 'a0000000-0000-4000-8000-000000000001'),
('site.whatsappNumber',    '"919726900547"',           'site', 'a0000000-0000-4000-8000-000000000001'),
('site.currency',          '"USD"',                    'site', 'a0000000-0000-4000-8000-000000000001'),
('site.rfqEmail',          '"rfq@alkatraders.com"',    'site', 'a0000000-0000-4000-8000-000000000001'),
('site.emergencyEmail',    '"emergency@alkatraders.com"','site', 'a0000000-0000-4000-8000-000000000001'),
('checkout.shippingCost',  '25',                       'checkout', 'a0000000-0000-4000-8000-000000000001'),
('checkout.taxRate',       '0.08',                     'checkout', 'a0000000-0000-4000-8000-000000000001'),
('checkout.freeShippingThreshold', '500',              'checkout', 'a0000000-0000-4000-8000-000000000001')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- S8. HOMEPAGE SECTIONS (8)
-- ============================================================================
INSERT INTO homepage_sections (section_type, label, is_enabled, sort_order, config) VALUES
('hero',        'Hero Banner',         TRUE, 0, '{}'),
('featured',    'Featured Products',   TRUE, 1, '{}'),
('stats',       'Stats Bar',           TRUE, 2, '{}'),
('categories',  'Categories Grid',     TRUE, 3, '{}'),
('brands',      'Brand Marquee',       TRUE, 4, '{}'),
('testimonials','Testimonials',        TRUE, 5, '{}'),
('industries',  'Industries Tabs',     TRUE, 6, '{}'),
('cta',         'RFQ CTA',             TRUE, 7, '{}');

-- ============================================================================
-- DONE!
-- ============================================================================
-- Summary:
--   Tables:      27
--   Views:        3
--   Triggers:    12
--   Admin:    1 row (admin@alkatraders.com / admin123)
--   Customer: 1 row (customer@alkatraders.com / customer123)
--   Categories:  19
--   Brands:      22
--   Industries:   6
--   Products:    28
--   Testimonials: 3
--   Offices:      4
--   Settings:    11
--   Homepage:     8
-- ============================================================================
