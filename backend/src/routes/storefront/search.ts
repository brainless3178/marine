import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'
import type { SearchResult } from '../../../../shared/types.js'

const router = Router()

// ─── Full-Text Search ──────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const q = (req.query.q as string) || ''
  if (!q.trim()) return sendSuccess(res, { results: [], total: 0 })

  const search = q.trim()

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'published',
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { name: { contains: search, mode: 'insensitive' } } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ],
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isMain: true }, take: 1, select: { url: true } },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { isVisible: true, OR: [{ name: { contains: search, mode: 'insensitive' } }] },
      take: 5,
    }),
    prisma.brand.findMany({
      where: { isVisible: true, OR: [{ name: { contains: search, mode: 'insensitive' } }] },
      take: 5,
    }),
  ])

  const results: SearchResult[] = [
    ...products.map(p => ({
      id: p.id,
      type: 'product' as const,
      title: p.name,
      description: p.description?.slice(0, 120) || '',
      path: `/product/${p.id}`,
      price: Number(p.salePrice && Number(p.salePrice) < Number(p.regularPrice) ? p.salePrice : p.regularPrice),
      imageUrl: p.images[0]?.url,
      brand: p.brand?.name,
    })),
    ...categories.map(c => ({
      id: c.id,
      type: 'category' as const,
      title: c.name,
      description: '',
      path: `/products?category=${c.slug}`,
    })),
    ...brands.map(b => ({
      id: b.id,
      type: 'brand' as const,
      title: b.name,
      description: '',
      path: `/products?brand=${b.slug}`,
    })),
  ]

  sendSuccess(res, { results, total: results.length, query: search })
}))

export default router
