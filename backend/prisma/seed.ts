import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Create Admin User ─────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@alkatraders.co'
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('❌ ADMIN_PASSWORD environment variable is required for seeding.')
    process.exit(1)
  }
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12)
  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: process.env.ADMIN_NAME || 'Store Owner',
      role: 'owner',
    },
  })
  console.log(`✅ Admin user: ${admin.email}`)

  // ─── Create Categories ─────────────────────────────────────
  const categoryData = [
    { name: 'Marine Equipment', slug: 'marine', icon: 'Ship' },
    { name: 'Electrical Automation', slug: 'electrical', icon: 'Zap' },
    { name: 'Hydraulic Systems', slug: 'hydraulic', icon: 'Droplet' },
    { name: 'Pneumatic Systems', slug: 'pneumatic', icon: 'Wind' },
    { name: 'Industrial Spare Parts', slug: 'spares', icon: 'Settings' },
    { name: 'Surplus Inventory', slug: 'surplus', icon: 'Warehouse' },
    { name: 'Lifting & Handling', slug: 'lifting-handling', icon: 'ArrowUpFromLine' },
    { name: 'Tools & Equipment', slug: 'tools-equipment', icon: 'Wrench' },
    { name: 'Safety Equipment', slug: 'safety', icon: 'ShieldCheck' },
    { name: 'Hand Tools', slug: 'hand-tools', icon: 'Hammer' },
    { name: 'Ship Navigation', slug: 'ship-navigation', icon: 'Compass' },
    { name: 'Marine Pumps', slug: 'marine-pumps', icon: 'Droplets' },
    { name: 'Engine Spare Parts', slug: 'engine-spare', icon: 'Cog' },
    { name: 'Engine Parts', slug: 'engine-parts', icon: 'Cog' },
    { name: 'Motors & Components', slug: 'motor-components', icon: 'Zap' },
    { name: 'Ship Machinery', slug: 'ship-machinery', icon: 'Ship' },
    { name: 'Hydraulic Pumps', slug: 'hydraulic-pumps', icon: 'Droplet' },
    { name: 'Rigging & Lashing', slug: 'rigging', icon: 'Anchor' },
    { name: 'Other Business & Industrial', slug: 'other-business', icon: 'Package' },
  ]

  for (let i = 0; i < categoryData.length; i++) {
    await prisma.category.upsert({
      where: { slug: categoryData[i].slug },
      update: {},
      create: { ...categoryData[i], sortOrder: i },
    })
  }
  console.log(`✅ ${categoryData.length} categories`)

  // ─── Create Brands ─────────────────────────────────────────
  const brandData = [
    { name: 'ABB', slug: 'abb', sectors: ['Marine', 'Industrial', 'Automation'] },
    { name: 'Siemens', slug: 'siemens', sectors: ['Marine', 'Industrial', 'Automation'] },
    { name: 'Parker Hannifin', slug: 'parker', sectors: ['Marine', 'Industrial', 'Hydraulic'] },
    { name: 'Bosch Rexroth', slug: 'bosch-rexroth', sectors: ['Industrial', 'Hydraulic', 'Automation'] },
    { name: 'Schneider Electric', slug: 'schneider', sectors: ['Industrial', 'Automation'] },
    { name: 'Danfoss', slug: 'danfoss', sectors: ['Marine', 'Industrial'] },
    { name: 'Honeywell', slug: 'honeywell', sectors: ['Marine', 'Industrial', 'Automation'] },
    { name: 'Emerson', slug: 'emerson', sectors: ['Industrial', 'Automation'] },
    { name: 'Festo', slug: 'festo', sectors: ['Industrial', 'Pneumatic'] },
    { name: 'SMC', slug: 'smc', sectors: ['Industrial', 'Pneumatic'] },
    { name: 'Grundfos', slug: 'grundfos', sectors: ['Marine', 'Industrial'] },
    { name: 'Atlas Copco', slug: 'atlas-copco', sectors: ['Industrial', 'Pneumatic'] },
    { name: 'Wärtsilä', slug: 'wartsila', sectors: ['Marine'] },
    { name: 'Alfa Laval', slug: 'alfa-laval', sectors: ['Marine', 'Industrial'] },
    { name: 'Kongsberg', slug: 'kongsberg', sectors: ['Marine'] },
    { name: 'SKF', slug: 'skf', sectors: ['Industrial'] },
    { name: 'IFM', slug: 'ifm', sectors: ['Industrial', 'Automation'] },
    { name: 'Pepperl+Fuchs', slug: 'pepperl-fuchs', sectors: ['Industrial', 'Automation'] },
    { name: 'Sick AG', slug: 'sick', sectors: ['Industrial', 'Automation'] },
    { name: 'Omron', slug: 'omron', sectors: ['Industrial', 'Automation'] },
    { name: 'Phoenix Contact', slug: 'phoenix-contact', sectors: ['Industrial', 'Automation'] },
    { name: 'Rittal', slug: 'rittal', sectors: ['Industrial'] },
  ]

  for (let i = 0; i < brandData.length; i++) {
    await prisma.brand.upsert({
      where: { slug: brandData[i].slug },
      update: {},
      create: { ...brandData[i], sortOrder: i },
    })
  }
  console.log(`✅ ${brandData.length} brands`)

  // ─── Create Industries ─────────────────────────────────────
  const industryData = [
    { name: 'Marine Shipping', slug: 'marine-shipping', icon: 'Ship', description: 'Vessel fleet operators and ship managers trust Alka Traders for urgent OEM spare parts.', painPoints: ['Critical equipment failure mid-voyage', 'Long lead times from OEMs', 'Inconsistent quality from unauthorized parts'] },
    { name: 'Shipyards & Drydocks', slug: 'shipyards', icon: 'Anchor', description: 'Drydock and repair facilities rely on our broad inventory.', painPoints: ['Tight drydock schedules', 'Bulk sourcing coordination', 'Hydraulic system integration'] },
    { name: 'Oil & Gas', slug: 'oil-gas', icon: 'Flame', description: 'Upstream and downstream operators trust our certified stock.', painPoints: ['ATEX/IECEx certification requirements', 'Remote offshore locations', 'Emergency shutdown failures'] },
    { name: 'Power Generation', slug: 'power-generation', icon: 'Zap', description: 'Power plant procurement teams source turbine components.', painPoints: ['Aging infrastructure', 'Grid compliance', 'Seasonal peak demand'] },
    { name: 'Manufacturing', slug: 'manufacturing', icon: 'Factory', description: 'Production line managers reduce downtime by sourcing automation components.', painPoints: ['Line stoppage costs', 'Obsolescence management', 'MRO inventory balancing'] },
    { name: 'Chemical Processing', slug: 'chemical-processing', icon: 'FlaskConical', description: 'Chemical plant procurement requires compliance-grade sourcing.', painPoints: ['SIL certification', 'Corrosion-resistant materials', 'Batch production schedules'] },
  ]

  for (let i = 0; i < industryData.length; i++) {
    await prisma.industry.upsert({
      where: { slug: industryData[i].slug },
      update: {},
      create: { ...industryData[i], sortOrder: i },
    })
  }
  console.log(`✅ ${industryData.length} industries`)

  // ─── Products ────────────────────────────────────────────────
  // No products are seeded. The catalog is intentionally empty —
  // all products were removed from the database, Cloudinary, and the site.
  const productCount = 0
  console.log(`✅ ${productCount} products (catalog intentionally empty)`)

  // ─── Store Settings ──────────────────────────────────────────
  const settings = [
    { key: 'site.companyName', value: 'Alka Traders', category: 'site' },
    { key: 'site.tagline', value: 'Marine and Industrial Equipment', category: 'site' },
    { key: 'site.email', value: process.env.COMPANY_EMAIL || 'sales@alkatraders.co', category: 'site' },
    { key: 'site.phone', value: process.env.COMPANY_PHONE || '+91 87990 95041', category: 'site' },
    { key: 'site.whatsappNumber', value: process.env.WHATSAPP_NUMBER || '918799095041', category: 'site' },
    { key: 'site.currency', value: 'USD', category: 'site' },
    { key: 'site.rfqEmail', value: process.env.RFQ_EMAIL || 'sales@alkatraders.co', category: 'site' },
    { key: 'site.emergencyEmail', value: process.env.EMERGENCY_EMAIL || 'sales@alkatraders.co', category: 'site' },
    { key: 'checkout.shippingCost', value: Number(process.env.DEFAULT_SHIPPING_COST) || 25, category: 'checkout' },
    { key: 'checkout.taxRate', value: Number(process.env.DEFAULT_TAX_RATE) || 0.08, category: 'checkout' },
    { key: 'checkout.freeShippingThreshold', value: 500, category: 'checkout' },
  ]

  for (const s of settings) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { ...s, updatedBy: admin.id },
    })
  }
  console.log(`✅ ${settings.length} store settings`)

  console.log('\n🎉 Seed complete!')
  console.log(`   Admin: ${adminEmail} / [REDACTED]`)
  console.log(`   Products: ${productCount}`)
  console.log(`   Categories: ${categoryData.length}`)
  console.log(`   Brands: ${brandData.length}`)
  console.log(`   Industries: ${industryData.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
