-- ============================================================================
-- ALKA TRADERS — COMPREHENSIVE SEED DATA
-- ============================================================================
-- Run AFTER schema.sql
-- This file seeds the database with all data from the frontend codebase:
-- - 19 categories
-- - 22 brands
-- - 6 industries
-- - 0 products (catalog intentionally empty)
-- - 3 testimonials
-- - 4 offices
-- - 11 store settings
-- - 8 homepage sections
-- - 1 admin user (owner)
-- ============================================================================

-- ============================================================================
-- 0. ADMIN USER (login: admin@alkatraders.co)
-- ============================================================================

-- The admin user is created via the TypeScript seed file (backend/prisma/seed.ts)
-- because it requires bcrypt hashing. Run: cd backend && npx prisma db seed

-- For raw SQL, you can insert directly with a pre-hashed password (bcrypt, 12 rounds):
-- INSERT INTO admin_users (id, email, password_hash, name, role)
-- VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@alkatraders.co',
--         '$2b$12$HuyZo4X5GSMdKOkgPJsg1.zAHxRJrQJAIz9Cd6KNNGvX6aKnheJnu', 'Store Owner', 'owner');

-- ============================================================================
-- 1. CATEGORIES (19 total)
-- ============================================================================

INSERT INTO categories (id, name, slug, icon, sort_order, is_visible) VALUES
('c0000001-0000-0000-0000-000000000001', 'Marine Equipment',        'marine',             'Ship',            0,  TRUE),
('c0000002-0000-0000-0000-000000000002', 'Electrical Automation',   'electrical',         'Zap',             1,  TRUE),
('c0000003-0000-0000-0000-000000000003', 'Hydraulic Systems',       'hydraulic',          'Droplet',         2,  TRUE),
('c0000004-0000-0000-0000-000000000004', 'Pneumatic Systems',       'pneumatic',          'Wind',            3,  TRUE),
('c0000005-0000-0000-0000-000000000005', 'Industrial Spare Parts',  'spares',             'Settings',        4,  TRUE),
('c0000006-0000-0000-0000-000000000006', 'Surplus Inventory',       'surplus',            'Warehouse',       5,  TRUE),
('c0000007-0000-0000-0000-000000000007', 'Lifting & Handling',      'lifting-handling',   'ArrowUpFromLine', 6,  TRUE),
('c0000008-0000-0000-0000-000000000008', 'Tools & Equipment',       'tools-equipment',    'Wrench',          7,  TRUE),
('c0000009-0000-0000-0000-000000000009', 'Safety Equipment',        'safety',             'ShieldCheck',     8,  TRUE),
('c0000010-0000-0000-0000-000000000010', 'Hand Tools',              'hand-tools',         'Hammer',          9,  TRUE),
('c0000011-0000-0000-0000-000000000011', 'Ship Navigation',         'ship-navigation',    'Compass',         10, TRUE),
('c0000012-0000-0000-0000-000000000012', 'Marine Pumps',            'marine-pumps',       'Droplets',        11, TRUE),
('c0000013-0000-0000-0000-000000000013', 'Engine Spare Parts',      'engine-spare',       'Cog',             12, TRUE),
('c0000014-0000-0000-0000-000000000014', 'Engine Parts',            'engine-parts',       'Cog',             13, TRUE),
('c0000015-0000-0000-0000-000000000015', 'Motors & Components',     'motor-components',   'Zap',             14, TRUE),
('c0000016-0000-0000-0000-000000000016', 'Ship Machinery',          'ship-machinery',     'Ship',            15, TRUE),
('c0000017-0000-0000-0000-000000000017', 'Hydraulic Pumps',         'hydraulic-pumps',    'Droplet',         16, TRUE),
('c0000018-0000-0000-0000-000000000018', 'Rigging & Lashing',       'rigging',            'Anchor',          17, TRUE),
('c0000019-0000-0000-0000-000000000019', 'Other Business & Industrial', 'other-business', 'Package',         18, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. BRANDS (22 core brands)
-- ============================================================================

INSERT INTO brands (id, name, slug, sectors, sort_order, is_visible) VALUES
('b0000001-0000-0000-0000-000000000001', 'ABB',              'abb',              ARRAY['Marine','Industrial','Automation'],       0,  TRUE),
('b0000002-0000-0000-0000-000000000002', 'Siemens',          'siemens',          ARRAY['Marine','Industrial','Automation'],       1,  TRUE),
('b0000003-0000-0000-0000-000000000003', 'Parker Hannifin',  'parker',           ARRAY['Marine','Industrial','Hydraulic'],        2,  TRUE),
('b0000004-0000-0000-0000-000000000004', 'Bosch Rexroth',    'bosch-rexroth',    ARRAY['Industrial','Hydraulic','Automation'],    3,  TRUE),
('b0000005-0000-0000-0000-000000000005', 'Schneider Electric','schneider',       ARRAY['Industrial','Automation'],                4,  TRUE),
('b0000006-0000-0000-0000-000000000006', 'Danfoss',          'danfoss',          ARRAY['Marine','Industrial'],                    5,  TRUE),
('b0000007-0000-0000-0000-000000000007', 'Honeywell',        'honeywell',        ARRAY['Marine','Industrial','Automation'],       6,  TRUE),
('b0000008-0000-0000-0000-000000000008', 'Emerson',          'emerson',          ARRAY['Industrial','Automation'],                7,  TRUE),
('b0000009-0000-0000-0000-000000000009', 'Festo',            'festo',            ARRAY['Industrial','Pneumatic'],                 8,  TRUE),
('b0000010-0000-0000-0000-000000000010', 'SMC',              'smc',              ARRAY['Industrial','Pneumatic'],                 9,  TRUE),
('b0000011-0000-0000-0000-000000000011', 'Grundfos',         'grundfos',         ARRAY['Marine','Industrial'],                    10, TRUE),
('b0000012-0000-0000-0000-000000000012', 'Atlas Copco',      'atlas-copco',      ARRAY['Industrial','Pneumatic'],                 11, TRUE),
('b0000013-0000-0000-0000-000000000013', 'Wärtsilä',         'wartsila',         ARRAY['Marine'],                                12, TRUE),
('b0000014-0000-0000-0000-000000000014', 'Alfa Laval',       'alfa-laval',       ARRAY['Marine','Industrial'],                    13, TRUE),
('b0000015-0000-0000-0000-000000000015', 'Kongsberg',        'kongsberg',        ARRAY['Marine'],                                14, TRUE),
('b0000016-0000-0000-0000-000000000016', 'SKF',              'skf',              ARRAY['Industrial'],                             15, TRUE),
('b0000017-0000-0000-0000-000000000017', 'IFM',              'ifm',              ARRAY['Industrial','Automation'],                16, TRUE),
('b0000018-0000-0000-0000-000000000018', 'Pepperl+Fuchs',    'pepperl-fuchs',    ARRAY['Industrial','Automation'],                17, TRUE),
('b0000019-0000-0000-0000-000000000019', 'Sick AG',          'sick',             ARRAY['Industrial','Automation'],                18, TRUE),
('b0000020-0000-0000-0000-000000000020', 'Omron',            'omron',            ARRAY['Industrial','Automation'],                19, TRUE),
('b0000021-0000-0000-0000-000000000021', 'Phoenix Contact',  'phoenix-contact',  ARRAY['Industrial','Automation'],                20, TRUE),
('b0000022-0000-0000-0000-000000000022', 'Rittal',           'rittal',           ARRAY['Industrial'],                             21, TRUE),
('b0000023-0000-0000-0000-000000000023', 'Pilz',             'pilz',             ARRAY['Industrial','Automation'],                22, TRUE),
('b0000024-0000-0000-0000-000000000024', 'MAN',              'man',              ARRAY['Marine','Industrial'],                    23, TRUE),
('b0000025-0000-0000-0000-000000000025', 'Caterpillar',      'caterpillar',      ARRAY['Marine','Industrial'],                    24, TRUE),
('b0000026-0000-0000-0000-000000000026', 'Cummins',          'cummins',          ARRAY['Marine','Industrial'],                    25, TRUE),
('b0000027-0000-0000-0000-000000000027', 'Holset',           'holset',           ARRAY['Marine','Industrial'],                    26, TRUE),
('b0000028-0000-0000-0000-000000000028', 'Bosch',            'bosch',            ARRAY['Industrial'],                             27, TRUE),
('b0000029-0000-0000-0000-000000000029', 'NTN',              'ntn',              ARRAY['Industrial'],                             28, TRUE),
('b0000030-0000-0000-0000-000000000030', 'Gates',            'gates',            ARRAY['Industrial'],                             29, TRUE),
('b0000031-0000-0000-0000-000000000031', 'Lapp',             'lapp',             ARRAY['Industrial'],                             30, TRUE),
('b0000032-0000-0000-0000-000000000032', 'Interroll',        'interroll',        ARRAY['Industrial'],                             31, TRUE),
('b0000033-0000-0000-0000-000000000033', 'Demag',            'demag',            ARRAY['Industrial'],                             32, TRUE),
('b0000034-0000-0000-0000-000000000034', 'Kito',             'kito',             ARRAY['Industrial'],                             33, TRUE),
('b0000035-0000-0000-0000-000000000035', 'Toyota',           'toyota',           ARRAY['Industrial'],                             34, TRUE),
('b0000036-0000-0000-0000-000000000036', 'Southworth',       'southworth',       ARRAY['Industrial'],                             35, TRUE),
('b0000037-0000-0000-0000-000000000037', 'Crosby',           'crosby',           ARRAY['Industrial'],                             36, TRUE),
('b0000038-0000-0000-0000-000000000038', 'Schmalz',          'schmalz',          ARRAY['Industrial'],                             37, TRUE),
('b0000039-0000-0000-0000-000000000039', 'Spanco',           'spanco',           ARRAY['Industrial'],                             38, TRUE),
('b0000040-0000-0000-0000-000000000040', 'Caldwell',         'caldwell',         ARRAY['Industrial'],                             39, TRUE),
('b0000041-0000-0000-0000-000000000041', 'Bosch (Tools)',    'bosch-tools',      ARRAY['Industrial'],                             40, TRUE),
('b0000042-0000-0000-0000-000000000042', 'Fluke',            'fluke',            ARRAY['Industrial'],                             41, TRUE),
('b0000043-0000-0000-0000-000000000043', 'Makita',           'makita',           ARRAY['Industrial'],                             42, TRUE),
('b0000044-0000-0000-0000-000000000044', 'Flir',             'flir',             ARRAY['Industrial'],                             43, TRUE),
('b0000045-0000-0000-0000-000000000045', 'Delta',            'delta',            ARRAY['Industrial'],                             44, TRUE),
('b0000046-0000-0000-0000-000000000046', 'Ridgid',           'ridgid',           ARRAY['Industrial'],                             45, TRUE),
('b0000047-0000-0000-0000-000000000047', 'Olympus',          'olympus',          ARRAY['Industrial'],                             46, TRUE),
('b0000048-0000-0000-0000-000000000048', 'Klingspor',        'klingspor',        ARRAY['Industrial'],                             47, TRUE),
('b0000049-0000-0000-0000-000000000049', '3M',               '3m',               ARRAY['Industrial'],                             48, TRUE),
('b0000050-0000-0000-0000-000000000050', 'Amerex',           'amerex',           ARRAY['Industrial'],                             49, TRUE),
('b0000051-0000-0000-0000-000000000051', 'MSA',              'msa',              ARRAY['Industrial'],                             50, TRUE),
('b0000052-0000-0000-0000-000000000052', 'Lincoln',          'lincoln',          ARRAY['Industrial'],                             51, TRUE),
('b0000053-0000-0000-0000-000000000053', 'Bradley',          'bradley',          ARRAY['Industrial'],                             52, TRUE),
('b0000054-0000-0000-0000-000000000054', 'Uvex',             'uvex',             ARRAY['Industrial'],                             53, TRUE),
('b0000055-0000-0000-0000-000000000055', 'Mustang',          'mustang',          ARRAY['Marine'],                                54, TRUE),
('b0000056-0000-0000-0000-000000000056', 'Snap-On',          'snap-on',          ARRAY['Industrial'],                             55, TRUE),
('b0000057-0000-0000-0000-000000000057', 'Proto',            'proto',            ARRAY['Industrial'],                             56, TRUE),
('b0000058-0000-0000-0000-000000000058', 'Bahco',            'bahco',            ARRAY['Industrial'],                             57, TRUE),
('b0000059-0000-0000-0000-000000000059', 'Stanley',          'stanley',          ARRAY['Industrial'],                             58, TRUE),
('b0000060-0000-0000-0000-000000000060', 'Klein',            'klein',            ARRAY['Industrial'],                             59, TRUE),
('b0000061-0000-0000-0000-000000000061', 'Wiha',             'wiha',             ARRAY['Industrial'],                             60, TRUE),
('b0000062-0000-0000-0000-000000000062', 'Simrad',           'simrad',           ARRAY['Marine'],                                61, TRUE),
('b0000063-0000-0000-0000-000000000063', 'Furuno',           'furuno',           ARRAY['Marine'],                                62, TRUE),
('b0000064-0000-0000-0000-000000000064', 'Comnav',           'comnav',           ARRAY['Marine'],                                63, TRUE),
('b0000065-0000-0000-0000-000000000065', 'Sestrel',          'sestrel',          ARRAY['Marine'],                                64, TRUE),
('b0000066-0000-0000-0000-000000000066', 'Garmin',           'garmin',           ARRAY['Marine'],                                65, TRUE),
('b0000067-0000-0000-0000-000000000067', 'Raymarine',        'raymarine',        ARRAY['Marine'],                                66, TRUE),
('b0000068-0000-0000-0000-000000000068', 'Rule',             'rule',             ARRAY['Marine'],                                67, TRUE),
('b0000069-0000-0000-0000-000000000069', 'Jabsco',           'jabsco',           ARRAY['Marine'],                                68, TRUE),
('b0000070-0000-0000-0000-000000000070', 'Shurflo',          'shurflo',          ARRAY['Marine'],                                69, TRUE),
('b0000071-0000-0000-0000-000000000071', 'Flojet',           'flojet',           ARRAY['Marine'],                                70, TRUE),
('b0000072-0000-0000-0000-000000000072', 'Katadyn',          'katadyn',          ARRAY['Marine'],                                71, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. INDUSTRIES (6)
-- ============================================================================

INSERT INTO industries (id, name, slug, icon, description, pain_points, sort_order, is_visible) VALUES
('i0000001-0000-0000-0000-000000000001', 'Marine Shipping',       'marine-shipping',      'Ship',
 'Vessel fleet operators and ship managers trust Alka Traders for urgent OEM spare parts, navigation electronics, and engine room consumables.',
 ARRAY['Critical equipment failure mid-voyage','Long lead times from OEMs','Inconsistent quality from unauthorized parts','Complex customs clearance'], 0, TRUE),
('i0000002-0000-0000-0000-000000000002', 'Shipyards & Drydocks',  'shipyards',           'Anchor',
 'Drydock and repair facilities rely on our broad inventory of structural, hydraulic, and electrical components.',
 ARRAY['Tight drydock schedules','Bulk sourcing coordination','Hydraulic system integration','Cost overruns from fragmented suppliers'], 1, TRUE),
('i0000003-0000-0000-0000-000000000003', 'Oil & Gas',              'oil-gas',             'Flame',
 'Upstream and downstream operators trust our certified stock of explosion-proof equipment and instrumentation.',
 ARRAY['ATEX/IECEx certification requirements','Remote offshore locations','Emergency shutdown failures','Counterfeit part risk'], 2, TRUE),
('i0000004-0000-0000-0000-000000000004', 'Power Generation',      'power-generation',    'Zap',
 'Power plant procurement teams source turbine components, protection relays, switchgear, and transformer parts.',
 ARRAY['Aging infrastructure','Grid compliance','Seasonal peak demand','Multi-brand coordination'], 3, TRUE),
('i0000005-0000-0000-0000-000000000005', 'Manufacturing',         'manufacturing',       'Factory',
 'Production line managers reduce downtime by sourcing automation components, drive systems, and industrial sensors.',
 ARRAY['Line stoppage costs','Obsolescence management','MRO inventory balancing','Single-supplier dependency'], 4, TRUE),
('i0000006-0000-0000-0000-000000000006', 'Chemical Processing',   'chemical-processing', 'FlaskConical',
 'Chemical plant procurement requires compliance-grade sourcing of corrosion-resistant fittings and SIL-certified instrumentation.',
 ARRAY['SIL certification documentation','Corrosion-resistant specifications','Batch production schedules','Regulatory inspection readiness'], 5, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 5. TESTIMONIALS (3)
-- ============================================================================

INSERT INTO testimonials (id, name, role, company, text, rating, sort_order, is_visible) VALUES
('a0000001-0000-0000-0000-000000000001', 'fuegocat77 (276)', '', '', 'Record 91 ½ C Pipe Vise received as pictured on eBay. Shipping was very fast and FREE, with unexpectedly quick delivery from India. Packaging could have been better. Item shipped in corrugated cardboard box completely wrapped in duck tape. Vise itself was heavily covered in bubble wrap. Box was padded with pieces of Styrofoam on the sides and top, but not the bottom. As a result, the front mounting pad wore through the box, resulting in scraped paint. Nothing broken, so not an issue.', 5, 0, TRUE),
('a0000002-0000-0000-0000-000000000002', 'noraedward (1104)', '', '', 'Very helpful seller. They investigated the issue I had when the delivery company delivered my parcel to the wrong person. Was very quick to address the situation, keep me informed and get the parcel delivered to me. Would recommend.', 5, 1, TRUE),
('a0000003-0000-0000-0000-000000000003', 'b2esurplus (7400)', '', '', 'Five star transaction. Good shipping. Good packaging. Item as described. Good quality product in good condition. Good appearance. Thank you for the good transaction! All five stars. At B2E Surplus (aka Back to Earth Surplus), we buy and sell a lot of similar merchandise. We are always interested in bulk lots and/or good deals on industrial supplies. Look us up anytime!', 5, 2, TRUE);

-- ============================================================================
-- 6. OFFICES (4)
-- ============================================================================

INSERT INTO offices (id, city, country, address, timezone, phone, email, coordinates_lat, coordinates_lng, sort_order, is_visible) VALUES
('o0000001-0000-0000-0000-000000000001', 'BHAVNAGAR', 'India',      'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA', 'Asia/Kolkata', '+91 87990 95041', 'sales@alkatraders.co', 21.7645000, 72.1519000, 0, TRUE);

-- ============================================================================
-- 7. STORE SETTINGS (11)
-- ============================================================================

INSERT INTO store_settings (id, "key", value, category) VALUES
('s0000001-0000-0000-0000-000000000001', 'site.companyName',              '"Alka Traders"',                               'site'),
('s0000002-0000-0000-0000-000000000002', 'site.tagline',                  '"Marine and Industrial Equipment"',             'site'),
('s0000003-0000-0000-0000-000000000003', 'site.email',                    '"sales@alkatraders.co"',                       'site'),
('s0000004-0000-0000-0000-000000000004', 'site.phone',                    '"+91 87990 95041"',                           'site'),
('s0000005-0000-0000-0000-000000000005', 'site.whatsappNumber',           '"918799095041"',                              'site'),
('s0000006-0000-0000-0000-000000000006', 'site.currency',                 '"USD"',                                       'site'),
('s0000007-0000-0000-0000-000000000007', 'site.rfqEmail',                 '"sales@alkatraders.co"',                       'site'),
('s0000008-0000-0000-0000-000000000008', 'site.emergencyEmail',           '"sales@alkatraders.co"',                 'site'),
('s0000009-0000-0000-0000-000000000009', 'checkout.shippingCost',         '25',                                          'checkout'),
('s0000010-0000-0000-0000-000000000010', 'checkout.taxRate',              '0.08',                                        'checkout'),
('s0000011-0000-0000-0000-000000000011', 'checkout.freeShippingThreshold','500',                                         'checkout')
ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- 8. HOMEPAGE SECTIONS (8)
-- ============================================================================

INSERT INTO homepage_sections (id, section_type, label, is_enabled, sort_order, config) VALUES
('h0000001-0000-0000-0000-000000000001', 'hero',        'Hero Banner',        TRUE, 0, '{}'),
('h0000002-0000-0000-0000-000000000002', 'featured',    'Featured Products',  TRUE, 1, '{}'),
('h0000003-0000-0000-0000-000000000003', 'stats',       'Stats Bar',          TRUE, 2, '{}'),
('h0000004-0000-0000-0000-000000000004', 'categories',  'Categories Grid',    TRUE, 3, '{}'),
('h0000005-0000-0000-0000-000000000005', 'brands',      'Brand Marquee',      TRUE, 4, '{}'),
('h0000006-0000-0000-0000-000000000006', 'testimonials','Testimonials',       TRUE, 5, '{}'),
('h0000007-0000-0000-0000-000000000007', 'industries',  'Industries Tabs',    TRUE, 6, '{}'),
('h0000008-0000-0000-0000-000000000008', 'cta',         'RFQ CTA',            TRUE, 7, '{}');

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
-- Summary:
-- - 0 products (catalog intentionally empty)
-- - 22+ brands
-- - 6 industries
-- - 19 categories
-- - 3 testimonials
-- - 4 offices
-- - 11 store settings
-- - 8 homepage sections
-- ============================================================================
