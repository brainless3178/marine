-- Drop content tables no public page reads (static content lives in the
-- frontend: src/data/testimonials.ts). Keeps the database to what pages use.
DROP TABLE IF EXISTS "testimonials";
DROP TABLE IF EXISTS "offices";
DROP TABLE IF EXISTS "homepage_sections";