-- ============================================================================
-- ALKA TRADERS — COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Generated: July 19, 2026
-- Database: PostgreSQL 15+
-- 
-- This file contains the full database schema for the Alka Traders
-- marine & industrial equipment e-commerce platform.
--
-- Tables: 22
-- Indexes: 40+
-- Enums: 15+
-- Seed data included at the bottom.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ADMIN USERS
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

COMMENT ON TABLE admin_users IS 'Admin panel users with role-based access control';
COMMENT ON COLUMN admin_users.role IS 'Roles: owner, store-manager, inventory-manager, sales-agent, content-manager, viewer';

-- ============================================================================
-- 2. CUSTOMERS
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

COMMENT ON TABLE customers IS 'Customer accounts for B2B e-commerce';
COMMENT ON COLUMN customers.status IS 'Statuses: active, inactive, suspended';

-- ============================================================================
-- 3. CATEGORIES (hierarchical)
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

COMMENT ON TABLE categories IS 'Product categories with optional parent-child hierarchy';

-- ============================================================================
-- 4. BRANDS
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

COMMENT ON TABLE brands IS 'Product brands (ABB, Siemens, Parker, etc.)';
COMMENT ON COLUMN brands.sectors IS 'Array of sectors: Marine, Industrial, Automation, Hydraulic, Pneumatic';

-- ============================================================================
-- 5. INDUSTRIES
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

COMMENT ON TABLE industries IS 'Industry verticals: Marine Shipping, Shipyards, Oil & Gas, Power Generation, Manufacturing, Chemical Processing';

-- ============================================================================
-- 6. PRODUCTS
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

COMMENT ON TABLE products IS 'Core product catalog with pricing, inventory, SEO, and merchandising fields';
COMMENT ON COLUMN products.status IS 'Statuses: draft, published, hidden, archived';
COMMENT ON COLUMN products.availability IS 'Availabilities: in-stock, sourced, emergency, out-of-stock';
COMMENT ON COLUMN products.condition IS 'Conditions: new, unused, used, refurbished, reconditioned';
COMMENT ON COLUMN products.product_type IS 'Types: physical, sourced-on-request, spare-part, surplus';

-- ============================================================================
-- 7. PRODUCT IMAGES
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
CREATE INDEX idx_product_images_media ON product_images(media_asset_id);

COMMENT ON TABLE product_images IS 'Product gallery images with ordering and main image flag';
COMMENT ON COLUMN product_images.label IS 'Labels: Main, Side, Detail, Nameplate, Serial Plate, Packaging, Test Report';

-- ============================================================================
-- 8. PRODUCT SPECIFICATIONS
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

COMMENT ON TABLE product_specs IS 'Dynamic key-value specification pairs for products';

-- ============================================================================
-- 9. PRODUCT INDUSTRIES (Many-to-Many Join Table)
-- ============================================================================

CREATE TABLE product_industries (
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    industry_id  UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, industry_id)
);

CREATE INDEX idx_product_industries_industry ON product_industries(industry_id);

COMMENT ON TABLE product_industries IS 'Many-to-many join: products ↔ industries';

-- ============================================================================
-- 10. ORDERS
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

COMMENT ON TABLE orders IS 'Customer orders with full shipping, payment, and tracking details';
COMMENT ON COLUMN orders.status IS 'Statuses: pending, confirmed, processing, packed, shipped, delivered, cancelled, refunded';
COMMENT ON COLUMN orders.payment_status IS 'Payment statuses: pending, paid, failed, refunded';

-- ============================================================================
-- 11. ORDER ITEMS
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

COMMENT ON TABLE order_items IS 'Individual line items within an order';

-- ============================================================================
-- 12. ORDER TIMELINE
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

COMMENT ON TABLE order_timeline IS 'Status change history for orders (audit trail)';

-- ============================================================================
-- 13. RFQ (Request for Quote)
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
CREATE INDEX idx_rfqs_assigned ON rfqs(assigned_to);
CREATE INDEX idx_rfqs_customer ON rfqs(customer_id);

COMMENT ON TABLE rfqs IS 'Request for Quote submissions from customers';
COMMENT ON COLUMN rfqs.urgency IS 'Urgencies: standard, urgent, emergency';
COMMENT ON COLUMN rfqs.status IS 'Statuses: new, in-progress, quote-sent, customer-replied, won, lost, closed';

-- ============================================================================
-- 14. RFQ ITEMS
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

COMMENT ON TABLE rfq_items IS 'Individual line items within an RFQ submission';

-- ============================================================================
-- 15. RFQ NOTES
-- ============================================================================

CREATE TABLE rfq_notes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    author_id   UUID REFERENCES admin_users(id),
    note        TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE rfq_notes IS 'Internal and customer-facing notes on RFQs';

-- ============================================================================
-- 16. OFFERS (Make an Offer)
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
CREATE INDEX idx_offers_customer_email ON offers(customer_email);
CREATE INDEX idx_offers_rfq ON offers(rfq_id);

COMMENT ON TABLE offers IS 'Make-an-Offer requests from product detail pages';
COMMENT ON COLUMN offers.status IS 'Statuses: pending, accepted, rejected, countered, expired, converted-to-order';

-- ============================================================================
-- 17. CONTACT MESSAGES
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

COMMENT ON TABLE contact_messages IS 'Inbound contact form submissions';
COMMENT ON COLUMN contact_messages.status IS 'Statuses: new, read, replied, archived';

-- ============================================================================
-- 18. EMERGENCY REQUESTS
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

COMMENT ON TABLE emergency_requests IS 'Urgent emergency part requests from vessels';

-- ============================================================================
-- 19. MEDIA ASSETS
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

COMMENT ON TABLE media_assets IS 'Central media library for product images, brand logos, and uploads';

-- ============================================================================
-- 20. TESTIMONIALS
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

COMMENT ON TABLE testimonials IS 'Customer testimonials displayed on the storefront';

-- ============================================================================
-- 21. OFFICES
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

COMMENT ON TABLE offices IS 'Physical office locations for the company (Mumbai, Dubai, Singapore, Rotterdam)';

-- ============================================================================
-- 22. STORE SETTINGS
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
CREATE INDEX idx_store_settings_category ON store_settings(category);

COMMENT ON TABLE store_settings IS 'Key-value store for site configuration (company info, checkout rules, payment settings)';
COMMENT ON COLUMN store_settings.value IS 'JSON value — supports strings, numbers, booleans, objects, and arrays';

-- ============================================================================
-- 23. HOMEPAGE SECTIONS
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

COMMENT ON TABLE homepage_sections IS 'Configurable homepage sections (hero, featured, categories, brands, testimonials, etc.)';

-- ============================================================================
-- 24. AUDIT LOG
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
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all admin actions';

-- ============================================================================
-- 25. EMAIL QUEUE
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

COMMENT ON TABLE email_queue IS 'Async email delivery queue with retry support';
COMMENT ON COLUMN email_queue.status IS 'Statuses: pending, sent, retrying, failed';

-- ============================================================================
-- 26. WEBHOOK LOGS
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

COMMENT ON TABLE webhook_logs IS 'Incoming webhook event logs (PayPal, etc.)';

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
-- VIEWS: Useful computed views for admin dashboard
-- ============================================================================

-- Product health overview
CREATE OR REPLACE VIEW v_product_health AS
SELECT
    p.id,
    p.name,
    p.sku,
    p.status,
    p.availability,
    p.stock_count,
    p.low_stock_threshold,
    b.name AS brand_name,
    c.name AS category_name,
    CASE
        WHEN p.stock_count = 0 THEN 'out-of-stock'
        WHEN p.stock_count <= p.low_stock_threshold THEN 'low-stock'
        ELSE 'healthy'
    END AS stock_health,
    (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) AS image_count,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status != 'archived';

-- Order summary
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
    o.id,
    o.order_number,
    o.status,
    o.payment_status,
    o.total,
    o.currency,
    c.name AS customer_name,
    c.email AS customer_email,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
    o.tracking_number,
    o.created_at,
    o.updated_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id;

-- RFQ pipeline
CREATE OR REPLACE VIEW v_rfq_pipeline AS
SELECT
    r.id,
    r.rfq_number,
    r.full_name,
    r.company,
    r.email,
    r.urgency,
    r.status,
    au.name AS assigned_to_name,
    r.product_description,
    r.created_at,
    r.first_response_at,
    CASE
        WHEN r.urgency = 'emergency' AND r.first_response_at IS NULL
        AND NOW() - r.created_at > INTERVAL '2 hours' THEN 'overdue'
        WHEN r.urgency = 'urgent' AND r.first_response_at IS NULL
        AND NOW() - r.created_at > INTERVAL '24 hours' THEN 'overdue'
        ELSE 'on-time'
    END AS sla_status
FROM rfqs r
LEFT JOIN admin_users au ON r.assigned_to = au.id;

-- Revenue by month
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
-- SEED DATA: Default admin user (password set via env var at runtime)
-- ============================================================================

-- Note: The actual seed is run via `npx prisma db seed` which uses the
-- TypeScript seed file at backend/prisma/seed.ts. The seed creates:
-- - 1 admin user (owner role)
-- - 19 categories
-- - 22 brands
-- - 6 industries
-- - 28 sample products with images
-- - 3 testimonials
-- - 4 offices
-- - 11 store settings
-- - 8 homepage sections

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- Total tables: 26
-- Total indexes: 40+
-- Total views: 4
-- Total triggers: 12
--
-- All tables use UUID primary keys.
-- All timestamps use TIMESTAMPTZ (timezone-aware).
-- All monetary values use DECIMAL(12,2).
-- Foreign keys use ON DELETE CASCADE or ON DELETE SET NULL as appropriate.
-- ============================================================================
