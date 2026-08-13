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

  // ─── Create Testimonials ───────────────────────────────────
  const testimonialData = [
    { name: 'fuegocat77 (276)', role: '', company: '', text: 'Record 91 ½ C Pipe Vise received as pictured on eBay. Shipping was very fast and FREE, with unexpectedly quick delivery from India. Packaging could have been better. Item shipped in corrugated cardboard box completely wrapped in duck tape. Vise itself was heavily covered in bubble wrap. Box was padded with pieces of Styrofoam on the sides and top, but not the bottom. As a result, the front mounting pad wore through the box, resulting in scraped paint. Nothing broken, so not an issue.', rating: 5 },
    { name: 'noraedward (1104)', role: '', company: '', text: 'Very helpful seller. They investigated the issue I had when the delivery company delivered my parcel to the wrong person. Was very quick to address the situation, keep me informed and get the parcel delivered to me. Would recommend.', rating: 5 },
    { name: 'b2esurplus (7400)', role: '', company: '', text: 'Five star transaction. Good shipping. Good packaging. Item as described. Good quality product in good condition. Good appearance. Thank you for the good transaction! All five stars. At B2E Surplus (aka Back to Earth Surplus), we buy and sell a lot of similar merchandise. We are always interested in bulk lots and/or good deals on industrial supplies. Look us up anytime!', rating: 5 },
  ]

  for (let i = 0; i < testimonialData.length; i++) {
    await prisma.testimonial.create({
      data: { ...testimonialData[i], sortOrder: i, isVisible: true },
    })
  }
  console.log(`✅ ${testimonialData.length} testimonials`)

  // ─── Create Offices ────────────────────────────────────────
  const officeData = [
    { city: 'BHAVNAGAR', country: 'India', address: 'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA', timezone: 'Asia/Kolkata', phone: '+91 87990 95041', email: 'sales@alkatraders.co', coordinatesLat: 21.7645, coordinatesLng: 72.1519 },
  ]

  for (let i = 0; i < officeData.length; i++) {
    await prisma.office.create({ data: { ...officeData[i], sortOrder: i, isVisible: true } })
  }
  console.log(`✅ ${officeData.length} offices`)

  // ─── Create Store Settings ──────────────────────────────────
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

  // ─── Create Homepage Sections ───────────────────────────────
  const homepageSections = [
    { sectionType: 'hero', label: 'Hero Banner', sortOrder: 0, config: {} },
    { sectionType: 'featured', label: 'Featured Products', sortOrder: 1, config: {} },
    { sectionType: 'stats', label: 'Stats Bar', sortOrder: 2, config: {} },
    { sectionType: 'categories', label: 'Categories Grid', sortOrder: 3, config: {} },
    { sectionType: 'brands', label: 'Brand Marquee', sortOrder: 4, config: {} },
    { sectionType: 'testimonials', label: 'Testimonials', sortOrder: 5, config: {} },
    { sectionType: 'industries', label: 'Industries Tabs', sortOrder: 6, config: {} },
    { sectionType: 'cta', label: 'RFQ CTA', sortOrder: 7, config: {} },
  ]

  for (const s of homepageSections) {
    await prisma.homepageSection.create({ data: { ...s, isEnabled: true } })
  }
  console.log(`✅ ${homepageSections.length} homepage sections`)

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
