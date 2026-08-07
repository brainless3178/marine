import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Create Admin User ─────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'sales@alkatraders.co'
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

  const categories: Record<string, string> = {}
  for (let i = 0; i < categoryData.length; i++) {
    const cat = await prisma.category.upsert({
      where: { slug: categoryData[i].slug },
      update: {},
      create: { ...categoryData[i], sortOrder: i },
    })
    categories[cat.slug] = cat.id
  }
  console.log(`✅ ${Object.keys(categories).length} categories`)

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

  const brands: Record<string, string> = {}
  for (let i = 0; i < brandData.length; i++) {
    const brand = await prisma.brand.upsert({
      where: { slug: brandData[i].slug },
      update: {},
      create: { ...brandData[i], sortOrder: i },
    })
    brands[brand.slug] = brand.id
  }
  console.log(`✅ ${Object.keys(brands).length} brands`)

  // ─── Create Industries ─────────────────────────────────────
  const industryData = [
    { name: 'Marine Shipping', slug: 'marine-shipping', icon: 'Ship', description: 'Vessel fleet operators and ship managers trust Alka Traders for urgent OEM spare parts.', painPoints: ['Critical equipment failure mid-voyage', 'Long lead times from OEMs', 'Inconsistent quality from unauthorized parts'] },
    { name: 'Shipyards & Drydocks', slug: 'shipyards', icon: 'Anchor', description: 'Drydock and repair facilities rely on our broad inventory.', painPoints: ['Tight drydock schedules', 'Bulk sourcing coordination', 'Hydraulic system integration'] },
    { name: 'Oil & Gas', slug: 'oil-gas', icon: 'Flame', description: 'Upstream and downstream operators trust our certified stock.', painPoints: ['ATEX/IECEx certification requirements', 'Remote offshore locations', 'Emergency shutdown failures'] },
    { name: 'Power Generation', slug: 'power-generation', icon: 'Zap', description: 'Power plant procurement teams source turbine components.', painPoints: ['Aging infrastructure', 'Grid compliance', 'Seasonal peak demand'] },
    { name: 'Manufacturing', slug: 'manufacturing', icon: 'Factory', description: 'Production line managers reduce downtime by sourcing automation components.', painPoints: ['Line stoppage costs', 'Obsolescence management', 'MRO inventory balancing'] },
    { name: 'Chemical Processing', slug: 'chemical-processing', icon: 'FlaskConical', description: 'Chemical plant procurement requires compliance-grade sourcing.', painPoints: ['SIL certification', 'Corrosion-resistant materials', 'Batch production schedules'] },
  ]

  const industries: Record<string, string> = {}
  for (let i = 0; i < industryData.length; i++) {
    const ind = await prisma.industry.upsert({
      where: { slug: industryData[i].slug },
      update: {},
      create: { ...industryData[i], sortOrder: i },
    })
    industries[ind.slug] = ind.id
  }
  console.log(`✅ ${Object.keys(industries).length} industries`)

  // ─── Create Products ───────────────────────────────────────
  const brandMap: Record<string, string> = {
    'ABB': 'abb', 'Siemens': 'siemens', 'Parker': 'parker', 'Bosch Rexroth': 'bosch-rexroth',
    'Schneider Electric': 'schneider', 'Danfoss': 'danfoss', 'Honeywell': 'honeywell',
    'Emerson': 'emerson', 'Festo': 'festo', 'SMC': 'smc', 'Grundfos': 'grundfos',
    'Atlas Copco': 'atlas-copco', 'Wärtsilä': 'wartsila', 'Alfa Laval': 'alfa-laval',
    'Kongsberg': 'kongsberg', 'SKF': 'skf', 'IFM': 'ifm', 'Pepperl+Fuchs': 'pepperl-fuchs',
    'Sick AG': 'sick', 'Omron': 'omron', 'Phoenix Contact': 'phoenix-contact', 'Rittal': 'rittal',
  }

  // Sample product data from the frontend
  const productData = [
    { name: 'Marine GPS Navigator', brand: 'ABB', sku: 'GPS-NAV-3200', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', price: 3200, filename: 'product-001_electrical.jpg' },
    { name: 'Deck Crane Hydraulic Motor', brand: 'Parker', sku: 'DCM-450-PK', category: 'marine', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', price: 4500, filename: 'product-002_electrical.jpg' },
    { name: 'VHF Marine Radio', brand: 'Siemens', sku: 'VHF-7800-SM', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', price: 1800, filename: 'product-003_electrical.jpg' },
    { name: 'Radar Antenna Unit', brand: 'Honeywell', sku: 'RAD-ANT-220', category: 'marine', industry: ['marine-shipping'], availability: 'in-stock', price: 5600, filename: 'product-004_electrical.jpg' },
    { name: 'ECDIS Navigation Display', brand: 'ABB', sku: 'ECDIS-9600', category: 'marine', industry: ['marine-shipping'], availability: 'emergency', price: 8900, filename: 'product-005_electrical.jpg' },
    { name: 'Variable Speed Drive 2.2kW', brand: 'ABB', sku: 'ACS880-01-02A7', category: 'electrical', industry: ['manufacturing', 'power-generation'], availability: 'emergency', price: 2200, filename: 'product-031_equipments-tools.jpg' },
    { name: 'PLC CPU Module S7-1500', brand: 'Siemens', sku: '6ES7511-1AK02', category: 'electrical', industry: ['manufacturing'], availability: 'emergency', price: 4500, filename: 'product-032_equipments-tools.jpg' },
    { name: 'Contactor 40A 3-Pole', brand: 'Schneider Electric', sku: 'LC1D40M7C', category: 'electrical', industry: ['manufacturing', 'power-generation'], availability: 'in-stock', price: 320, filename: 'product-033_equipments-tools.jpg' },
    { name: 'Axial Piston Pump 75cc', brand: 'Bosch Rexroth', sku: 'A10VSO-71-DFR1', category: 'hydraulic', industry: ['marine-shipping', 'oil-gas'], availability: 'in-stock', price: 3800, filename: 'product-059_safety.jpg' },
    { name: 'Hydraulic Cylinder 100mm Bore', brand: 'Parker', sku: 'HCR-100-500-PK', category: 'hydraulic', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', price: 1200, filename: 'product-060_safety.jpg' },
    { name: 'Pneumatic Cylinder ISO 15552', brand: 'Festo', sku: 'DSBC-63-200-PPVA', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', price: 450, filename: 'product-084_hydraulic.jpg' },
    { name: 'Air Solenoid Valve 5/2', brand: 'SMC', sku: 'VFA5220-03', category: 'pneumatic', industry: ['manufacturing'], availability: 'in-stock', price: 180, filename: 'product-085_hydraulic.jpg' },
    { name: '3-Phase Induction Motor 15kW', brand: 'ABB', sku: 'M3AA-160LMB', category: 'spares', industry: ['manufacturing', 'power-generation'], availability: 'in-stock', price: 2800, filename: 'product-106.jpg' },
    { name: 'Deep Groove Ball Bearing 6205', brand: 'SKF', sku: '6205-2RS1', category: 'spares', industry: ['manufacturing'], availability: 'in-stock', price: 85, filename: 'product-107.jpg' },
    { name: 'Unused ABB VFD ACS580', brand: 'ABB', sku: 'ACS580-01-12A4-4', category: 'surplus', industry: ['manufacturing'], availability: 'in-stock', price: 1800, filename: 'product-121.jpg' },
    { name: 'Overhead Bridge Crane 5 Ton', brand: 'ABB', sku: 'OBC-5000-DM', category: 'lifting-handling', industry: ['manufacturing', 'shipyards'], availability: 'in-stock', price: 12000, filename: 'product-134.jpg' },
    { name: 'Industrial Heat Gun 2000W', brand: 'Bosch Rexroth', sku: 'HG-2000-BS', category: 'tools-equipment', industry: ['manufacturing'], availability: 'in-stock', price: 120, filename: 'product-144.jpg' },
    { name: 'Full Body Fall Arrest Harness', brand: 'ABB', sku: 'FBH-500-3M', category: 'safety', industry: ['construction', 'shipyards'], availability: 'in-stock', price: 350, filename: 'product-154.jpg' },
    { name: 'Combination Wrench Set 8-24mm', brand: 'Parker', sku: 'CWS-824-SO', category: 'hand-tools', industry: ['manufacturing', 'marine'], availability: 'in-stock', price: 280, filename: 'product-164.jpg' },
    { name: 'Autopilot System Marine', brand: 'Kongsberg', sku: 'AP-M-SR', category: 'ship-navigation', industry: ['marine-shipping'], availability: 'in-stock', price: 6500, filename: 'product-174.jpg' },
    { name: 'Bilge Pump Submersible 2000GPH', brand: 'Grundfos', sku: 'BPS-2000-RL', category: 'marine-pumps', industry: ['marine-shipping'], availability: 'in-stock', price: 420, filename: 'product-182.jpg' },
    { name: 'Diesel Engine Piston Ring Set', brand: 'Wärtsilä', sku: 'DEPRS-MAN', category: 'engine-spare', industry: ['marine-shipping', 'power-generation'], availability: 'in-stock', price: 950, filename: 'product-190.jpg' },
    { name: 'Fuel Injector Common Rail', brand: 'Bosch Rexroth', sku: 'FICR-BS', category: 'engine-parts', industry: ['marine-shipping', 'power-generation'], availability: 'in-stock', price: 780, filename: 'product-200.jpg' },
    { name: 'AC Induction Motor 7.5kW', brand: 'ABB', sku: 'AIM-7.5-AB', category: 'motor-components', industry: ['manufacturing', 'marine-shipping'], availability: 'in-stock', price: 1600, filename: 'product-210.jpg' },
    { name: 'Anchor Windlass Hydraulic', brand: 'Parker', sku: 'AWH-PK', category: 'ship-machinery', industry: ['marine-shipping', 'shipyards'], availability: 'in-stock', price: 8500, filename: 'product-220.jpg' },
    { name: 'Axial Piston Pump Variable 100cc', brand: 'Bosch Rexroth', sku: 'APPV-100-BR', category: 'hydraulic-pumps', industry: ['manufacturing', 'marine-shipping'], availability: 'in-stock', price: 4200, filename: 'product-228.jpg' },
    { name: 'Lifting Sling Round 3 Ton 2m', brand: 'Parker', sku: 'LSR-3T2M-LA', category: 'rigging', industry: ['shipyards', 'construction'], availability: 'in-stock', price: 180, filename: 'product-236.jpg' },
    { name: 'Industrial Vacuum Cleaner 30L', brand: 'ABB', sku: 'IVC-30-NF', category: 'other-business', industry: ['manufacturing', 'marine-shipping'], availability: 'in-stock', price: 850, filename: 'product-246.jpg' },
  ]

  let productCount = 0
  for (let i = 0; i < productData.length; i++) {
    const p = productData[i]
    const brandSlug = brandMap[p.brand] || p.brand.toLowerCase()
    const brandId = brands[brandSlug]

    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        slug: p.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        brandId: brandId || null,
        categoryId: categories[p.category] || null,
        status: 'published',
        availability: p.availability as any,
        condition: 'used',
        description: `${p.name} — marine & industrial equipment. SKU: ${p.sku}.`,
        regularPrice: p.price,
        stockCount: p.availability === 'emergency' ? 1 : Math.floor(Math.random() * 10) + 1,
        isFeatured: i < 4,
        isNewArrival: i % 5 === 0,
        makeOfferEnabled: true,
        legacyId: `prod-${String(i + 1).padStart(3, '0')}`,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    })

    // Add image
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `/images/${p.filename}`,
        altText: `${p.name} - Main View`,
        label: 'Main',
        isMain: true,
        sortOrder: 0,
      },
    })

    // Connect industries
    for (const indSlug of p.industry) {
      const indId = industries[indSlug]
      if (indId) {
        await prisma.productIndustry.create({
          data: { productId: product.id, industryId: indId },
        })
      }
    }

    productCount++
  }
  console.log(`✅ ${productCount} products`)

  // ─── Create Testimonials ───────────────────────────────────
  const testimonialData = [
    { name: 'noraedward', role: 'Verified Buyer', company: '', text: 'Item: ROTHENBERGER ROLeak PRO LEAK DETECTOR GAS SNIFFER. Very helpful seller. They investigated the issue when the delivery company delivered my parcel to the wrong person. Quick to address the situation, kept me informed and got the parcel delivered to me. Would recommend.', rating: 5 },
    { name: 'b2esurplus', role: 'Verified Buyer — B2E Surplus', company: 'Back to Earth Surplus', text: 'Item: RIDGID D223 PIPE THREADER RATCHET 1 INCH SQUARE DRIVE. Five star transaction. Good shipping. Good packaging. Item as described. Good quality product in good condition. Thank you! At B2E Surplus, we buy and sell similar merchandise and are always interested in bulk lots and good deals on industrial supplies.', rating: 5 },
    { name: 'fuegocat77', role: 'Verified Buyer', company: '', text: 'RECORD 91 1/2 C Pipe Vise received as pictured. Shipping was very fast and FREE with unexpectedly quick delivery from India. Item was well wrapped in bubble wrap but box padding could have been better on the bottom. Nothing broken, so not an issue.', rating: 5 },
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
  console.log(`   Categories: ${Object.keys(categories).length}`)
  console.log(`   Brands: ${Object.keys(brands).length}`)
  console.log(`   Industries: ${Object.keys(industries).length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
