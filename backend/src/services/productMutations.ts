import { prisma } from '../server.js'
import { generateSlug } from '../utils/helpers.js'
import { productAdminInclude } from '../utils/prisma-helpers.js'
import { logAudit } from '../utils/audit.js'
import type { AuthUser } from '../middleware/auth.js'

// ─── Helpers ──────────────────────────────────────────────────

function validateId(id: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw Object.assign(new Error('Invalid product ID format'), { status: 400 })
  }
}

// ─── Create Product ────────────────────────────────────────────

export async function createProduct(data: any, actor: AuthUser, ipAddress = '') {
  const { specs, images, industryIds, ...fields } = data

  let slug = generateSlug(fields.name)
  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const existingSku = await prisma.product.findUnique({ where: { sku: fields.sku } })
  if (existingSku) {
    throw Object.assign(new Error('SKU already exists'), { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      ...fields, slug,
      createdBy: actor.id, updatedBy: actor.id,
      ...(specs?.length ? {
        specs: { create: specs.map((s: any, i: number) => ({ name: s.name, value: s.value, isPublic: s.isPublic ?? true, sortOrder: i })) },
      } : {}),
      ...(images?.length ? {
        images: { create: images.map((img: any, i: number) => ({ url: img.url, altText: img.altText, label: img.label, isMain: img.isMain ?? (i === 0), sortOrder: i })) },
      } : {}),
      ...(industryIds?.length ? {
        industries: { create: industryIds.map((id: string) => ({ industryId: id })) },
      } : {}),
    },
    include: productAdminInclude,
  })

  await logAudit({
    actor, action: 'product.create', entityType: 'product',
    entityId: product.id, entityName: product.name,
    newValue: { id: product.id, name: product.name, sku: product.sku, status: product.status, regularPrice: product.regularPrice },
    ipAddress,
  })

  return product
}

// ─── Update Product ────────────────────────────────────────────

export async function updateProduct(id: string, data: any, actor: AuthUser, ipAddress = '') {
  validateId(id)

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    throw Object.assign(new Error('Product not found'), { status: 404 })
  }

  const { specs, images, industryIds, ...fields } = data

  if (fields.name && fields.name !== existing.name) {
    let slug = generateSlug(fields.name)
    const slugExists = await prisma.product.findFirst({ where: { slug, id: { not: id } } })
    if (slugExists) slug = `${slug}-${Date.now()}`
    fields.slug = slug
  }

  if (fields.sku && fields.sku !== existing.sku) {
    const skuExists = await prisma.product.findUnique({ where: { sku: fields.sku } })
    if (skuExists) {
      throw Object.assign(new Error('SKU already exists'), { status: 400 })
    }
  }

  if (specs) {
    await prisma.productSpec.deleteMany({ where: { productId: id } })
    if (specs.length) {
      await prisma.productSpec.createMany({
        data: specs.map((s: any, i: number) => ({ productId: id, name: s.name, value: s.value, isPublic: s.isPublic ?? true, sortOrder: i })),
      })
    }
  }
  if (images) {
    await prisma.productImage.deleteMany({ where: { productId: id } })
    if (images.length) {
      await prisma.productImage.createMany({
        data: images.map((img: any, i: number) => ({ productId: id, url: img.url, altText: img.altText, label: img.label, isMain: img.isMain ?? (i === 0), sortOrder: i })),
      })
    }
  }
  if (industryIds) {
    await prisma.productIndustry.deleteMany({ where: { productId: id } })
    if (industryIds.length) {
      await prisma.productIndustry.createMany({
        data: industryIds.map((industryId: string) => ({ productId: id, industryId })),
      })
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: { ...fields, updatedBy: actor.id },
    include: productAdminInclude,
  })

  await logAudit({
    actor, action: 'product.update', entityType: 'product',
    entityId: product.id, entityName: product.name,
    previousValue: { id: existing.id, name: existing.name, sku: existing.sku, status: existing.status, regularPrice: existing.regularPrice },
    newValue: { id: product.id, name: product.name, sku: product.sku, status: product.status, regularPrice: product.regularPrice },
    ipAddress,
  })

  return product
}

// ─── Archive Product ───────────────────────────────────────────

export async function archiveProduct(id: string, actor: AuthUser, ipAddress = '') {
  validateId(id)

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    throw Object.assign(new Error('Product not found'), { status: 404 })
  }

  await prisma.product.update({
    where: { id },
    data: { status: 'archived', updatedBy: actor.id },
  })

  await logAudit({
    actor, action: 'product.archive', entityType: 'product',
    entityId: product.id, entityName: product.name,
    previousValue: { id: product.id, name: product.name, sku: product.sku, status: product.status },
    ipAddress,
  })
}

// ─── Bulk Update ───────────────────────────────────────────────

export async function bulkUpdate(ids: string[], action: string, value: string | undefined, actor: AuthUser, ipAddress = '') {
  let updateData: any = {}
  switch (action) {
    case 'publish': updateData = { status: 'published' }; break
    case 'unpublish': updateData = { status: 'hidden' }; break
    case 'archive': updateData = { status: 'archived' }; break
    case 'set-featured': updateData = { isFeatured: true }; break
    case 'unset-featured': updateData = { isFeatured: false }; break
    case 'set-new-arrival': updateData = { isNewArrival: true }; break
    case 'set-category': updateData = { categoryId: value }; break
    case 'set-brand': updateData = { brandId: value }; break
    default: throw Object.assign(new Error('Invalid action'), { status: 400 })
  }

  updateData.updatedBy = actor.id

  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: updateData,
  })

  await logAudit({
    actor, action: `product.bulk.${action}`, entityType: 'product',
    newValue: { ids, action, value, affected: result.count },
    ipAddress,
  })

  return { updated: result.count }
}

// ─── Duplicate Product ─────────────────────────────────────────

export async function duplicateProduct(id: string, actor: AuthUser, ipAddress = '') {
  validateId(id)

  const source = await prisma.product.findUnique({
    where: { id },
    include: { specs: true, images: true, industries: { select: { industryId: true } } },
  })
  if (!source) throw Object.assign(new Error('Product not found'), { status: 404 })

  let slug = generateSlug(source.name + ' Copy')
  const slugExists = await prisma.product.findUnique({ where: { slug } })
  if (slugExists) slug = `${slug}-${Date.now()}`

  let sku = `${source.sku}-COPY`
  const skuExists = await prisma.product.findUnique({ where: { sku } })
  if (skuExists) sku = `${source.sku}-COPY-${Date.now()}`

  const product = await prisma.product.create({
    data: {
      name: `${source.name} (Copy)`, slug, sku,
      brandId: source.brandId, categoryId: source.categoryId,
      status: 'draft', availability: source.availability, condition: source.condition,
      shortDescription: source.shortDescription, description: source.description,
      regularPrice: source.regularPrice, salePrice: source.salePrice,
      currency: source.currency, showPrice: source.showPrice, makeOfferEnabled: source.makeOfferEnabled,
      stockCount: 0, lowStockThreshold: source.lowStockThreshold,
      warehouseLocation: source.warehouseLocation, leadTime: source.leadTime,
      isNewArrival: false, isFeatured: false,
      customLabel: source.customLabel, customLabelColor: source.customLabelColor,
      seoTitle: source.seoTitle, seoDescription: source.seoDescription,
      seoKeywords: source.seoKeywords,
      keyFeatures: source.keyFeatures, compatibilityNotes: source.compatibilityNotes,
      conditionNotes: source.conditionNotes, warrantyNotes: source.warrantyNotes,
      includedItems: source.includedItems, excludedItems: source.excludedItems,
      productType: source.productType,
      createdBy: actor.id, updatedBy: actor.id,
      specs: { create: source.specs.map((s, i) => ({ name: s.name, value: s.value, isPublic: s.isPublic, sortOrder: i })) },
      images: { create: source.images.map((img, i) => ({ url: img.url, altText: img.altText, label: img.label, isMain: img.isMain, sortOrder: i })) },
      ...(source.industries.length ? { industries: { create: source.industries.map((ind) => ({ industryId: ind.industryId })) } } : {}),
    },
    include: productAdminInclude,
  })

  await logAudit({
    actor, action: 'product.duplicate', entityType: 'product',
    entityId: product.id, entityName: product.name,
    newValue: { sourceId: source.id, sourceName: source.name },
    ipAddress,
  })

  return product
}
