import crypto from 'crypto'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '../server.js'
import { paginationParams, paginationResponse } from '../utils/helpers.js'
import type { AuthUser } from '../middleware/auth.js'

// Configure Cloudinary from env
cloudinary.config()

// ─── Helpers ───────────────────────────────────────────────────

function generateHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function isValidCloudinaryPublicId(publicId: string): boolean {
  return /^alka\/[a-f0-9]{12,64}$/.test(publicId)
}

async function uploadToCloudinary(buffer: Buffer, fullHash: string): Promise<{ url: string; publicId: string }> {
  const b64 = `data:image/webp;base64,${buffer.toString('base64')}`
  const publicId = `alka/${fullHash}`
  const result = await cloudinary.uploader.upload(b64, {
    public_id: publicId,
    resource_type: 'image',
    overwrite: false,
  })
  return { url: result.secure_url, publicId }
}

async function destroyCloudinary(publicId: string): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId, { invalidate: true })
  return result.result !== 'error'
}

async function optimizeImage(buffer: Buffer, _mimetype: string): Promise<{ optimized: Buffer; width: number; height: number }> {
  const image = sharp(buffer)
  const metadata = await image.metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  if (width > 2000 || height > 2000) {
    image.resize({ width: Math.min(width, 2000), height: Math.min(height, 2000), fit: 'inside', withoutEnlargement: true })
  }

  const optimized = await image.rotate().webp({ quality: 85 }).toBuffer()
  return { optimized, width, height }
}

// ─── Queries ──────────────────────────────────────────────────

export async function listMediaAssets(params: { search?: string; page?: number; limit?: number }) {
  const { page, limit, skip } = paginationParams(params.page, params.limit)
  const where: any = {}
  if (params.search) {
    where.OR = [
      { filename: { contains: params.search, mode: 'insensitive' } },
      { altText: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.mediaAsset.count({ where }),
  ])
  return { assets, pagination: paginationResponse(total, page, limit) }
}

export async function getMediaUsage(assetId: string) {
  const usage = await prisma.productImage.findMany({
    where: { mediaAssetId: assetId },
    include: { product: { select: { id: true, name: true, sku: true } } },
  })
  return { usage }
}

// ─── Mutations ─────────────────────────────────────────────────

export async function uploadMedia(file: Express.Multer.File, actor: AuthUser, ipAddress = '') {
  if (!file) throw Object.assign(new Error('No file provided'), { status: 400 })

  // Optimize image
  const { optimized, width, height } = await optimizeImage(file.buffer, file.mimetype)
  const fileHash = generateHash(optimized)

  // Pre-check for existing hash (performance optimization)
  const preExisting = await prisma.mediaAsset.findFirst({ where: { hash: fileHash } })
  if (preExisting) {
    return { asset: preExisting, message: 'Duplicate file — existing asset returned' }
  }

  // Upload to Cloudinary
  const { url, publicId } = await uploadToCloudinary(optimized, fileHash)

  // Atomic transaction: findFirst + create
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.mediaAsset.findFirst({ where: { hash: fileHash } })
      if (existing) return { asset: existing, created: false }

      const asset = await tx.mediaAsset.create({
        data: {
          filename: publicId,
          originalName: file.originalname,
          url,
          mimeType: 'image/webp',
          fileSize: optimized.length,
          width,
          height,
          hash: fileHash,
          uploadedBy: actor.id,
        },
      })
      return { asset, created: true }
    })

    if (!result.created) {
      return { asset: result.asset, message: 'Duplicate file — existing asset returned' }
    }

    return { asset: result.asset }
  } catch (err) {
    // Transaction failed AFTER Cloudinary upload — best-effort cleanup
    await destroyCloudinary(publicId)
    throw Object.assign(new Error(`Database error after Cloudinary upload: ${(err as Error).message}`), { status: 502 })
  }
}

export async function deleteMedia(assetId: string, ipAddress = '') {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw Object.assign(new Error('Media asset not found'), { status: 404 })

  // Check usage across entities
  const [productImageCount, brandCount, adminUserCount, productCount] = await Promise.all([
    prisma.productImage.count({ where: { mediaAssetId: assetId } }),
    prisma.brand.count({ where: { logoUrl: asset.url } }),
    prisma.adminUser.count({ where: { avatarUrl: asset.url } }),
    prisma.product.count({ where: { ogImageUrl: asset.url } }),
  ])

  if (productImageCount + brandCount + adminUserCount + productCount > 0) {
    const inUse: string[] = []
    if (productImageCount > 0) inUse.push(`${productImageCount} product image(s)`)
    if (brandCount > 0) inUse.push('brand logo')
    if (adminUserCount > 0) inUse.push('admin avatar')
    if (productCount > 0) inUse.push('product OG image')
    throw Object.assign(new Error(`Cannot delete: in use as ${inUse.join(', ')}`), { status: 400 })
  }

  // Delete from Cloudinary (idempotent)
  let cloudinaryDeleteOk = true
  if (asset.filename) {
    if (isValidCloudinaryPublicId(asset.filename)) {
      cloudinaryDeleteOk = await destroyCloudinary(asset.filename)
    } else {
      console.warn(`[media] Skipping Cloudinary delete for ${assetId}: invalid public_id format: ${asset.filename}`)
    }
  }

  // Always delete DB record
  await prisma.mediaAsset.delete({ where: { id: assetId } })

  const warnings = !cloudinaryDeleteOk ? ['Cloudinary delete failed — file may remain on CDN'] : []
  return { message: 'Deleted', warnings }
}
