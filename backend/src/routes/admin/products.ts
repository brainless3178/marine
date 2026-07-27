import { Router } from 'express'
import { prisma } from '../../server.js'
import { authenticateAdmin, requireRole, AuthRequest } from '../../middleware/auth.js'
import { asyncHandler, validateBody } from '../../middleware/validate.js'
import { z } from 'zod'
import { generateSlug, paginationParams, paginationResponse } from '../../utils/helpers.js'
import { productAdminInclude } from '../../utils/prisma-helpers.js'
import { logAudit } from '../../utils/audit.js'

const router = Router()
router.use(authenticateAdmin)

const productSchema = z.object({
  name: z.string().min(1).max(500),
  sku: z.string().min(1).max(100),
  brandId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).optional(),
  availability: z.enum(['in-stock', 'sourced', 'emergency', 'out-of-stock']).optional(),
  condition: z.enum(['new', 'unused', 'used', 'refurbished', 'reconditioned']).optional(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  regularPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional().nullable(),
  saleStartsAt: z.string().datetime().optional().nullable(),
  saleEndsAt: z.string().datetime().optional().nullable(),
  currency: z.string().max(3).optional(),
  showPrice: z.boolean().optional(),
  makeOfferEnabled: z.boolean().optional(),
  minimumOfferPrice: z.number().min(0).optional().nullable(),
  stockCount: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).optional(),
  warehouseLocation: z.string().optional().nullable(),
  publicItemLocation: z.string().optional().nullable(),
  leadTime: z.string().optional().nullable(),
  isNewArrival: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  customLabel: z.string().optional().nullable(),
  customLabelColor: z.string().optional().nullable(),
  sortPriority: z.number().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  purchaseCost: z.number().min(0).optional().nullable(),
  supplierReference: z.string().optional().nullable(),
  productType: z.enum(['physical', 'sourced-on-request', 'spare-part', 'surplus']).optional(),
  keyFeatures: z.array(z.string()).optional(),
  compatibilityNotes: z.string().optional().nullable(),
  conditionNotes: z.string().optional().nullable(),
  warrantyNotes: z.string().optional().nullable(),
  includedItems: z.array(z.string()).optional(),
  excludedItems: z.array(z.string()).optional(),
  industryIds: z.array(z.string().uuid()).optional(),
  specs: z.array(z.object({
    name: z.string(),
    value: z.string(),
    isPublic: z.boolean().optional(),
  })).optional(),
  images: z.array(z.object({
    url: z.string(),
    altText: z.string().optional(),
    label: z.string().optional(),
    isMain: z.boolean().optional(),
  })).optional(),
})

// ─── Export Products CSV ───────────────────────────────────────
router.get('/export/csv', requireRole('inventory-manager'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))

  const where: any = {}
  if ((req.query.status as string)) where.status = (req.query.status as string)

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { where: { isMain: true }, take: 1, select: { url: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  const headers = [
    'SKU', 'Name', 'Brand', 'Category', 'Status', 'Condition', 'Availability',
    'Regular Price', 'Sale Price', 'Stock Count', 'New Arrival', 'Featured',
    'Make Offer', 'Created At',
  ]

  const rows = products.map(p => [
    p.sku,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.brand?.name || '',
    p.category?.name || '',
    p.status,
    p.condition,
    p.availability,
    p.regularPrice.toString(),
    p.salePrice?.toString() || '',
    p.stockCount.toString(),
    p.isNewArrival ? 'Yes' : 'No',
    p.isFeatured ? 'Yes' : 'No',
    p.makeOfferEnabled ? 'Yes' : 'No',
    p.createdAt.toISOString(),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename=products-${new Date().toISOString().slice(0, 10)}.csv`)
  res.send(csv)
}))

// ─── List All Products (Admin) ─────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(
    Number(req.query.page),
    Number(req.query.limit)
  )

  const where: any = {}
  if ((req.query.status as string)) where.status = (req.query.status as string)
  if ((req.query.availability as string)) where.availability = (req.query.availability as string)
  if ((req.query.condition as string)) where.condition = (req.query.condition as string)
  if ((req.query.brandId as string)) where.brandId = (req.query.brandId as string)
  if ((req.query.categoryId as string)) where.categoryId = (req.query.categoryId as string)
  if ((req.query.search as string)) {
    where.OR = [
      { name: { contains: (req.query.search as string), mode: 'insensitive' } },
      { sku: { contains: (req.query.search as string), mode: 'insensitive' } },
    ]
  }
  if ((req.query.isNewArrival as string) === 'true') where.isNewArrival = true
  if ((req.query.isFeatured as string) === 'true') where.isFeatured = true

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

  res.json({
    products,
    pagination: paginationResponse(total, page, limit),
  })
}))

// ─── Get Single Product (Admin) ────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid product ID format' })
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: productAdminInclude,
  })

  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }

  res.json({ product })
}))

// ─── Create Product ────────────────────────────────────────────
router.post('/', requireRole('inventory-manager'), validateBody(productSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { specs, images, industryIds, ...data } = req.body

  // Generate slug
  let slug = generateSlug(data.name)
  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing) {
    slug = `${slug}-${Date.now()}`
  }

  // Validate unique SKU
  const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } })
  if (existingSku) {
    return res.status(400).json({ error: 'SKU already exists' })
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      slug,
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
      ...(specs?.length ? {
        specs: {
          create: specs.map((s: any, i: number) => ({
            name: s.name,
            value: s.value,
            isPublic: s.isPublic ?? true,
            sortOrder: i,
          })),
        },
      } : {}),
      ...(images?.length ? {
        images: {
          create: images.map((img: any, i: number) => ({
            url: img.url,
            altText: img.altText,
            label: img.label,
            isMain: img.isMain ?? (i === 0),
            sortOrder: i,
          })),
        },
      } : {}),
      ...(industryIds?.length ? {
        industries: {
          create: industryIds.map((id: string) => ({ industryId: id })),
        },
      } : {}),
    },
    include: productAdminInclude,
  })

  await logAudit({
    actor: req.user!,
    action: 'product.create',
    entityType: 'product',
    entityId: product.id,
    entityName: product.name,
    newValue: { id: product.id, name: product.name, sku: product.sku, status: product.status, regularPrice: product.regularPrice },
    ipAddress: req.ip,
  })

  res.status(201).json({ product })
}))

// ─── Update Product ────────────────────────────────────────────
router.put('/:id', requireRole('inventory-manager'), validateBody(productSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const { specs, images, industryIds, ...data } = req.body

  const updateId = req.params.id as string
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updateId)) {
    return res.status(400).json({ error: 'Invalid product ID format' })
  }

  const existing = await prisma.product.findUnique({ where: { id: updateId } })
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' })
  }

  // Update slug if name changed
  if (data.name && data.name !== existing.name) {
    let slug = generateSlug(data.name)
    const slugExists = await prisma.product.findFirst({ where: { slug, id: { not: req.params.id as string } } })
    if (slugExists) slug = `${slug}-${Date.now()}`
    data.slug = slug
  }

  // Check SKU uniqueness if changed
  if (data.sku && data.sku !== existing.sku) {
    const skuExists = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (skuExists) {
      return res.status(400).json({ error: 'SKU already exists' })
    }
  }

  // Update specs if provided
  if (specs) {
    await prisma.productSpec.deleteMany({ where: { productId: req.params.id as string } })
    if (specs.length) {
      await prisma.productSpec.createMany({
        data: specs.map((s: any, i: number) => ({
          productId: req.params.id as string,
          name: s.name,
          value: s.value,
          isPublic: s.isPublic ?? true,
          sortOrder: i,
        })),
      })
    }
  }

  // Update images if provided
  if (images) {
    await prisma.productImage.deleteMany({ where: { productId: req.params.id as string } })
    if (images.length) {
      await prisma.productImage.createMany({
        data: images.map((img: any, i: number) => ({
          productId: req.params.id as string,
          url: img.url,
          altText: img.altText,
          label: img.label,
          isMain: img.isMain ?? (i === 0),
          sortOrder: i,
        })),
      })
    }
  }

  // Update industries if provided
  if (industryIds) {
    await prisma.productIndustry.deleteMany({ where: { productId: req.params.id as string } })
    if (industryIds.length) {
      await prisma.productIndustry.createMany({
        data: industryIds.map((id: string) => ({ productId: req.params.id as string, industryId: id })),
      })
    }
  }

  const product = await prisma.product.update({
    where: { id: req.params.id as string },
    data: { ...data, updatedBy: req.user!.id },
    include: productAdminInclude,
  })

  await logAudit({
    actor: req.user!,
    action: 'product.update',
    entityType: 'product',
    entityId: product.id,
    entityName: product.name,
    previousValue: { id: existing.id, name: existing.name, sku: existing.sku, status: existing.status, regularPrice: existing.regularPrice },
    newValue: { id: product.id, name: product.name, sku: product.sku, status: product.status, regularPrice: product.regularPrice },
    ipAddress: req.ip,
  })

  res.json({ product })
}))

// ─── Archive Product (soft delete) ────────────────────────────
router.delete('/:id', requireRole('store-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid product ID format' })
  }

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }

  // Soft-delete: archive instead of hard-delete to preserve order history
  await prisma.product.update({
    where: { id },
    data: { status: 'archived', updatedBy: req.user!.id },
  })

  await logAudit({
    actor: req.user!,
    action: 'product.archive',
    entityType: 'product',
    entityId: product.id,
    entityName: product.name,
    previousValue: { id: product.id, name: product.name, sku: product.sku, status: product.status },
    ipAddress: req.ip,
  })

  res.json({ message: 'Product archived successfully' })
}))

// ─── Bulk Actions ──────────────────────────────────────────────
router.patch('/bulk', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const { ids, action, value } = req.body
  if (!ids?.length || !action) {
    return res.status(400).json({ error: 'ids and action are required' })
  }

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
    default:
      return res.status(400).json({ error: 'Invalid action' })
  }

  updateData.updatedBy = req.user!.id

  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: updateData,
  })

  await logAudit({
    actor: req.user!,
    action: `product.bulk.${action}`,
    entityType: 'product',
    newValue: { ids, action, value, affected: result.count },
    ipAddress: req.ip,
  })

  res.json({ updated: result.count })
}))

// ─── Duplicate Product ──────────────────────────────────────────
router.post('/:id/duplicate', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const dupId = req.params.id as string
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dupId)) {
    return res.status(400).json({ error: 'Invalid product ID format' })
  }

  const source = await prisma.product.findUnique({
    where: { id: dupId },
    include: {
      specs: true,
      images: true,
      industries: { select: { industryId: true } },
    },
  })
  if (!source) return res.status(404).json({ error: 'Product not found' })

  // Generate unique SKU and slug
  let slug = generateSlug(source.name + ' Copy')
  const slugExists = await prisma.product.findUnique({ where: { slug } })
  if (slugExists) slug = `${slug}-${Date.now()}`
  let sku = `${source.sku}-COPY`
  const skuExists = await prisma.product.findUnique({ where: { sku } })
  if (skuExists) sku = `${source.sku}-COPY-${Date.now()}`

  const product = await prisma.product.create({
    data: {
      name: `${source.name} (Copy)`,
      slug,
      sku,
      brandId: source.brandId,
      categoryId: source.categoryId,
      status: 'draft',
      availability: source.availability,
      condition: source.condition,
      shortDescription: source.shortDescription,
      description: source.description,
      regularPrice: source.regularPrice,
      salePrice: source.salePrice,
      currency: source.currency,
      showPrice: source.showPrice,
      makeOfferEnabled: source.makeOfferEnabled,
      stockCount: 0,
      lowStockThreshold: source.lowStockThreshold,
      warehouseLocation: source.warehouseLocation,
      leadTime: source.leadTime,
      isNewArrival: false,
      isFeatured: false,
      customLabel: source.customLabel,
      customLabelColor: source.customLabelColor,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      seoKeywords: source.seoKeywords,
      keyFeatures: source.keyFeatures,
      compatibilityNotes: source.compatibilityNotes,
      conditionNotes: source.conditionNotes,
      warrantyNotes: source.warrantyNotes,
      includedItems: source.includedItems,
      excludedItems: source.excludedItems,
      productType: source.productType,
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
      specs: {
        create: source.specs.map((s, i) => ({
          name: s.name,
          value: s.value,
          isPublic: s.isPublic,
          sortOrder: i,
        })),
      },
      images: {
        create: source.images.map((img, i) => ({
          url: img.url,
          altText: img.altText,
          label: img.label,
          isMain: img.isMain,
          sortOrder: i,
        })),
      },
      ...(source.industries.length ? {
        industries: {
          create: source.industries.map((ind) => ({ industryId: ind.industryId })),
        },
      } : {}),
    },
    include: productAdminInclude,
  })

  await logAudit({
    actor: req.user!,
    action: 'product.duplicate',
    entityType: 'product',
    entityId: product.id,
    entityName: product.name,
    newValue: { sourceId: source.id, sourceName: source.name },
    ipAddress: req.ip,
  })

  res.status(201).json({ product })
}))

// ─── Import Products CSV ────────────────────────────────────────
router.post('/import/csv', requireRole('inventory-manager'), asyncHandler(async (req: AuthRequest, res) => {
  const { rows } = req.body as { rows: any[] }
  if (!Array.isArray(rows) || !rows.length) {
    return res.status(400).json({ error: 'rows array is required' })
  }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows.slice(0, 500)) {
    try {
      if (!row.name || !row.sku) {
        skipped++
        errors.push(`Row ${created + skipped}: missing name or sku`)
        continue
      }

      // Check SKU uniqueness
      const existing = await prisma.product.findUnique({ where: { sku: row.sku } })
      if (existing) {
        skipped++
        continue
      }

      let slug = generateSlug(row.name)
      const slugExists = await prisma.product.findUnique({ where: { slug } })
      if (slugExists) slug = `${slug}-${Date.now()}`

      await prisma.product.create({
        data: {
          name: row.name,
          slug,
          sku: row.sku,
          brandId: row.brandId || null,
          categoryId: row.categoryId || null,
          status: row.status || 'draft',
          condition: row.condition || 'used',
          availability: row.availability || 'in-stock',
          shortDescription: row.shortDescription || null,
          description: row.description || null,
          regularPrice: Number(row.regularPrice) || 0,
          salePrice: row.salePrice ? Number(row.salePrice) : null,
          stockCount: Number(row.stockCount) || 0,
          currency: row.currency || 'USD',
          makeOfferEnabled: row.makeOfferEnabled === true || row.makeOfferEnabled === 'true',
          isNewArrival: row.isNewArrival === true || row.isNewArrival === 'true',
          isFeatured: row.isFeatured === true || row.isFeatured === 'true',
          createdBy: req.user!.id,
          updatedBy: req.user!.id,
        },
      })
      created++
    } catch (err: any) {
      skipped++
      errors.push(`Row ${created + skipped}: ${err.message}`)
    }
  }

  await logAudit({
    actor: req.user!,
    action: 'product.import.csv',
    entityType: 'product',
    newValue: { created, skipped, totalRows: rows.length },
    ipAddress: req.ip,
  })

  res.json({ created, skipped, errors: errors.slice(0, 20) })
}))

export default router
