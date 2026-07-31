import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests'
})

const mockPrisma = {
  mediaAsset: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn(), count: vi.fn() },
  productImage: { count: vi.fn(), findMany: vi.fn() },
  brand: { count: vi.fn() },
  adminUser: { count: vi.fn() },
  product: { count: vi.fn() },
  $transaction: vi.fn(),
}

vi.mock('../server.js', () => ({ prisma: mockPrisma }))

vi.mock('../utils/helpers.js', () => ({
  paginationParams: () => ({ page: 1, limit: 24, skip: 0 }),
  paginationResponse: () => ({ total: 0, page: 1, limit: 24, totalPages: 0, hasNext: false, hasPrev: false }),
}))

vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
    resize: vi.fn().mockReturnThis(),
    rotate: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized')),
  }))
  return { default: mockSharp }
})

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/test/image/upload/alka/hash123' }),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}))

const mockActor = { id: 'admin-uuid', email: 'admin@test.com', role: 'admin' }

const { uploadMedia, deleteMedia, listMediaAssets, getMediaUsage } = await import('../services/mediaService.js')

describe('uploadMedia', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 400 when no file provided', async () => {
    await expect(uploadMedia(null as any, mockActor, '')).rejects.toMatchObject({ status: 400 })
  })

  it('uploads and creates media asset', async () => {
    mockPrisma.mediaAsset.findFirst
      .mockResolvedValueOnce(null) // pre-check
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      return fn({
        mediaAsset: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 'asset-1', url: 'https://res.cloudinary.com/test/image/upload/alka/hash123' }),
        },
      })
    })

    const mockFile = {
      buffer: Buffer.from('test-image'),
      mimetype: 'image/jpeg',
      originalname: 'test.jpg',
    }

    const result = await uploadMedia(mockFile as Express.Multer.File, mockActor, '127.0.0.1')
    expect(result.asset).toBeDefined()
    expect(result.asset.url).toContain('cloudinary')
  })
})

describe('deleteMedia', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when asset not found', async () => {
    mockPrisma.mediaAsset.findUnique.mockResolvedValue(null)
    await expect(deleteMedia('nonexistent')).rejects.toMatchObject({ status: 404 })
  })

  it('throws 400 when asset is in use', async () => {
    mockPrisma.mediaAsset.findUnique.mockResolvedValue({ id: 'asset-1', url: 'https://img.url', filename: 'alka/hash123' })
    mockPrisma.productImage.count.mockResolvedValue(2)
    mockPrisma.brand.count.mockResolvedValue(0)
    mockPrisma.adminUser.count.mockResolvedValue(0)
    mockPrisma.product.count.mockResolvedValue(0)

    await expect(deleteMedia('asset-1')).rejects.toMatchObject({ status: 400 })
  })

  it('deletes when not in use', async () => {
    mockPrisma.mediaAsset.findUnique.mockResolvedValue({ id: 'asset-1', url: 'https://img.url', filename: 'alka/hash123' })
    mockPrisma.productImage.count.mockResolvedValue(0)
    mockPrisma.brand.count.mockResolvedValue(0)
    mockPrisma.adminUser.count.mockResolvedValue(0)
    mockPrisma.product.count.mockResolvedValue(0)
    mockPrisma.mediaAsset.delete.mockResolvedValue({})

    const result = await deleteMedia('asset-1')
    expect(result.message).toBe('Deleted')
  })
})

describe('listMediaAssets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated assets', async () => {
    mockPrisma.mediaAsset.findMany.mockResolvedValue([])
    mockPrisma.mediaAsset.count.mockResolvedValue(0)

    const result = await listMediaAssets({})
    expect(result.assets).toEqual([])
  })
})

describe('getMediaUsage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns product images referencing the asset', async () => {
    mockPrisma.productImage.findMany.mockResolvedValue([
      { product: { id: 'p1', name: 'Pump', sku: 'HP-200' } },
    ])

    const result = await getMediaUsage('asset-1')
    expect(result.usage).toHaveLength(1)
  })
})
