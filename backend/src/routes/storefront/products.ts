import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'
import { productInclude } from '../../utils/prisma-helpers.js'
import { paginationParams, paginationResponse, getEffectivePrice, isOnSale } from '../../utils/helpers.js'

const router = Router()

// ─── List Products (Storefront) ────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  try {
  const { page, limit, skip } = paginationParams(Number(req.query.page), Number(req.query.limit))

  const where: any = { status: 'published' }
  if ((req.query.category as string)) where.category = { slug: (req.query.category as string) }
  if ((req.query.brand as string)) where.brand = { slug: (req.query.brand as string) }
  if ((req.query.industry as string)) where.industries = { some: { industry: { slug: (req.query.industry as string) } } }
  if ((req.query.condition as string)) where.condition = (req.query.condition as string)
  if ((req.query.availability as string)) where.availability = (req.query.availability as string)
  if ((req.query.onSale as string) === 'true') where.salePrice = { not: null }
  if ((req.query.isNewArrival as string) === 'true') where.isNewArrival = true
  if ((req.query.isFeatured as string) === 'true') where.isFeatured = true
  if ((req.query.makeOffer as string) === 'true') where.makeOfferEnabled = true
  if ((req.query.priceMin as string) || (req.query.priceMax as string)) {
    where.regularPrice = {}
    if ((req.query.priceMin as string)) where.regularPrice.gte = Number((req.query.priceMin as string))
    if ((req.query.priceMax as string)) where.regularPrice.lte = Number((req.query.priceMax as string))
  }
  if ((req.query.search as string)) {
    where.OR = [
      { name: { contains: (req.query.search as string), mode: 'insensitive' } },
      { sku: { contains: (req.query.search as string), mode: 'insensitive' } },
      { brand: { name: { contains: (req.query.search as string), mode: 'insensitive' } } },
    ]
  }

  let orderBy: any = { createdAt: 'desc' }
  if ((req.query.sort as string) === 'price-asc') orderBy = { regularPrice: 'asc' }
  else if ((req.query.sort as string) === 'price-desc') orderBy = { regularPrice: 'desc' }
  else if ((req.query.sort as string) === 'name-asc') orderBy = { name: 'asc' }
  else if ((req.query.sort as string) === 'name-desc') orderBy = { name: 'desc' }
  else if ((req.query.sort as string) === 'newest') orderBy = { createdAt: 'desc' }
  else if ((req.query.sort as string) === 'oldest') orderBy = { createdAt: 'asc' }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
  ])

  // Compute filter counts
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

  res.json({
    products: products.map(p => ({
      ...p,
      price: getEffectivePrice(p),
      onSale: isOnSale(p),
      inStock: p.stockCount > 0,
    })),
    pagination: paginationResponse(total, page, limit),
    filters: {
      categories: categories.map(c => ({ id: c.slug, name: c.name, count: c._count.products })),
      brands: brands.map(b => ({ id: b.slug, name: b.name, count: b._count.products })),
      priceRange: { min: Number(priceAgg._min.regularPrice) || 0, max: Number(priceAgg._max.regularPrice) || 1000 },
    },
  })
  } catch (err: any) {
    console.error('Products list error:', err.message, err.code, err.stack)
    res.status(500).json({ error: 'Internal server error', detail: err.message, code: err.code })
  }
}))

// ─── Get Featured Products ─────────────────────────────────────
router.get('/featured', asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { status: 'published', isFeatured: true },
    include: productInclude,
    take: 8,
    orderBy: { sortPriority: 'desc' },
  })
  res.json({ products })
}))

// ─── Get New Arrivals ──────────────────────────────────────────
router.get('/new-arrivals', asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { status: 'published', isNewArrival: true },
    include: productInclude,
    take: 8,
    orderBy: { createdAt: 'desc' },
  })
  res.json({ products })
}))

// ─── Get Emergency Products ────────────────────────────────────
router.get('/emergency', asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { status: 'published', availability: 'emergency' },
    include: productInclude,
    take: 12,
    orderBy: { createdAt: 'desc' },
  })
  res.json({ products })
}))

// ─── Get Single Product ────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: req.params.id as string }, { slug: req.params.id as string }], status: 'published' },
    include: productInclude,
  })
  if (!product) return res.status(404).json({ error: 'Product not found' })

  // Get related products
  const related = await prisma.product.findMany({
    where: {
      status: 'published',
      id: { not: product.id },
      OR: [
        { categoryId: product.categoryId },
        { brandId: product.brandId },
      ],
    },
    include: productInclude,
    take: 4,
    orderBy: { createdAt: 'desc' },
  })

  res.json({
    product: { ...product, price: getEffectivePrice(product), onSale: isOnSale(product), inStock: product.stockCount > 0 },
    related: related.map(p => ({ ...p, price: getEffectivePrice(p), onSale: isOnSale(p), inStock: p.stockCount > 0 })),
  })
}))

// ─── Get Related Products ──────────────────────────────────────
router.get('/:id/related', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id as string }, select: { categoryId: true, brandId: true } })
  if (!product) return res.status(404).json({ error: 'Product not found' })

  const related = await prisma.product.findMany({
    where: { status: 'published', id: { not: req.params.id as string }, OR: [{ categoryId: product.categoryId }, { brandId: product.brandId }] },
    include: productInclude,
    take: 4,
  })
  res.json({ products: related })
}))

export default router
