-- ============================================================
-- Alka Traders — production database cleanup
-- Run in Neon console → SQL editor (one block at a time is fine)
-- Each DELETE is scoped by explicit IDs / exact values, so it only
-- touches the test/placeholder rows found on 2026-08-13.
-- ============================================================

-- 1) Placeholder testimonials
--    The testimonials table only holds 3 dummy "Verified Buyer" rows
--    (Spanish/Norwegian/English). The real eBay reviews (fuegocat77,
--    noraedward, b2esurplus) live in the frontend static data, and the
--    Testimonials component falls back to them whenever the API returns
--    an empty list. Deleting these rows makes the real reviews appear.
DELETE FROM testimonials;
-- Expected: DELETE 3

-- 2) Test / dev customer accounts (keeps parvez.habibani98@gmail.com)
DELETE FROM customers WHERE id IN (
  '93f47b97-5822-4722-90b2-e4c008bf5ce8', -- test@testt.com
  'e94f8451-19d6-4fcf-9a4c-97b5fcfc6cab', -- arshilhabibani10@gmail.com (test order account)
  '0f7c5279-8beb-481f-9e8f-2d6d5bcfef7c'  -- arshil@alkatraders.co (dev account)
);
-- Expected: DELETE 3

-- 3) Audit log entries created by tests (keeps login history + real actions)
DELETE FROM audit_logs WHERE id IN (
  '9a030c74-1fa1-474d-a4a1-a2787a7c6fcf', -- product.create "TEST IS TEST -900"
  'd469d06e-1e3f-47b7-b6b6-dbefd88fb7be', -- contact.create "Test Subject"
  '7dae32b5-cbce-4a6e-99e4-59ede7ece250', -- contact.create "Test Subject"
  '9fa4de91-e578-4d8a-8796-36c5faf7529a', -- rfq.create "Test User" (test@example.com)
  '6c8894b4-504c-4838-b963-54251d155065', -- rfq.create "Test User" (test@example.com)
  '79a4ddc2-63f5-4436-a9de-21e4998e6de2'  -- order.create test order (ARSHIL)
);
-- Expected: DELETE 6

-- 4) Failed email queue — every row failed with "API key is invalid"
--    (wrong Resend key + old .com addresses). Clear once email is fixed.
DELETE FROM email_queue;
-- Expected: DELETE 8

-- 5) Duplicate categories (nothing references them — products table is empty)
--    "Engine Parts" is a duplicate of "Engine Spare Parts"
--    "Hydraulic Pumps" is a duplicate of "Marine Pumps"
DELETE FROM categories WHERE id IN (
  '4852c2cf-330e-49b6-a946-a5b517bdbd7b', -- engine-parts
  '52e0366e-1e4e-4314-9eaa-3393c89a676d'  -- hydraulic-pumps
);
-- Expected: DELETE 2

-- ============================================================
-- Verify afterwards:
--   SELECT count(*) FROM testimonials;   -- 0 (static reviews take over)
--   SELECT count(*) FROM customers;      -- 1 (parvez only)
--   SELECT count(*) FROM email_queue;    -- 0
--   SELECT count(*) FROM categories;     -- 17
-- ============================================================
