-- ═══════════════════════════════════════════════════════════════════════
-- Alka Traders — Set admin login to admin@alkatraders.co
-- Run against the NeonDB production database (SQL editor or psql).
--
-- Sets the admin login credentials to:
--   • Email:    admin@alkatraders.co
--   • Password: change-me  (bcrypt, 12 rounds)
--
-- Idempotent: safe to run multiple times. If the admin already exists under
-- admin@alkatraders.co its hash is updated; otherwise the existing owner
-- admin (sales@alkatraders.co / admin@alkatraders.com) is renamed and the
-- hash is set.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. If a row with the new email already exists, update its password hash.
UPDATE admin_users
SET password_hash = '$2b$12$HuyZo4X5GSMdKOkgPJsg1.zAHxRJrQJAIz9Cd6KNNGvX6aKnheJnu',
    name          = 'Store Owner',
    role          = 'owner',
    is_active     = TRUE
WHERE email = 'admin@alkatraders.co';

-- 2. Otherwise rename the existing owner admin to the new email and set the hash.
UPDATE admin_users
SET email         = 'admin@alkatraders.co',
    password_hash = '$2b$12$HuyZo4X5GSMdKOkgPJsg1.zAHxRJrQJAIz9Cd6KNNGvX6aKnheJnu',
    name          = 'Store Owner',
    role          = 'owner',
    is_active     = TRUE
WHERE email IN ('sales@alkatraders.co', 'admin@alkatraders.com')
  AND NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@alkatraders.co');

-- 3. Revoke the old shared password from any other legacy admin rows.
UPDATE admin_users
SET password_hash = '$2b$12$HuyZo4X5GSMdKOkgPJsg1.zAHxRJrQJAIz9Cd6KNNGvX6aKnheJnu'
WHERE email IN ('sales@alkatraders.co', 'admin@alkatraders.com');

-- 4. Verify
SELECT id, email, name, role, is_active
FROM admin_users
WHERE email = 'admin@alkatraders.co';
