import { prisma } from '../server.js'
import { logAudit } from '../utils/audit.js'
import type { AuthUser } from '../middleware/auth.js'

// ─── Queries ──────────────────────────────────────────────────

export async function listStorefrontOffices() {
  const offices = await prisma.office.findMany({ where: { isVisible: true }, orderBy: { sortOrder: 'asc' } })
  return { offices }
}

export async function listAllOffices() {
  const offices = await prisma.office.findMany({ orderBy: { sortOrder: 'asc' } })
  return { offices }
}

export async function getOfficeBySlug(slug: string) {
  const office = await prisma.office.findFirst({ where: { city: slug, isVisible: true } })
  if (!office) throw Object.assign(new Error('Office not found'), { status: 404 })
  return { office }
}

// ─── Mutations ────────────────────────────────────────────────

export async function updateAllOffices(offices: Array<{ city: string; country: string; address?: string; timezone?: string; phone?: string; email?: string; coordinatesLat?: number; coordinatesLng?: number; sortOrder?: number; isVisible?: boolean }>, actor: AuthUser, ipAddress = '') {
  await prisma.office.deleteMany()
  await prisma.office.createMany({
    data: offices.map((o, i: number) => ({
      city: o.city,
      country: o.country,
      address: o.address,
      timezone: o.timezone,
      phone: o.phone,
      email: o.email,
      coordinatesLat: o.coordinatesLat,
      coordinatesLng: o.coordinatesLng,
      sortOrder: o.sortOrder ?? i,
      isVisible: o.isVisible ?? true,
    })),
  })

  const result = await prisma.office.findMany({ orderBy: { sortOrder: 'asc' } })
  await logAudit({ actor, action: 'offices.update', entityType: 'office', entityName: result.map(o => o.city).join(', '), ipAddress })
  return { offices: result }
}
