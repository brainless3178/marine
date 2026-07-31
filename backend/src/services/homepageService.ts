import { prisma } from '../server.js'
import { logAudit } from '../utils/audit.js'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../middleware/auth.js'

// ─── Queries ──────────────────────────────────────────────────

export async function listAdminSections() {
  const sections = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } })
  return { sections }
}

export async function listStorefrontSections() {
  const sections = await prisma.homepageSection.findMany({ where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } })
  return { sections }
}

// ─── Mutations ────────────────────────────────────────────────

export async function updateSections(sections: Array<{ sectionType: string; label?: string; isEnabled?: boolean; sortOrder?: number; config?: Record<string, unknown> }>, actor: AuthUser, ipAddress = '') {
  // Delete existing and recreate
  await prisma.homepageSection.deleteMany()
  await prisma.homepageSection.createMany({
    data: sections.map((s, i: number) => ({
      sectionType: s.sectionType,
      label: s.label ?? '',
      isEnabled: s.isEnabled ?? true,
      sortOrder: s.sortOrder ?? i,
      config: (s.config ?? {}) as Prisma.InputJsonValue,
    })),
  })

  const result = await prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } })
  await logAudit({ actor, action: 'homepage.update', entityType: 'homepage_section', entityName: sections.map((s) => s.sectionType).join(', '), ipAddress })
  return { sections: result }
}
