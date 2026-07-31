import { prisma } from '../server.js'
import { logAudit } from '../utils/audit.js'
import type { AuthUser } from '../middleware/auth.js'

// ─── Queries ──────────────────────────────────────────────────

export async function listAdminTestimonials() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } })
  return { testimonials }
}

export async function listStorefrontTestimonials() {
  const testimonials = await prisma.testimonial.findMany({ where: { isVisible: true }, orderBy: { sortOrder: 'asc' } })
  return { testimonials }
}

// ─── Mutations ────────────────────────────────────────────────

export async function createTestimonial(data: Record<string, unknown>, actor: AuthUser, ipAddress = '') {
  const testimonial = await prisma.testimonial.create({ data: data as never })
  await logAudit({ actor, action: 'testimonial.create', entityType: 'testimonial', entityId: testimonial.id, entityName: testimonial.name || testimonial.id, newValue: testimonial, ipAddress })
  return { testimonial }
}

export async function updateTestimonial(id: string, data: Record<string, unknown>, actor: AuthUser, ipAddress = '') {
  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) throw Object.assign(new Error('Testimonial not found'), { status: 404 })

  const testimonial = await prisma.testimonial.update({ where: { id }, data: data as never })
  await logAudit({ actor, action: 'testimonial.update', entityType: 'testimonial', entityId: testimonial.id, entityName: testimonial.name || testimonial.id, previousValue: existing, newValue: testimonial, ipAddress })
  return { testimonial }
}

export async function deleteTestimonial(id: string, actor: AuthUser, ipAddress = '') {
  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) throw Object.assign(new Error('Testimonial not found'), { status: 404 })

  await prisma.testimonial.delete({ where: { id } })
  await logAudit({ actor, action: 'testimonial.delete', entityType: 'testimonial', entityId: existing.id, entityName: existing.name || existing.id, previousValue: existing, ipAddress })
  return { message: 'Testimonial deleted' }
}

// ─── Bulk Update ──────────────────────────────────────────────

export async function bulkUpdateTestimonials(items: Array<{ name: string; role?: string; company?: string; avatarUrl?: string; text: string; rating?: number; sortOrder?: number; isVisible?: boolean }>, actor: AuthUser, ipAddress = '') {
  await prisma.testimonial.deleteMany()
  await prisma.testimonial.createMany({
    data: items.map((t, i) => ({
      name: t.name, role: t.role, company: t.company, avatarUrl: t.avatarUrl,
      text: t.text, rating: t.rating ?? 5, sortOrder: t.sortOrder ?? i, isVisible: t.isVisible ?? true,
    })),
  })
  const result = await prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } })
  await logAudit({ actor, action: 'testimonials.update', entityType: 'testimonial', entityName: result.map(t => t.name).join(', '), ipAddress })
  return { testimonials: result }
}
