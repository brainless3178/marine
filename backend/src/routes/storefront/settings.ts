import { Router } from 'express'
import { prisma } from '../../server.js'
import { asyncHandler } from '../../middleware/validate.js'
import { sendSuccess } from '../../middleware/response.js'

const router = Router()

// ─── Get Public Settings ───────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const PUBLIC_KEYS = [
    'site.companyName', 'site.tagline', 'site.email', 'site.phone',
    'site.address', 'site.city', 'site.country', 'site.currency',
    'site.seoTitle', 'site.seoDescription', 'site.whatsappNumber',
    'site.rfqEmail', 'site.emergencyEmail',
    'checkout.shippingCost', 'checkout.taxRate', 'checkout.freeShippingThreshold',
  ]

  const settings = await prisma.storeSetting.findMany({
    where: { key: { in: PUBLIC_KEYS } },
  })

  const result: Record<string, any> = {}
  for (const s of settings) {
    result[s.key] = s.value
  }

  // Add defaults from env vars
  result['site.companyName'] = result['site.companyName'] || process.env.COMPANY_NAME || 'Alka Traders'
  result['site.whatsappNumber'] = result['site.whatsappNumber'] || process.env.WHATSAPP_NUMBER || '919726900547'
  result['checkout.shippingCost'] = result['checkout.shippingCost'] || Number(process.env.DEFAULT_SHIPPING_COST) || 25
  result['checkout.taxRate'] = result['checkout.taxRate'] || Number(process.env.DEFAULT_TAX_RATE) || 0.08

  sendSuccess(res, { settings: result })
}))

export default router
