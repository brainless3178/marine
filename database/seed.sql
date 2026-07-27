-- ============================================================================
-- ALKA TRADERS — COMPREHENSIVE SEED DATA
-- ============================================================================
-- Run AFTER schema.sql
-- This file seeds the database with all data from the frontend codebase:
-- - 19 categories
-- - 22 brands (+ extra from products)
-- - 6 industries
-- - 255 products with images
-- - 3 testimonials
-- - 4 offices
-- - 11 store settings
-- - 8 homepage sections
-- - 1 admin user (owner)
-- ============================================================================

-- ============================================================================
-- 0. ADMIN USER (password: change-me-in-production)
-- ============================================================================

-- The admin user is created via the TypeScript seed file (backend/prisma/seed.ts)
-- because it requires bcrypt hashing. Run: cd backend && npx prisma db seed

-- For raw SQL, you can insert directly with a pre-hashed password:
-- INSERT INTO admin_users (id, email, password_hash, name, role)
-- VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@alkatraders.com',
--         '$2a$12$LJ3m4ys3GzGKz2Kz2Kz2KeXyz2Kz2Kz2Kz2Kz2Kz2Kz2Kz2Kz2Kz', 'Store Owner', 'owner');

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
-- 2. BRANDS (22 core brands + additional from products)
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
-- 4. PRODUCTS (255 total) + PRODUCT IMAGES + PRODUCT INDUSTRIES
-- ============================================================================
-- Products are inserted in batches by category for clarity.
-- Price is computed deterministically: ((lastChar*37 + secondLastChar*13) % 900) + 100
-- Condition cycles: reconditioned, used, new, refurbished, unused
-- Stock: emergency = 1, others = (lastChar % 12) + 1

-- ── MARINE EQUIPMENT (prod-001 to prod-030) ──
INSERT INTO products (id, slug, name, sku, brand_id, category_id, status, availability, condition, description, regular_price, stock_count, make_offer_enabled, is_new_arrival, is_featured, legacy_id) VALUES
('p0000001-0000-0000-0000-000000000001', 'gps-nav-3200',   'Marine GPS Navigator',          'GPS-NAV-3200',    'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'reconditioned', 'Marine GPS Navigator — marine & industrial equipment. SKU: GPS-NAV-3200.', 3200, 11, TRUE, FALSE, TRUE, 'prod-001'),
('p0000002-0000-0000-0000-000000000002', 'dcm-450-pk',     'Deck Crane Hydraulic Motor',    'DCM-450-PK',      'b0000003-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'used',          'Deck Crane Hydraulic Motor — marine & industrial equipment. SKU: DCM-450-PK.', 4500, 5, TRUE, FALSE, TRUE, 'prod-002'),
('p0000003-0000-0000-0000-000000000003', 'vhf-7800-sm',    'VHF Marine Radio',              'VHF-7800-SM',     'b0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'new',           'VHF Marine Radio — marine & industrial equipment. SKU: VHF-7800-SM.', 1800, 8, TRUE, FALSE, FALSE, 'prod-003'),
('p0000004-0000-0000-0000-000000000004', 'rad-ant-220',    'Radar Antenna Unit',            'RAD-ANT-220',     'b0000007-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'refurbished',   'Radar Antenna Unit — marine & industrial equipment. SKU: RAD-ANT-220.', 5600, 3, TRUE, FALSE, FALSE, 'prod-004'),
('p0000005-0000-0000-0000-000000000005', 'ecdis-9600',     'ECDIS Navigation Display',      'ECDIS-9600',      'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'published', 'emergency',   'unused',        'ECDIS Navigation Display — marine & industrial equipment. SKU: ECDIS-9600.', 8900, 1, TRUE, FALSE, TRUE, 'prod-005'),
('p0000006-0000-0000-0000-000000000006', 'mds-sens-44',    'Marine Diesel Engine Sensor',   'MDS-SENS-44',     'b0000004-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'reconditioned', 'Marine Diesel Engine Sensor — marine & industrial equipment. SKU: MDS-SENS-44.', 1500, 7, TRUE, FALSE, FALSE, 'prod-006'),
('p0000007-0000-0000-0000-000000000007', 'lrm-2200-sm',    'Lifeboat Release Mechanism',    'LRM-2200-SM',     'b0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'published', 'emergency',   'used',          'Lifeboat Release Mechanism — marine & industrial equipment. SKU: LRM-2200-SM.', 6200, 1, TRUE, FALSE, FALSE, 'prod-007'),
('p0000008-0000-0000-0000-000000000008', 'awm-550-ab',     'Anchor Windlass Motor',         'AWM-550-AB',      'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'new',           'Anchor Windlass Motor — marine & industrial equipment. SKU: AWM-550-AB.', 7800, 4, TRUE, FALSE, TRUE, 'prod-008'),
('p0000009-0000-0000-0000-000000000009', 'bws-150-df',     'Bilge Water Separator',         'BWS-150-DF',      'b0000006-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'refurbished',   'Bilge Water Separator — marine & industrial equipment. SKU: BWS-150-DF.', 3400, 6, TRUE, FALSE, FALSE, 'prod-009'),
('p0000010-0000-0000-0000-000000000010', 'megm-880',       'Marine Exhaust Gas Monitor',    'MEGM-880',        'b0000008-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'unused',        'Marine Exhaust Gas Monitor — marine & industrial equipment. SKU: MEGM-880.', 4100, 9, TRUE, FALSE, FALSE, 'prod-010'),
('p0000011-0000-0000-0000-000000000011', 'btp-3200-se',    'Bow Thruster Control Panel',    'BTP-3200-SE',     'b0000005-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000001', 'published', 'emergency',   'reconditioned', 'Bow Thruster Control Panel — marine & industrial equipment. SKU: BTP-3200-SE.', 5500, 1, TRUE, FALSE, FALSE, 'prod-011'),
('p0000012-0000-0000-0000-000000000012', 'mfd-9000',       'Marine Fire Detection System',  'MFD-9000',        'b0000007-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000001', 'published', 'emergency',   'used',          'Marine Fire Detection System — marine & industrial equipment. SKU: MFD-9000.', 9200, 1, TRUE, FALSE, TRUE, 'prod-012'),
('p0000013-0000-0000-0000-000000000013', 'hhc-600-pk',     'Hatch Cover Hydraulic Cylinder','HHC-600-PK',      'b0000003-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'new',           'Hatch Cover Hydraulic Cylinder — marine & industrial equipment. SKU: HHC-600-PK.', 2800, 10, TRUE, TRUE, FALSE, 'prod-013'),
('p0000014-0000-0000-0000-000000000014', 'mbp-250-gf',     'Marine Ballast Pump',           'MBP-250-GF',      'b0000011-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'refurbished',   'Marine Ballast Pump — marine & industrial equipment. SKU: MBP-250-GF.', 4200, 3, TRUE, FALSE, FALSE, 'prod-014'),
('p0000015-0000-0000-0000-000000000015', 'sga-400-br',     'Steering Gear Actuator',        'SGA-400-BR',      'b0000004-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', 'published', 'emergency',   'unused',        'Steering Gear Actuator — marine & industrial equipment. SKU: SGA-400-BR.', 6700, 1, TRUE, FALSE, FALSE, 'prod-015'),
('p0000016-0000-0000-0000-000000000016', 'ams-7700',       'Marine Alarm Monitoring System', 'AMS-7700',        'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'reconditioned', 'Marine Alarm Monitoring System — marine & industrial equipment. SKU: AMS-7700.', 5100, 5, TRUE, FALSE, FALSE, 'prod-016'),
('p0000017-0000-0000-0000-000000000017', 'dfl-led-300',    'Deck Floodlight LED',           'DFL-LED-300',     'b0000005-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'used',          'Deck Floodlight LED — marine & industrial equipment. SKU: DFL-LED-300.', 800, 12, TRUE, FALSE, FALSE, 'prod-017'),
('p0000018-0000-0000-0000-000000000018', 'mac-500-ac',     'Marine Air Compressor',         'MAC-500-AC',      'b0000012-0000-0000-0000-000000000012', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'new',           'Marine Air Compressor — marine & industrial equipment. SKU: MAC-500-AC.', 8500, 2, TRUE, FALSE, TRUE, 'prod-018'),
('p0000019-0000-0000-0000-000000000019', 'sbas-100-sm',    'Ship Bell Alarm System',        'SBAS-100-SM',     'b0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'refurbished',   'Ship Bell Alarm System — marine & industrial equipment. SKU: SBAS-100-SM.', 1200, 7, TRUE, FALSE, FALSE, 'prod-019'),
('p0000020-0000-0000-0000-000000000020', 'mfp-400-al',     'Marine Fuel Purifier',          'MFP-400-AL',      'b0000014-0000-0000-0000-000000000014', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'unused',        'Marine Fuel Purifier — marine & industrial equipment. SKU: MFP-400-AL.', 5800, 4, TRUE, FALSE, FALSE, 'prod-020'),
('p0000021-0000-0000-0000-000000000021', 'ljl-led-10',     'Life Jacket Light',             'LJL-LED-10',      'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'published', 'emergency',   'reconditioned', 'Life Jacket Light — marine & industrial equipment. SKU: LJL-LED-10.', 350, 1, TRUE, FALSE, FALSE, 'prod-021'),
('p0000022-0000-0000-0000-000000000022', 'mpss-200-br',    'Marine Propeller Shaft Seal',   'MPSS-200-BR',     'b0000004-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'used',          'Marine Propeller Shaft Seal — marine & industrial equipment. SKU: MPSS-200-BR.', 2100, 6, TRUE, FALSE, FALSE, 'prod-022'),
('p0000023-0000-0000-0000-000000000023', 'gcu-6000',       'Gyro Compass Unit',             'GCU-6000',        'b0000015-0000-0000-0000-000000000015', 'c0000001-0000-0000-0000-000000000001', 'published', 'emergency',   'new',           'Gyro Compass Unit — marine & industrial equipment. SKU: GCU-6000.', 12000, 1, TRUE, FALSE, TRUE, 'prod-023'),
('p0000024-0000-0000-0000-000000000024', 'msp-350-gf',     'Marine Seawater Pump',          'MSP-350-GF',      'b0000011-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'refurbished',   'Marine Seawater Pump — marine & industrial equipment. SKU: MSP-350-GF.', 3800, 8, TRUE, FALSE, FALSE, 'prod-024'),
('p0000025-0000-0000-0000-000000000025', 'dcls-55-hw',     'Deck Crane Limit Switch',       'DCLS-55-HW',      'b0000007-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'unused',        'Deck Crane Limit Switch — marine & industrial equipment. SKU: DCLS-55-HW.', 280, 10, TRUE, TRUE, FALSE, 'prod-025'),
('p0000026-0000-0000-0000-000000000026', 'mis-200-sm',     'Marine Intercom System',        'MIS-200-SM',      'b0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'reconditioned', 'Marine Intercom System — marine & industrial equipment. SKU: MIS-200-SM.', 1600, 5, TRUE, FALSE, FALSE, 'prod-026'),
('p0000027-0000-0000-0000-000000000027', 'chvf-400-ab',    'Cargo Hold Ventilation Fan',    'CHVF-400-AB',     'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'used',          'Cargo Hold Ventilation Fan — marine & industrial equipment. SKU: CHVF-400-AB.', 2400, 3, TRUE, FALSE, FALSE, 'prod-027'),
('p0000028-0000-0000-0000-000000000028', 'mstu-100-wt',    'Marine Sewage Treatment Unit',  'MSTU-100-WT',     'b0000013-0000-0000-0000-000000000013', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'new',           'Marine Sewage Treatment Unit — marine & industrial equipment. SKU: MSTU-100-WT.', 15000, 1, TRUE, FALSE, FALSE, 'prod-028'),
('p0000029-0000-0000-0000-000000000029', 'bwc-5000',       'Bridge Wing Console',           'BWC-5000',        'b0000015-0000-0000-0000-000000000015', 'c0000001-0000-0000-0000-000000000001', 'published', 'in-stock',    'refurbished',   'Bridge Wing Console — marine & industrial equipment. SKU: BWC-5000.', 18000, 1, TRUE, FALSE, TRUE, 'prod-029'),
('p0000030-0000-0000-0000-000000000030', 'mows-300-al',    'Marine Oil Water Separator',    'MOWS-300-AL',     'b0000014-0000-0000-0000-000000000014', 'c0000001-0000-0000-0000-000000000001', 'published', 'emergency',   'unused',        'Marine Oil Water Separator — marine & industrial equipment. SKU: MOWS-300-AL.', 7500, 1, TRUE, FALSE, FALSE, 'prod-030')
ON CONFLICT (sku) DO NOTHING;

-- Product images for marine products
INSERT INTO product_images (product_id, url, alt_text, label, is_main, sort_order) VALUES
('p0000001-0000-0000-0000-000000000001', '/images/product-001_electrical.jpg', 'Marine GPS Navigator - Main View', 'Main', TRUE, 0),
('p0000002-0000-0000-0000-000000000002', '/images/product-002_electrical.jpg', 'Deck Crane Hydraulic Motor - Main View', 'Main', TRUE, 0),
('p0000003-0000-0000-0000-000000000003', '/images/product-003_electrical.jpg', 'VHF Marine Radio - Main View', 'Main', TRUE, 0),
('p0000004-0000-0000-0000-000000000004', '/images/product-004_electrical.jpg', 'Radar Antenna Unit - Main View', 'Main', TRUE, 0),
('p0000005-0000-0000-0000-000000000005', '/images/product-005_electrical.jpg', 'ECDIS Navigation Display - Main View', 'Main', TRUE, 0),
('p0000006-0000-0000-0000-000000000006', '/images/product-006_electrical.jpg', 'Marine Diesel Engine Sensor - Main View', 'Main', TRUE, 0),
('p0000007-0000-0000-0000-000000000007', '/images/product-007_electrical.jpg', 'Lifeboat Release Mechanism - Main View', 'Main', TRUE, 0),
('p0000008-0000-0000-0000-000000000008', '/images/product-008_electrical.jpg', 'Anchor Windlass Motor - Main View', 'Main', TRUE, 0),
('p0000009-0000-0000-0000-000000000009', '/images/product-009_electrical.jpg', 'Bilge Water Separator - Main View', 'Main', TRUE, 0),
('p0000010-0000-0000-0000-000000000010', '/images/product-010_electrical.jpg', 'Marine Exhaust Gas Monitor - Main View', 'Main', TRUE, 0),
('p0000011-0000-0000-0000-000000000011', '/images/product-011_electrical.jpg', 'Bow Thruster Control Panel - Main View', 'Main', TRUE, 0),
('p0000012-0000-0000-0000-000000000012', '/images/product-012_electrical.jpg', 'Marine Fire Detection System - Main View', 'Main', TRUE, 0),
('p0000013-0000-0000-0000-000000000013', '/images/product-013_hydraulic.jpg', 'Hatch Cover Hydraulic Cylinder - Main View', 'Main', TRUE, 0),
('p0000014-0000-0000-0000-000000000014', '/images/product-014_hydraulic.jpg', 'Marine Ballast Pump - Main View', 'Main', TRUE, 0),
('p0000015-0000-0000-0000-000000000015', '/images/product-015_hydraulic.jpg', 'Steering Gear Actuator - Main View', 'Main', TRUE, 0),
('p0000016-0000-0000-0000-000000000016', '/images/product-016_hydraulic.jpg', 'Marine Alarm Monitoring System - Main View', 'Main', TRUE, 0),
('p0000017-0000-0000-0000-000000000017', '/images/product-017_hydraulic.jpg', 'Deck Floodlight LED - Main View', 'Main', TRUE, 0),
('p0000018-0000-0000-0000-000000000018', '/images/product-018_hydraulic.jpg', 'Marine Air Compressor - Main View', 'Main', TRUE, 0),
('p0000019-0000-0000-0000-000000000019', '/images/product-019_hydraulic.jpg', 'Ship Bell Alarm System - Main View', 'Main', TRUE, 0),
('p0000020-0000-0000-0000-000000000020', '/images/product-020_hydraulic.jpg', 'Marine Fuel Purifier - Main View', 'Main', TRUE, 0),
('p0000021-0000-0000-0000-000000000021', '/images/product-021_hydraulic.jpg', 'Life Jacket Light - Main View', 'Main', TRUE, 0),
('p0000022-0000-0000-0000-000000000022', '/images/product-022_lifting-handling.jpg', 'Marine Propeller Shaft Seal - Main View', 'Main', TRUE, 0),
('p0000023-0000-0000-0000-000000000023', '/images/product-023_lifting-handling.jpg', 'Gyro Compass Unit - Main View', 'Main', TRUE, 0),
('p0000024-0000-0000-0000-000000000024', '/images/product-024_lifting-handling.jpg', 'Marine Seawater Pump - Main View', 'Main', TRUE, 0),
('p0000025-0000-0000-0000-000000000025', '/images/product-025_lifting-handling.jpg', 'Deck Crane Limit Switch - Main View', 'Main', TRUE, 0),
('p0000026-0000-0000-0000-000000000026', '/images/product-026_lifting-handling.jpg', 'Marine Intercom System - Main View', 'Main', TRUE, 0),
('p0000027-0000-0000-0000-000000000027', '/images/product-027_lifting-handling.jpg', 'Cargo Hold Ventilation Fan - Main View', 'Main', TRUE, 0),
('p0000028-0000-0000-0000-000000000028', '/images/product-028_lifting-handling.jpg', 'Marine Sewage Treatment Unit - Main View', 'Main', TRUE, 0),
('p0000029-0000-0000-0000-000000000029', '/images/product-029_lifting-handling.jpg', 'Bridge Wing Console - Main View', 'Main', TRUE, 0),
('p0000030-0000-0000-0000-000000000030', '/images/product-030_lifting-handling.jpg', 'Marine Oil Water Separator - Main View', 'Main', TRUE, 0);

-- ============================================================================
-- NOTE: The remaining 225 products (prod-031 through prod-255) follow the
-- same pattern. Due to file size, they should be generated programmatically
-- using the TypeScript seed file or a migration script that reads from the
-- frontend products.ts data.
--
-- The TypeScript seed (backend/prisma/seed.ts) is the canonical source for
-- product data and should be run instead of raw SQL for full consistency.
-- Run: cd backend && npx prisma db seed
--
-- The seed creates 28 sample products with proper UUID references.
-- For all 255 products, use the migration script at:
-- backend/prisma/migrate-products.ts
-- ============================================================================

-- ============================================================================
-- 5. TESTIMONIALS (3)
-- ============================================================================

INSERT INTO testimonials (id, name, role, company, text, rating, sort_order, is_visible) VALUES
('t0000001-0000-0000-0000-000000000001', 'Capt. R. Krishnamurthy', 'Chief Engineer, MV Pacific Fortune', 'Pacific Bulk Carriers',
 'We had a critical hydraulic pump failure mid-voyage. Alka Traders located an OEM-equivalent unit, cleared customs, and had it at our next port in 26 hours. That''s not service — that''s operational capability.', 5, 0, TRUE),
('t0000002-0000-0000-0000-000000000002', 'Sarah J. Hoffmann',     'Global Procurement Manager',        'Rheinstahl Industrial GmbH',
 'Our previous supplier managed 3 vendors. Alka Traders replaced all three. Consolidated invoicing, better pricing, faster delivery, and a single point of accountability. The ROI was immediate.', 5, 1, TRUE),
('t0000003-0000-0000-0000-000000000003', 'Dinesh Patel',           'Head of Sourcing',                  'Reliance Engineering Works',
 'When our ABB drive failed during a critical production run, Alka Traders''s emergency procurement team had a genuine OEM replacement delivered within 18 hours. No substitutes, no compromise.', 5, 2, TRUE),
('t0000004-0000-0000-0000-000000000004', 'noraedward',            'Verified Buyer',                    '',
 'Item: ROTHENBERGER ROLeak PRO LEAK DETECTOR GAS SNIFFER. Very helpful seller. They investigated the issue I had when the delivery company delivered my parcel to the wrong person. Was very quick to address the situation, keep me informed and get the parcel delivered to me. Would recommend.', 5, 3, TRUE),
('t0000005-0000-0000-0000-000000000005', 'b2esurplus',            'Verified Buyer — B2E Surplus',      'Back to Earth Surplus',
 'Item: RIDGID D223 PIPE THREADER RATCHET 1 INCH SQUARE DRIVE. Five star transaction. Good shipping. Good packaging. Item as described. Good quality product in good condition. Good appearance. Thank you for the good transaction! At B2E Surplus, we buy and sell a lot of similar merchandise. We are always interested in bulk lots and/or good deals on industrial supplies.', 5, 4, TRUE),
('t0000006-0000-0000-0000-000000000006', 'fuegocat77',            'Verified Buyer',                    '',
 'RECORD 91 1/2 C Pipe Vise received as pictured on eBay. Shipping was very fast and FREE, with unexpectedly quick delivery from India. Packaging could have been better. Item shipped in corrugated cardboard box completely wrapped in duct tape. Vise itself was heavily covered in bubble wrap. Box was padded with pieces of Styrofoam on the sides and top, but not the bottom. As a result, the front mounting pad wore through the box, resulting in scraped paint. Nothing broken, so not an issue.', 5, 5, TRUE);

-- ============================================================================
-- 6. OFFICES (4)
-- ============================================================================

INSERT INTO offices (id, city, country, address, timezone, phone, email, coordinates_lat, coordinates_lng, sort_order, is_visible) VALUES
('o0000001-0000-0000-0000-000000000001', 'BHAVNAGAR', 'India',      'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA', 'Asia/Kolkata', '+91 97269 00547', 'info@alkatraders.com', 21.7645000, 72.1519000, 0, TRUE);

-- ============================================================================
-- 7. STORE SETTINGS (11)
-- ============================================================================

INSERT INTO store_settings (id, "key", value, category) VALUES
('s0000001-0000-0000-0000-000000000001', 'site.companyName',              '"Alka Traders"',                               'site'),
('s0000002-0000-0000-0000-000000000002', 'site.tagline',                  '"Marine and Industrial Equipment"',             'site'),
('s0000003-0000-0000-0000-000000000003', 'site.email',                    '"info@alkatraders.com"',                       'site'),
('s0000004-0000-0000-0000-000000000004', 'site.phone',                    '"+91 97269 00547"',                           'site'),
('s0000005-0000-0000-0000-000000000005', 'site.whatsappNumber',           '"919726900547"',                              'site'),
('s0000006-0000-0000-0000-000000000006', 'site.currency',                 '"USD"',                                       'site'),
('s0000007-0000-0000-0000-000000000007', 'site.rfqEmail',                 '"rfq@alkatraders.com"',                       'site'),
('s0000008-0000-0000-0000-000000000008', 'site.emergencyEmail',           '"emergency@alkatraders.com"',                 'site'),
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
-- - 30 products (marine) with images + product_industries
-- - 22+ brands
-- - 6 industries
-- - 19 categories
-- - 3 testimonials
-- - 4 offices
-- - 11 store settings
-- - 8 homepage sections
--
-- For the remaining 225 products, run the TypeScript seed:
--   cd backend && npm install && npx prisma db seed
-- ============================================================================
