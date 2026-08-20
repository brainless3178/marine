import { prisma } from '../server.js'
import { logAudit } from '../utils/audit.js'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../middleware/auth.js'

// ─── Queries ──────────────────────────────────────────────────

export async function getAllSettings() {
  const settings = await prisma.storeSetting.findMany({ orderBy: { category: 'asc' } })
  const grouped: Record<string, Record<string, unknown>> = {}
  for (const s of settings) {
    const cat = s.category || 'general'
    if (!grouped[cat]) grouped[cat] = {}
    grouped[cat][s.key] = s.value
  }
  return { settings: grouped, flat: settings }
}

export async function getPublicSettings() {
  const PUBLIC_KEYS = [
    'site.companyName', 'site.tagline', 'site.email', 'site.phone',
    'site.address', 'site.city', 'site.country', 'site.currency',
    'site.seoTitle', 'site.seoDescription', 'site.whatsappNumber',
    'site.rfqEmail', 'site.emergencyEmail',
    'checkout.shippingCost', 'checkout.taxRate', 'checkout.freeShippingThreshold',
  ]

  const settings = await prisma.storeSetting.findMany({ where: { key: { in: PUBLIC_KEYS } } })
  const result: Record<string, unknown> = {}
  for (const s of settings) {
    result[s.key] = s.value
  }

  // Add defaults from env vars
  result['site.companyName'] = result['site.companyName'] || process.env.COMPANY_NAME || 'Alka Traders'
  result['site.whatsappNumber'] = result['site.whatsappNumber'] || process.env.WHATSAPP_NUMBER || '918799095041'
  result['checkout.shippingCost'] = result['checkout.shippingCost'] || Number(process.env.DEFAULT_SHIPPING_COST) || 25
  result['checkout.taxRate'] = result['checkout.taxRate'] || Number(process.env.DEFAULT_TAX_RATE) || 0.08
  result['checkout.freeShippingThreshold'] = result['checkout.freeShippingThreshold'] || 100

  return { settings: result }
}

// ─── Mutations ────────────────────────────────────────────────

export async function updateSettings(settings: Record<string, unknown>, actor: AuthUser, ipAddress = '') {
  const updates = []
  for (const [key, value] of Object.entries(settings)) {
    updates.push(
      prisma.storeSetting.upsert({
        where: { key },
        update: { value: value as Prisma.InputJsonValue, updatedBy: actor.id },
        create: { key, value: value as Prisma.InputJsonValue, updatedBy: actor.id },
      })
    )
  }
  await Promise.all(updates)
  await logAudit({ actor, action: 'settings.update', entityType: 'store_settings', entityName: Object.keys(settings).join(', '), ipAddress })
  return { message: 'Settings updated', count: updates.length }
}
