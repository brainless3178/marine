import { prisma } from '../server.js'
import { getEffectivePrice, isOnSale, generateSlug, paginationParams, paginationResponse } from '../utils/helpers.js'
import { productAdminInclude, productInclude } from '../utils/prisma-helpers.js'
import { logAudit } from '../utils/audit.js'
import type { AuthUser } from '../middleware/auth.js'

// ─── Types ────────────────────────────────────────────────────

export interface ProductFilters {
  status?: string
  availability?: string
  condition?: string
  brandId?: string
  brand?: string
  categoryId?: string
  category?: string
  industry?: string
  search?: string
  onSale?: boolean
  isNewArrival?: boolean
  isFeatured?: boolean
  makeOffer?: boolean
  priceMin?: number
  priceMax?: number
  sort?: string
  page?: number
  limit?: number
}

// ─── Queries (Admin) ──────────────────────────────────────────

export async function listProducts(params: ProductFilters) {
  const { page, limit, skip } = paginationParams(params.page, params.limit)

  const where: any = {}
  if (params.status) where.status = params.status
  if (params.availability) where.availability = params.availability
  if (params.condition) where.condition = params.condition
  if (params.brandId) where.brandId = params.brandId
  if (params.categoryId) where.categoryId = params.categoryId
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
    ]
  }
  if (params.isNewArrival) where.isNewArrival = true
  if (params.isFeatured) where.isFeatured = true

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productAdminInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return { products, pagination: paginationResponse(total, page, limit) }
}

// ─── Queries (Storefront) ──────────────────────────────────────

export async function listStorefrontProducts(params: ProductFilters) {
  const { page, limit, skip } = paginationParams(params.page, params.limit)

  const where: any = { status: 'published' }
  if (params.category) where.category = { slug: params.category }
  if (params.brand) where.brand = { slug: params.brand }
  if (params.industry) where.industries = { some: { industry: { slug: params.industry } } }
  if (params.condition) where.condition = params.condition
  if (params.availability) where.availability = params.availability
  if (params.onSale) where.salePrice = { not: null }
  if (params.isNewArrival) where.isNewArrival = true
  if (params.isFeatured) where.isFeatured = true
  if (params.makeOffer) where.makeOfferEnabled = true
  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    where.regularPrice = {}
    if (params.priceMin !== undefined) where.regularPrice.gte = params.priceMin
    if (params.priceMax !== undefined) where.regularPrice.lte = params.priceMax
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
      { brand: { name: { contains: params.search, mode: 'insensitive' } } },
    ]
  }

  let orderBy: any = { createdAt: 'desc' }
  if (params.sort === 'price-asc') orderBy = { regularPrice: 'asc' }
  else if (params.sort === 'price-desc') orderBy = { regularPrice: 'desc' }
  else if (params.sort === 'name-asc') orderBy = { name: 'asc' }
  else if (params.sort === 'name-desc') orderBy = { name: 'desc' }
  else if (params.sort === 'newest') orderBy = { createdAt: 'desc' }
  else if (params.sort === 'oldest') orderBy = { createdAt: 'asc' }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
  ])

  return {
    products: products.map(p => ({ ...p, price: getEffectivePrice(p), onSale: isOnSale(p), inStock: p.stockCount > 0 })),
    pagination: paginationResponse(total, page, limit),
  }
}

export async function getStorefrontProduct(id: string) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], status: 'published' },
    include: productInclude,
  })
  if (!product) return null
  return { ...product, price: getEffectivePrice(product), onSale: isOnSale(product), inStock: product.stockCount > 0 }
}

export async function getRelatedProducts(id: string, categoryId: string | null, brandId: string | null, take = 4) {
  const related = await prisma.product.findMany({
    where: {
      status: 'published',
      id: { not: id },
      OR: [
        ...(categoryId ? [{ categoryId }] : []),
        ...(brandId ? [{ brandId }] : []),
      ],
    },
    include: productInclude,
    take,
    orderBy: { createdAt: 'desc' },
  })
  return related.map(p => ({ ...p, price: getEffectivePrice(p), onSale: isOnSale(p), inStock: p.stockCount > 0 }))
}

export async function getFeaturedProducts(take = 8) {
  return prisma.product.findMany({
    where: { status: 'published', isFeatured: true },
    include: productInclude,
    take,
    orderBy: { sortPriority: 'desc' },
  })
}

export async function getNewArrivals(take = 8) {
  return prisma.product.findMany({
    where: { status: 'published', isNewArrival: true },
    include: productInclude,
    take,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getEmergencyProducts(take = 12) {
  return prisma.product.findMany({
    where: { status: 'published', availability: 'emergency' },
    include: productInclude,
    take,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProductCategoryAndBrand(id: string) {
  return prisma.product.findUnique({ where: { id }, select: { categoryId: true, brandId: true } })
}

export async function getFilterCounts() {
  const publishedWhere: any = { status: 'published' }

  const [categories, brands, priceAgg] = await Promise.all([
    prisma.category.findMany({
      where: { isVisible: true },
      include: { _count: { select: { products: { where: { status: 'published' } } } } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.brand.findMany({
      where: { isVisible: true },
      include: { _count: { select: { products: { where: { status: 'published' } } } } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.product.aggregate({ where: { status: 'published' }, _min: { regularPrice: true }, _max: { regularPrice: true } }),
  ])

  return {
    categories: categories.map(c => ({ id: c.slug, name: c.name, count: c._count.products })),
    brands: brands.map(b => ({ id: b.slug, name: b.name, count: b._count.products })),
    priceRange: { min: Number(priceAgg._min.regularPrice) || 0, max: Number(priceAgg._max.regularPrice) || 1000 },
  }
}

export async function getProduct(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw Object.assign(new Error('Invalid product ID format'), { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: productAdminInclude,
  })

  if (!product) {
    throw Object.assign(new Error('Product not found'), { status: 404 })
  }

  return product
}

// ─── Mutations ────────────────────────────────────────────────

export async function createProduct(data: any, actor: AuthUser, ipAddress = '') {
  const { specs, images, industryIds, ...fields } = data

  // Generate unique slug
  let slug = generateSlug(fields.name)
  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  // Validate unique SKU
  const existingSku = await prisma.product.findUnique({ where: { sku: fields.sku } })
  if (existingSku) {
    throw Object.assign(new Error('SKU already exists'), { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      ...fields,
      slug,
      createdBy: actor.id,
      updatedBy: actor.id,
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
    actor,
    action: 'product.create',
    entityType: 'product',
    entityId: product.id,
    entityName: product.name,
    newValue: { id: product.id, name: product.name, sku: product.sku, status: product.status, regularPrice: product.regularPrice },
    ipAddress,
  })

  return product
}

export async function updateProduct(id: string, data: any, actor: AuthUser, ipAddress = '') {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw Object.assign(new Error('Invalid product ID format'), { status: 400 })
  }

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    throw Object.assign(new Error('Product not found'), { status: 404 })
  }

  const { specs, images, industryIds, ...fields } = data

  // Update slug if name changed
  if (fields.name && fields.name !== existing.name) {
    let slug = generateSlug(fields.name)
    const slugExists = await prisma.product.findFirst({ where: { slug, id: { not: id } } })
    if (slugExists) slug = `${slug}-${Date.now()}`
    fields.slug = slug
  }

  // Check SKU uniqueness if changed
  if (fields.sku && fields.sku !== existing.sku) {
    const skuExists = await prisma.product.findUnique({ where: { sku: fields.sku } })
    if (skuExists) {
      throw Object.assign(new Error('SKU already exists'), { status: 400 })
    }
  }

  // Update related entities
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
    actor,
    action: 'product.update',
    entityType: 'product',
    entityId: product.id,
    entityName: product.name,
    previousValue: { id: existing.id, name: existing.name, sku: existing.sku, status: existing.status, regularPrice: existing.regularPrice },
    newValue: { id: product.id, name: product.name, sku: product.sku, status: product.status, regularPrice: product.regularPrice },
    ipAddress,
  })

  return product
}

export async function archiveProduct(id: string, actor: AuthUser, ipAddress = '') {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw Object.assign(new Error('Invalid product ID format'), { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    throw Object.assign(new Error('Product not found'), { status: 404 })
  }

  await prisma.product.update({
    where: { id },
    data: { status: 'archived', updatedBy: actor.id },
  })

  await logAudit({
    actor,
    action: 'product.archive',
    entityType: 'product',
    entityId: product.id,
    entityName: product.name,
    previousValue: { id: product.id, name: product.name, sku: product.sku, status: product.status },
    ipAddress,
  })
}

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
    actor,
    action: `product.bulk.${action}`,
    entityType: 'product',
    newValue: { ids, action, value, affected: result.count },
    ipAddress,
  })

  return { updated: result.count }
}

export async function duplicateProduct(id: string, actor: AuthUser, ipAddress = '') {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw Object.assign(new Error('Invalid product ID format'), { status: 400 })
  }

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
      name: `${source.name} (Copy)`,
      slug, sku,
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
    actor,
    action: 'product.duplicate',
    entityType: 'product',
    entityId: product.id,
    entityName: product.name,
    newValue: { sourceId: source.id, sourceName: source.name },
    ipAddress,
  })

  return product
}

export async function importProducts(rows: any[], actor: AuthUser, ipAddress = '') {
  if (!Array.isArray(rows) || !rows.length) {
    throw Object.assign(new Error('rows array is required'), { status: 400 })
  }

  let created = 0, skipped = 0
  const errors: string[] = []

  for (const row of rows.slice(0, 500)) {
    try {
      if (!row.name || !row.sku) { skipped++; errors.push(`Row ${created + skipped}: missing name or sku`); continue }

      const existing = await prisma.product.findUnique({ where: { sku: row.sku } })
      if (existing) { skipped++; continue }

      let slug = generateSlug(row.name)
      const slugExists = await prisma.product.findUnique({ where: { slug } })
      if (slugExists) slug = `${slug}-${Date.now()}`

      await prisma.product.create({
        data: {
          name: row.name, slug, sku: row.sku,
          brandId: row.brandId || null, categoryId: row.categoryId || null,
          status: row.status || 'draft', condition: row.condition || 'used', availability: row.availability || 'in-stock',
          shortDescription: row.shortDescription || null, description: row.description || null,
          regularPrice: Number(row.regularPrice) || 0, salePrice: row.salePrice ? Number(row.salePrice) : null,
          stockCount: Number(row.stockCount) || 0, currency: row.currency || 'USD',
          makeOfferEnabled: row.makeOfferEnabled === true || row.makeOfferEnabled === 'true',
          isNewArrival: row.isNewArrival === true || row.isNewArrival === 'true',
          isFeatured: row.isFeatured === true || row.isFeatured === 'true',
          createdBy: actor.id, updatedBy: actor.id,
        },
      })
      created++
    } catch (err: any) {
      skipped++
      errors.push(`Row ${created + skipped}: ${err.message}`)
    }
  }

  await logAudit({
    actor,
    action: 'product.import.csv',
    entityType: 'product',
    newValue: { created, skipped, totalRows: rows.length },
    ipAddress,
  })

  return { created, skipped, errors: errors.slice(0, 20) }
}

export async function exportProductsCsv(params: { status?: string; page?: number; limit?: number }) {
  const { page, limit, skip } = paginationParams(params.page, params.limit)

  const where: any = {}
  if (params.status) where.status = params.status

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { brand: { select: { name: true } }, category: { select: { name: true } }, images: { where: { isMain: true }, take: 1, select: { url: true } } },
      orderBy: { createdAt: 'desc' }, skip, take: limit,
    }),
    prisma.product.count({ where }),
  ])

  const headers = ['SKU', 'Name', 'Brand', 'Category', 'Status', 'Condition', 'Availability',
    'Regular Price', 'Sale Price', 'Stock Count', 'New Arrival', 'Featured', 'Make Offer', 'Created At']

  const rows = products.map(p => [
    p.sku,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.brand?.name || '', p.category?.name || '',
    p.status, p.condition, p.availability,
    p.regularPrice.toString(), p.salePrice?.toString() || '', p.stockCount.toString(),
    p.isNewArrival ? 'Yes' : 'No', p.isFeatured ? 'Yes' : 'No', p.makeOfferEnabled ? 'Yes' : 'No',
    p.createdAt.toISOString(),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  return { csv, total }
}
