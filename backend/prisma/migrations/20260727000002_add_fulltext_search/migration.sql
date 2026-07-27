-- Full-text search indexes for product search performance
-- Enables efficient LIKE '%term%' queries and tsvector-based search

-- Enable pg_trgm extension for trigram-based fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index on product name + description for full-text search (English)
CREATE INDEX IF NOT EXISTS idx_products_fts
  ON products
  USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- GIN trigram index on product name for fast partial matches
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products
  USING GIN (name gin_trgm_ops);

-- GIN trigram index on product SKU for fast SKU search
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
  ON products
  USING GIN (sku gin_trgm_ops);

-- GIN trigram index on brand name for brand search
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm
  ON brands
  USING GIN (name gin_trgm_ops);

-- GIN trigram index on category name for category search
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
  ON categories
  USING GIN (name gin_trgm_ops);
