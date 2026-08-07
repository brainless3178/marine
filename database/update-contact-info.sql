-- ═══════════════════════════════════════════════════════════════════════
-- Alka Traders — Update live contact info in the database
-- Run against the NeonDB production database (SQL editor or psql).
--
-- Why: the storefront contact details (email, phone, WhatsApp, RFQ email,
-- emergency email) are stored in the store_settings table, seeded with the
-- old values. Env vars only act as fallbacks when a row is missing, so the
-- DB rows must be updated directly for the live site to show:
--   • Email:   sales@alkatraders.co
--   • Phone:   +91 87990 95041
--   • WhatsApp: 918799095041
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Store settings: all contact emails → sales@alkatraders.co ──────
UPDATE store_settings
SET value = '"sales@alkatraders.co"'::jsonb, updated_at = now()
WHERE key IN ('site.email', 'site.rfqEmail', 'site.emergencyEmail');

-- ── 2. Store settings: phone + WhatsApp → +91 87990 95041 ──────────────
UPDATE store_settings
SET value = '"+91 87990 95041"'::jsonb, updated_at = now()
WHERE key = 'site.phone';

UPDATE store_settings
SET value = '"918799095041"'::jsonb, updated_at = now()
WHERE key = 'site.whatsappNumber';

-- ── 3. Bhavnagar head-office record (offices table) ────────────────────
UPDATE offices
SET phone = '+91 87990 95041', email = 'sales@alkatraders.co'
WHERE email IN ('info@alkatraders.com', 'sales@alkatraders.co');

-- ── 4. Admin login email → sales@alkatraders.co (matches ADMIN_EMAIL) ──
-- The admin user's password is untouched — only the login email changes.
UPDATE admin_users
SET email = 'sales@alkatraders.co'
WHERE email IN ('admin@alkatraders.com', 'admin@alkatraders.co')
  AND NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'sales@alkatraders.co');
