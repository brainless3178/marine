-- Add updated_at to product_images (schema drift: model has @updatedAt, no migration created it)
ALTER TABLE "product_images" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex (missing from prod — declared in schema, never migrated)
CREATE UNIQUE INDEX "media_assets_hash_key" ON "media_assets"("hash");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_product_id_sort_order_key" ON "product_images"("product_id", "sort_order");
