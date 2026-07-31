import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests'
})

const mockPrisma = {
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  category: { findMany: vi.fn() },
  brand: { findMany: vi.fn() },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

const {
  listProducts, listStorefrontProducts,
  getStorefrontProduct, getRelatedProducts,
  getFeaturedProducts, getNewArrivals,
  getEmergencyProducts, getProductCategoryAndBrand,
  getFilterCounts, getProduct,
} = await import('../services/productQueries.js')

describe('listProducts (admin)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated products with defaults', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const result = await listProducts({})

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 24 })
    )
    expect(result.products).toEqual([])
    expect(result.pagination.total).toBe(0)
    expect(result.pagination.page).toBe(1)
  })

  it('filters by status, condition, availability', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listProducts({ status: 'draft', condition: 'new', availability: 'in-stock' })

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'draft',
          condition: 'new',
          availability: 'in-stock',
        }),
      })
    )
  })

  it('filters by brandId and categoryId', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listProducts({ brandId: 'brand-uuid', categoryId: 'cat-uuid' })

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          brandId: 'brand-uuid',
          categoryId: 'cat-uuid',
        }),
      })
    )
  })

  it('searches by name or sku when search param provided', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listProducts({ search: 'hydraulic' })

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'hydraulic', mode: 'insensitive' } },
            { sku: { contains: 'hydraulic', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })

  it('filters by isNewArrival and isFeatured', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listProducts({ isNewArrival: true, isFeatured: true })

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isNewArrival: true, isFeatured: true }),
      })
    )
  })

  it('respects custom page and limit', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listProducts({ page: 3, limit: 10 })

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
  })
})

describe('listStorefrontProducts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('adds status:published filter automatically', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listStorefrontProducts({})

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'published' }),
      })
    )
  })

  it('maps slug-based category and brand filters', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listStorefrontProducts({ category: 'pumps', brand: 'abb', condition: 'new' })

    const where = mockPrisma.product.findMany.mock.calls[0][0].where
    expect(where.category).toEqual({ slug: 'pumps' })
    expect(where.brand).toEqual({ slug: 'abb' })
    expect(where.condition).toBe('new')
  })

  it('filters by industry slug', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listStorefrontProducts({ industry: 'marine' })

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          industries: { some: { industry: { slug: 'marine' } } },
        }),
      })
    )
  })

  it('filters by onSale, price range, makeOffer', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listStorefrontProducts({ onSale: true, priceMin: 100, priceMax: 500, makeOffer: true })

    const where = mockPrisma.product.findMany.mock.calls[0][0].where
    expect(where.salePrice).toEqual({ not: null })
    expect(where.regularPrice).toEqual({ gte: 100, lte: 500 })
    expect(where.makeOfferEnabled).toBe(true)
  })

  it('applies sort order correctly', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await listStorefrontProducts({ sort: 'price-asc' })
    expect(mockPrisma.product.findMany.mock.calls[0][0].orderBy).toEqual({ regularPrice: 'asc' })
    vi.clearAllMocks()

    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)
    await listStorefrontProducts({ sort: 'price-desc' })
    expect(mockPrisma.product.findMany.mock.calls[0][0].orderBy).toEqual({ regularPrice: 'desc' })
    vi.clearAllMocks()

    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)
    await listStorefrontProducts({ sort: 'name-asc' })
    expect(mockPrisma.product.findMany.mock.calls[0][0].orderBy).toEqual({ name: 'asc' })
    vi.clearAllMocks()

    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)
    await listStorefrontProducts({ sort: 'newest' })
    expect(mockPrisma.product.findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'desc' })
  })

  it('enriches products with price, onSale, inStock', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 'p1', regularPrice: 100, salePrice: null, stockCount: 5 },
      { id: 'p2', regularPrice: 200, salePrice: 150, stockCount: 0 },
    ])
    mockPrisma.product.count.mockResolvedValue(2)

    const result = await listStorefrontProducts({})
    expect(result.products[0].price).toBe(100)
    expect(result.products[0].inStock).toBe(true)
    expect(result.products[1].price).toBe(150)
    expect(result.products[1].inStock).toBe(false)
  })
})

describe('getStorefrontProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('finds by id or slug with published status', async () => {
    mockPrisma.product.findFirst.mockResolvedValue({
      id: 'p1', slug: 'pump-200', regularPrice: 100, salePrice: null, stockCount: 5,
    })

    const result = await getStorefrontProduct('pump-200')

    expect(mockPrisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ id: 'pump-200' }, { slug: 'pump-200' }], status: 'published' },
      })
    )
    expect(result).not.toBeNull()
    expect(result?.price).toBe(100)
  })

  it('returns null when not found', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null)
    const result = await getStorefrontProduct('nonexistent')
    expect(result).toBeNull()
  })
})

describe('getRelatedProducts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('finds related by category or brand excluding self', async () => {
    mockPrisma.product.findMany.mockResolvedValue([{ id: 'p2' }, { id: 'p3' }])

    const result = await getRelatedProducts('p1', 'cat-1', 'brand-1', 4)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'published',
          id: { not: 'p1' },
          OR: [{ categoryId: 'cat-1' }, { brandId: 'brand-1' }],
        },
        take: 4,
      })
    )
    expect(result).toHaveLength(2)
  })

  it('returns empty when exclude sets are empty', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])

    const result = await getRelatedProducts('p1', null, null)
    expect(result).toEqual([])
  })
})

describe('getFeaturedProducts', () => {
  it('queries featured and published products ordered by sortPriority', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    await getFeaturedProducts(6)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'published', isFeatured: true },
        take: 6,
        orderBy: { sortPriority: 'desc' },
      })
    )
  })
})

describe('getNewArrivals', () => {
  it('queries new arrivals ordered by createdAt desc', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    await getNewArrivals(8)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'published', isNewArrival: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
      })
    )
  })
})

describe('getEmergencyProducts', () => {
  it('queries emergency availability products', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    await getEmergencyProducts(12)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'published', availability: 'emergency' },
        take: 12,
      })
    )
  })
})

describe('getProductCategoryAndBrand', () => {
  it('selects only categoryId and brandId', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ categoryId: 'cat-1', brandId: 'brand-1' })

    const result = await getProductCategoryAndBrand('p1')

    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'p1' },
      select: { categoryId: true, brandId: true },
    })
    expect(result?.categoryId).toBe('cat-1')
  })
})

describe('getFilterCounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns categories, brands, and price range', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      { slug: 'pumps', name: 'Pumps', _count: { products: 10 } },
    ])
    mockPrisma.brand.findMany.mockResolvedValue([
      { slug: 'abb', name: 'ABB', _count: { products: 5 } },
    ])
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { regularPrice: 50 },
      _max: { regularPrice: 5000 },
    })

    const result = await getFilterCounts()

    expect(result.categories).toEqual([{ id: 'pumps', name: 'Pumps', count: 10 }])
    expect(result.brands).toEqual([{ id: 'abb', name: 'ABB', count: 5 }])
    expect(result.priceRange).toEqual({ min: 50, max: 5000 })
  })

  it('handles empty catalog gracefully', async () => {
    mockPrisma.category.findMany.mockResolvedValue([])
    mockPrisma.brand.findMany.mockResolvedValue([])
    mockPrisma.product.aggregate.mockResolvedValue({
      _min: { regularPrice: null },
      _max: { regularPrice: null },
    })

    const result = await getFilterCounts()
    expect(result.categories).toEqual([])
    expect(result.brands).toEqual([])
    expect(result.priceRange).toEqual({ min: 0, max: 1000 })
  })
})

describe('getProduct (admin)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 400 for invalid UUID format', async () => {
    await expect(getProduct('not-a-uuid')).rejects.toMatchObject({
      message: 'Invalid product ID format',
      status: 400,
    })
  })

  it('throws 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)
    await expect(getProduct('550e8400-e29b-41d4-a716-446655440000')).rejects.toMatchObject({
      message: 'Product not found',
      status: 404,
    })
  })

  it('returns product with admin includes when found', async () => {
    const mockProduct = { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test Product' }
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct)

    const result = await getProduct('550e8400-e29b-41d4-a716-446655440000')
    expect(result).toEqual(mockProduct)
  })
})
