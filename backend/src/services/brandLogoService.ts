import path from 'path'
import fs from 'fs'
import type { Express } from 'express'
import { prisma } from '../server.js'
import { logAudit } from '../utils/audit.js'
import type { AuthUser } from '../middleware/auth.js'

// ─── Queries ──────────────────────────────────────────────────

export async function getBrandLogo() {
  const setting = await prisma.storeSetting.findUnique({ where: { key: 'site.brandLogo' } })
  return { logoUrl: setting?.value || null }
}

// ─── Mutations ────────────────────────────────────────────────

export async function updateBrandLogo(logoUrl: string, actor: AuthUser, ipAddress = '') {
  await prisma.storeSetting.upsert({
    where: { key: 'site.brandLogo' },
    update: { value: logoUrl, updatedBy: actor.id },
    create: { key: 'site.brandLogo', value: logoUrl, updatedBy: actor.id },
  })

  await logAudit({ actor, action: 'brand-logo.update', entityType: 'store_settings', entityName: 'brandLogo', ipAddress })
  return { message: 'Brand logo updated' }
}

export async function deleteBrandLogo(actor: AuthUser, ipAddress = '') {
  await prisma.storeSetting.deleteMany({ where: { key: 'site.brandLogo' } })
  await logAudit({ actor, action: 'brand-logo.delete', entityType: 'store_settings', entityName: 'brandLogo', ipAddress })
  return { message: 'Brand logo deleted' }
}

// ─── Upload ─────────────────────────────────────────────────

export async function uploadBrandLogo(brandId: string, file: Express.Multer.File, actor: AuthUser, ipAddress = '') {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } })
  if (!brand) throw Object.assign(new Error('Brand not found'), { status: 404 })

  // Save file
  const ext = path.extname(file.originalname).toLowerCase() || '.png'
  const filename = `brand-${brandId.slice(0, 8)}-${Date.now()}${ext}`
  const UPLOAD_DIR = path.resolve('uploads')
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const filepath = path.join(UPLOAD_DIR, filename)
  fs.writeFileSync(filepath, file.buffer)
  const url = `/uploads/${filename}`

  // Delete old logo file if it exists
  if (brand.logoUrl && brand.logoUrl.startsWith('/uploads/')) {
    const oldPath = path.resolve(brand.logoUrl.slice(1))
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath)
    }
  }

  const updated = await prisma.brand.update({ where: { id: brandId }, data: { logoUrl: url } })

  await logAudit({
    actor, action: 'brand.logo.upload', entityType: 'brand', entityId: brand.id, entityName: brand.name,
    newValue: { logoUrl: url }, ipAddress,
  })

  return { brand: updated, url }
}
