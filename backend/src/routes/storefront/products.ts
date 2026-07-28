import { Router } from 'express'
import { asyncHandler } from '../../middleware/validate.js'
import * as productService from '../../services/productService.js'
import { sendSuccess, sendError } from '../../middleware/response.js'

const router = Router()

// ─── List Products (Storefront) ────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const filters = {
    category: req.query.category as string | undefined,
    brand: req.query.brand as string | undefined,
    industry: req.query.industry as string | undefined,
    condition: req.query.condition as string | undefined,
    availability: req.query.availability as string | undefined,
    onSale: (req.query.onSale as string) === 'true' || undefined,
    isNewArrival: (req.query.isNewArrival as string) === 'true' || undefined,
    isFeatured: (req.query.isFeatured as string) === 'true' || undefined,
    makeOffer: (req.query.makeOffer as string) === 'true' || undefined,
    priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
    priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
    search: req.query.search as string | undefined,
    sort: req.query.sort as string | undefined,
    page: Number(req.query.page) || undefined,
    limit: Number(req.query.limit) || undefined,
  }

  const [result, filterCounts] = await Promise.all([
    productService.listStorefrontProducts(filters),
    productService.getFilterCounts(),
  ])

  sendSuccess(res, {
    products: result.products,
    pagination: result.pagination,
    filters: filterCounts,
  })
}))

// ─── Get Featured Products ─────────────────────────────────────
router.get('/featured', asyncHandler(async (_req, res) => {
  const products = await productService.getFeaturedProducts()
  sendSuccess(res, { products })
}))

// ─── Get New Arrivals ──────────────────────────────────────────
router.get('/new-arrivals', asyncHandler(async (_req, res) => {
  const products = await productService.getNewArrivals()
  sendSuccess(res, { products })
}))

// ─── Get Emergency Products ────────────────────────────────────
router.get('/emergency', asyncHandler(async (_req, res) => {
  const products = await productService.getEmergencyProducts()
  sendSuccess(res, { products })
}))

// ─── Get Single Product ────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string
  const product = await productService.getStorefrontProduct(id)
  if (!product) return sendError(res, 'Product not found', 404)

  // Get category/brand for related products query
  const info = await productService.getProductCategoryAndBrand(product.id)
  const related = info ? await productService.getRelatedProducts(product.id, info.categoryId, info.brandId) : []

  sendSuccess(res, { product, related })
}))

// ─── Get Related Products ──────────────────────────────────────
router.get('/:id/related', asyncHandler(async (req, res) => {
  const id = req.params.id as string
  const info = await productService.getProductCategoryAndBrand(id)
  if (!info) return sendError(res, 'Product not found', 404)

  const related = await productService.getRelatedProducts(id, info.categoryId, info.brandId)
  sendSuccess(res, { products: related })
}))

export default router
