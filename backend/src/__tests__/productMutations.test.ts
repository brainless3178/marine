import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests'
})

const mockPrisma = {
  product: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  productSpec: { deleteMany: vi.fn(), createMany: vi.fn() },
  productImage: { deleteMany: vi.fn(), createMany: vi.fn() },
  productIndustry: { deleteMany: vi.fn(), createMany: vi.fn() },
  auditLog: { create: vi.fn() },
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

vi.mock('../utils/helpers.js', () => ({
  generateSlug: (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
}))

vi.mock('../utils/prisma-helpers.js', () => ({
  productAdminInclude: { brand: true, category: true, images: true },
}))

const { createProduct, updateProduct, archiveProduct, bulkUpdate, duplicateProduct } = await import('../services/productMutations.js')

const mockActor = { id: 'admin-uuid', email: 'admin@test.com', role: 'admin' }

describe('createProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a product with basic fields', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce(null) // slug check
      .mockResolvedValueOnce(null) // SKU check
    mockPrisma.product.create.mockResolvedValue({ id: 'p1', name: 'Test Pump', sku: 'TP-001' })

    const result = await createProduct(
      { name: 'Test Pump', sku: 'TP-001', regularPrice: 100 },
      mockActor
    )

    expect(mockPrisma.product.create).toHaveBeenCalled()
    expect(result.id).toBe('p1')
  })

  it('throws when SKU already exists', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce(null) // slug check
      .mockResolvedValueOnce({ id: 'existing', sku: 'TP-001' }) // duplicate SKU

    await expect(
      createProduct({ name: 'Test', sku: 'TP-001' }, mockActor)
    ).rejects.toMatchObject({ message: 'SKU already exists', status: 400 })
  })

  it('appends timestamp to duplicate slug', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce({ id: 'existing' }) // slug exists
      .mockResolvedValueOnce(null) // SKU check
    mockPrisma.product.create.mockResolvedValue({ id: 'p2', name: 'Test Pump (dup)' })

    const result = await createProduct(
      { name: 'Test Pump', sku: 'TP-002' },
      mockActor
    )

    expect(result.id).toBe('p2')
    // Slug should have Date.now() appended
    const callArgs = mockPrisma.product.create.mock.calls[0][0]
    expect(callArgs.data.slug).toMatch(/^test-pump-\d+$/)
  })

  it('creates related specs, images, and industries when provided', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    mockPrisma.product.create.mockResolvedValue({ id: 'p1', name: 'Full Product' })

    await createProduct(
      {
        name: 'Full Product', sku: 'FP-001',
        specs: [{ name: 'Power', value: '100kW' }],
        images: [{ url: 'https://img.url/test', altText: 'Test' }],
        industryIds: ['ind-1'],
      },
      mockActor
    )

    const callData = mockPrisma.product.create.mock.calls[0][0].data
    expect(callData.specs.create).toHaveLength(1)
    expect(callData.images.create).toHaveLength(1)
    expect(callData.industries.create).toHaveLength(1)
  })
})

describe('updateProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates product fields and audits', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce({ id: 'p1', name: 'Old Name', sku: 'OLD-001', status: 'draft', regularPrice: 50 })

    mockPrisma.product.update.mockResolvedValue({ id: 'p1', name: 'New Name', sku: 'OLD-001', status: 'draft', regularPrice: 75 })

    const result = await updateProduct(
      '550e8400-e29b-41d4-a716-446655440000',
      { name: 'New Name', regularPrice: 75 },
      mockActor
    )

    expect(mockPrisma.product.update).toHaveBeenCalled()
    expect(result.name).toBe('New Name')
  })

  it('throws 400 for invalid UUID', async () => {
    await expect(
      updateProduct('bad-id', { name: 'X' }, mockActor)
    ).rejects.toMatchObject({ status: 400 })
  })

  it('throws 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    await expect(
      updateProduct('550e8400-e29b-41d4-a716-446655440000', { name: 'X' }, mockActor)
    ).rejects.toMatchObject({ status: 404 })
  })

  it('replaces specs, images, and industries when provided', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce({ id: 'p1', name: 'Product', sku: 'SKU-001', status: 'published', regularPrice: 100 })
    mockPrisma.product.update.mockResolvedValue({ id: 'p1', name: 'Updated' })

    await updateProduct(
      '550e8400-e29b-41d4-a716-446655440000',
      {
        name: 'Updated',
        specs: [{ name: 'Weight', value: '10kg' }],
        images: [{ url: 'https://img.url/new' }],
        industryIds: ['ind-2'],
      },
      mockActor
    )

    expect(mockPrisma.productSpec.deleteMany).toHaveBeenCalled()
    expect(mockPrisma.productImage.deleteMany).toHaveBeenCalled()
    expect(mockPrisma.productIndustry.deleteMany).toHaveBeenCalled()
    expect(mockPrisma.productSpec.createMany).toHaveBeenCalled()
    expect(mockPrisma.productImage.createMany).toHaveBeenCalled()
    expect(mockPrisma.productIndustry.createMany).toHaveBeenCalled()
  })
})

describe('archiveProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('archives a product that exists', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Test', sku: 'T-1', status: 'published' })

    await archiveProduct('550e8400-e29b-41d4-a716-446655440000', mockActor)

    expect(mockPrisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
        data: expect.objectContaining({ status: 'archived' }),
      })
    )
  })

  it('throws 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)
    await expect(
      archiveProduct('550e8400-e29b-41d4-a716-446655440000', mockActor)
    ).rejects.toMatchObject({ status: 404 })
  })
})

describe('bulkUpdate', () => {
  beforeEach(() => vi.clearAllMocks())

  const actions = [
    { action: 'publish', expected: { status: 'published' } },
    { action: 'unpublish', expected: { status: 'hidden' } },
    { action: 'archive', expected: { status: 'archived' } },
    { action: 'set-featured', expected: { isFeatured: true } },
    { action: 'unset-featured', expected: { isFeatured: false } },
    { action: 'set-new-arrival', expected: { isNewArrival: true } },
  ]

  for (const { action, expected } of actions) {
    it(`handles bulk ${action}`, async () => {
      mockPrisma.product.updateMany.mockResolvedValue({ count: 3 })

      const result = await bulkUpdate(['p1', 'p2', 'p3'], action, undefined, mockActor)

      expect(mockPrisma.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['p1', 'p2', 'p3'] } },
          data: expect.objectContaining(expected),
        })
      )
      expect(result.updated).toBe(3)
    })
  }

  it('handles set-category and set-brand with value', async () => {
    mockPrisma.product.updateMany.mockResolvedValue({ count: 2 })

    await bulkUpdate(['p1', 'p2'], 'set-category', 'cat-1', mockActor)
    expect(mockPrisma.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categoryId: 'cat-1' }),
      })
    )

    await bulkUpdate(['p1', 'p2'], 'set-brand', 'brand-1', mockActor)
    expect(mockPrisma.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ brandId: 'brand-1' }),
      })
    )
  })

  it('throws for invalid action', async () => {
    await expect(
      bulkUpdate(['p1'], 'invalid-action', undefined, mockActor)
    ).rejects.toMatchObject({ status: 400, message: 'Invalid action' })
  })
})

describe('duplicateProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('duplicates a product with copy suffix', async () => {
    const sourceProduct = {
      id: 'p1', name: 'Original Pump', sku: 'OP-001',
      brandId: 'b1', categoryId: 'c1',
      status: 'published', availability: 'in-stock', condition: 'new',
      shortDescription: 'A pump', description: 'Full desc',
      regularPrice: 100, salePrice: null, currency: 'USD',
      showPrice: true, makeOfferEnabled: false,
      stockCount: 10, lowStockThreshold: 5,
      warehouseLocation: 'WH-1', leadTime: '2 weeks',
      isNewArrival: true, isFeatured: true,
      customLabel: null, customLabelColor: '#159a67',
      seoTitle: 'Pump SEO', seoDescription: 'Seo desc',
      seoKeywords: ['pump'],
      keyFeatures: ['Feature 1'], compatibilityNotes: '',
      conditionNotes: '', warrantyNotes: '',
      includedItems: ['Item 1'], excludedItems: [],
      productType: 'physical',
      createdBy: 'admin-uuid', updatedBy: 'admin-uuid',
      specs: [], images: [], industries: [],
    }

    mockPrisma.product.findUnique.mockResolvedValue(sourceProduct)
    mockPrisma.product.create.mockResolvedValue({ id: 'p2', name: 'Original Pump (Copy)', sku: 'OP-001-COPY' })

    const result = await duplicateProduct('550e8400-e29b-41d4-a716-446655440000', mockActor)

    expect(mockPrisma.product.create).toHaveBeenCalled()
    expect(result.id).toBe('p2')
  })

  it('throws when source product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    await expect(
      duplicateProduct('550e8400-e29b-41d4-a716-446655440000', mockActor)
    ).rejects.toMatchObject({ status: 404 })
  })
})
