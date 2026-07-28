/**
 * Generated route list for build-time prerendering.
 *
 * This file defines every URL path that should be prerendered as a static
 * HTML shell during the build. Routes are generated for all three locales
 * (en, ar, es) so each locale has its own crawlable URL.
 *
 * Static routes have locale-specific titles/descriptions (placeholder for
 * now — update translations for each locale when localized content exists).
 *
 * The prerender script consumes this list to generate SEO-optimized HTML files.
 */

// ─── Supported Locales ────────────────────────────────────────────

const LOCALES = ['en', 'ar', 'es']

// ─── Static Route Templates ──────────────────────────────────────

const STATIC_ROUTES_TEMPLATES = [
  {
    path: '/',
    titles: {
      en: 'Alka Traders — Marine & Industrial Equipment Supplier',
      ar: 'المشتريات البحرية والصناعية العالمية — Alka Traders',
      es: 'Adquisiciones Marinas e Industriales Globales — Alka Traders',
    },
    descriptions: {
      en: 'Alka Traders supplies marine spare parts, industrial equipment, surplus machinery, and emergency procurement from Bhavnagar, Gujarat, India.',
      ar: 'Alka Traders تورد قطع الغيار البحرية والمعدات الصناعية والآلات الفائضة وخدمات الشراء الطارئ من بافناغار، غوجارات، الهند.',
      es: 'Alka Traders suministra repuestos marinos, equipos industriales, maquinaria excedente y adquisiciones de emergencia desde Bhavnagar, Gujarat, India.',
    },
    priority: 1.0, changefreq: 'weekly',
  },
  {
    path: '/shop',
    titles: { en: 'Shop Marine & Industrial Equipment — Alka Traders', ar: 'متجر المعدات البحرية والصناعية — Alka Traders', es: 'Tienda de Equipos Marinos e Industriales — Alka Traders' },
    priority: 0.9, changefreq: 'daily',
    descriptions: {
      en: 'Browse our full catalog of marine spares, industrial automation, hydraulic systems, and surplus equipment. Shop by brand, category, or condition.',
      ar: 'تصفح كتالوجنا الكامل لقطع الغيار البحرية والأتمتة الصناعية والأنظمة الهيدروليكية والمعدات الفائضة.',
      es: 'Explore nuestro catálogo completo de repuestos marinos, automatización industrial, sistemas hidráulicos y equipos excedentes.',
    },
  },
  {
    path: '/products',
    titles: { en: 'All Products — Marine Spares & Industrial Equipment', ar: 'كتالوج المنتجات الكامل — قطع الغيار البحرية والمعدات الصناعية — Alka Traders', es: 'Catálogo Completo — Repuestos Marinos y Equipos Industriales — Alka Traders' },
    priority: 0.9, changefreq: 'daily',
    descriptions: {
      en: 'Complete product catalog of 255+ marine, electrical, hydraulic, pneumatic, and industrial equipment items. Filter by brand, category, condition, and price.',
      ar: 'كتالوج كامل يضم أكثر من 255 قطعة من المعدات البحرية والكهربائية والهيدروليكية والهوائية والصناعية.',
      es: 'Catálogo completo de más de 255 artículos de equipos marinos, eléctricos, hidráulicos, neumáticos e industriales.',
    },
  },
  {
    path: '/industries',
    titles: { en: 'Industries Served — Marine, Oil & Gas, Manufacturing', ar: 'القطاعات التي نخدمها — البحرية والنفط والغاز والتصنيع', es: 'Sectores que Servimos — Marina, Petróleo y Gas, Manufactura' },
    priority: 0.7, changefreq: 'monthly',
  },
  {
    path: '/brands',
    titles: { en: 'Brands We Supply — Marine & Industrial Equipment', ar: 'العلامات التجارية المعتمدة — المعدات البحرية والصناعية — Alka Traders', es: 'Marcas Autorizadas — Equipos Marinos e Industriales — Alka Traders' },
    priority: 0.7, changefreq: 'monthly',
  },
  {
    path: '/about',
    titles: { en: 'About Alka Traders — Marine Equipment Specialists in Bhavnagar', ar: 'عن الكا تريدرز — متخصصو المعدات البحرية في بافناغار', es: 'Acerca de Alka Traders — Especialistas en Equipos Marinos en Bhavnagar' },
    priority: 0.6, changefreq: 'monthly',
  },
  {
    path: '/rfq',
    titles: { en: 'Request a Quote — Marine & Industrial Parts — Alka Traders', ar: 'طلب عرض سعر — قطع غيار بحرية وصناعية — Alka Traders', es: 'Solicitud de Cotización — Repuestos Marinos e Industriales — Alka Traders' },
    priority: 0.8, changefreq: 'monthly',
  },
  {
    path: '/contact',
    titles: { en: 'Contact Alka Traders — Bhavnagar, Gujarat, India', ar: 'اتصل بنا — بافناغار، غوجارات، الهند', es: 'Contacto — Bhavnagar, Gujarat, India' },
    priority: 0.6, changefreq: 'monthly',
  },
  {
    path: '/search',
    titles: { en: 'Search Results — Marine & Industrial Equipment — Alka Traders', ar: 'بحث — المعدات البحرية والصناعية — Alka Traders', es: 'Buscar — Equipos Marinos e Industriales — Alka Traders' },
    priority: 0.5, changefreq: 'monthly',
  },
  {
    path: '/emergency',
    titles: { en: 'Emergency Marine Parts — 24/7 Urgent Procurement', ar: 'قطع الغيار البحرية الطارئة — شراء عاجل على مدار الساعة', es: 'Repuestos Marinos de Emergencia — Adquisición Urgente 24/7' },
    priority: 0.8, changefreq: 'weekly',
  },
  {
    path: '/network',
    titles: { en: 'Global Network — Alka Traders Marine Equipment', ar: 'الشبكة العالمية — Alka Traders للمعدات البحرية', es: 'Red Global — Alka Traders Equipos Marinos' },
    priority: 0.4, changefreq: 'monthly',
  },
  {
    path: '/intelligence',
    titles: { en: 'Market Intelligence — Marine & Industrial Equipment', ar: 'ذكاء السوق — المعدات البحرية والصناعية', es: 'Inteligencia de Mercado — Equipos Marinos e Industriales' },
    priority: 0.4, changefreq: 'monthly',
  },
  {
    path: '/privacy-policy',
    titles: { en: 'Privacy Policy — Alka Traders', ar: 'سياسة الخصوصية — Alka Traders', es: 'Política de Privacidad — Alka Traders' },
    priority: 0.3, changefreq: 'yearly',
  },
  {
    path: '/terms-of-service',
    titles: { en: 'Terms of Service — Alka Traders', ar: 'شروط الخدمة — Alka Traders', es: 'Términos del Servicio — Alka Traders' },
    priority: 0.3, changefreq: 'yearly',
  },
  {
    path: '/refund-policy',
    titles: { en: 'Refund Policy — Alka Traders', ar: 'سياسة الاسترداد — Alka Traders', es: 'Política de Reembolso — Alka Traders' },
    priority: 0.3, changefreq: 'yearly',
  },
  {
    path: '/forgot-password',
    titles: { en: 'Forgot Password — Alka Traders', ar: 'نسيت كلمة المرور — Alka Traders', es: 'Olvidé mi Contraseña — Alka Traders' },
    priority: 0.1, changefreq: 'yearly',
  },
  {
    path: '/reset-password',
    titles: { en: 'Reset Password — Alka Traders', ar: 'إعادة تعيين كلمة المرور — Alka Traders', es: 'Restablecer Contraseña — Alka Traders' },
    priority: 0.1, changefreq: 'yearly',
  },
  {
    path: '/track-order',
    titles: { en: 'Track Order — Alka Traders', ar: 'تتبع الطلب — Alka Traders', es: 'Seguimiento de Pedido — Alka Traders' },
    priority: 0.3, changefreq: 'monthly',
  },
]

// ─── Dynamic Routes (generated from product data) ────────────────
// Product IDs are deterministic: prod-001 through prod-255

const PRODUCT_NAMES = {
  'prod-001': 'Marine GPS Navigator',
  'prod-002': 'Deck Crane Hydraulic Motor',
  'prod-003': 'VHF Marine Radio',
  'prod-004': 'Radar Antenna Unit',
  'prod-005': 'ECDIS Navigation Display',
  'prod-006': 'Marine Diesel Engine Sensor',
  'prod-007': 'Lifeboat Release Mechanism',
  'prod-008': 'Anchor Windlass Motor',
  'prod-009': 'Bilge Water Separator',
  'prod-010': 'Marine Exhaust Gas Monitor',
  'prod-011': 'Bow Thruster Control Panel',
  'prod-012': 'Marine Fire Detection System',
  'prod-013': 'Hatch Cover Hydraulic Cylinder',
  'prod-014': 'Marine Ballast Pump',
  'prod-015': 'Steering Gear Actuator',
  'prod-016': 'Marine Alarm Monitoring System',
  'prod-017': 'Deck Floodlight LED',
  'prod-018': 'Marine Air Compressor',
  'prod-019': 'Ship Bell Alarm System',
  'prod-020': 'Marine Fuel Purifier',
  'prod-021': 'Life Jacket Light',
  'prod-022': 'Marine Propeller Shaft Seal',
  'prod-023': 'Gyro Compass Unit',
  'prod-024': 'Marine Seawater Pump',
  'prod-025': 'Deck Crane Limit Switch',
  'prod-026': 'Marine Intercom System',
  'prod-027': 'Cargo Hold Ventilation Fan',
  'prod-028': 'Marine Sewage Treatment Unit',
  'prod-029': 'Bridge Wing Console',
  'prod-030': 'Marine Oil Water Separator',
  'prod-031': 'Variable Speed Drive 2.2kW',
  'prod-032': 'PLC CPU Module S7-1500',
  'prod-033': 'Contactor 40A 3-Pole',
  'prod-034': 'Circuit Breaker MCCB 250A',
  'prod-035': 'Frequency Inverter 7.5kW',
  'prod-036': 'Motor Protection Relay',
  'prod-037': 'Soft Starter 45kW',
  'prod-038': 'Power Factor Controller',
  'prod-039': 'Industrial HMI Panel 15 inch',
  'prod-040': 'Temperature Controller PID',
  'prod-041': 'Modular PLC I/O Module',
  'prod-042': 'DIN Rail Power Supply 24V',
  'prod-043': 'Industrial Ethernet Switch',
  'prod-044': 'Contactron Motor Starter',
  'prod-045': 'Servo Drive Unit 3kW',
  'prod-046': 'Molded Case Circuit Breaker',
  'prod-047': 'Digital Power Meter',
  'prod-048': 'Variable Frequency Drive 15kW',
  'prod-049': 'Safety Relay Module',
  'prod-050': 'Panel Mount Ammeter',
  'prod-051': 'Industrial Relay Module 8CH',
  'prod-052': 'Thermal Overload Relay',
  'prod-053': 'AC Drive Module 55kW',
  'prod-054': 'Smart MCC Panel Section',
  'prod-055': 'Surge Protection Device Type2',
  'prod-056': 'Industrial UPS 3kVA',
  'prod-057': 'Motor Soft Starter 132kW',
  'prod-058': 'Capacitor Bank 50kVAR',
  'prod-059': 'Axial Piston Pump 75cc',
  'prod-060': 'Hydraulic Cylinder 100mm Bore',
  'prod-061': 'Directional Control Valve',
  'prod-062': 'Hydraulic Power Unit 15kW',
  'prod-063': 'Gear Pump 40cc',
  'prod-064': 'Hydraulic Filter Element 10um',
  'prod-065': 'Proportional Pressure Valve',
  'prod-066': 'Hydraulic Accumulator 4L',
  'prod-067': 'Vane Pump 25cc',
  'prod-068': 'Counterbalance Valve',
  'prod-069': 'Hydraulic Hose Assembly 1m',
  'prod-070': 'Flow Control Valve',
  'prod-071': 'Hydraulic Motor 500cc/rev',
  'prod-072': 'Pressure Relief Valve 250bar',
  'prod-073': 'Hydraulic Tank 200L',
  'prod-074': 'Hydraulic Manifold Block 6-Port',
  'prod-075': 'Check Valve Pilot Operated',
  'prod-076': 'Hydraulic Cartridge Valve',
  'prod-077': 'Solenoid Valve 24VDC 3/2',
  'prod-078': 'Hydraulic Quick Coupling Set',
  'prod-079': 'Radial Piston Pump 100cc',
  'prod-080': 'Hydraulic Oil Cooler 5kW',
  'prod-081': 'Proportional Flow Valve',
  'prod-082': 'Hydraulic Test Gauge 400bar',
  'prod-083': 'Hydraulic Power Pack 5.5kW',
  'prod-084': 'Pneumatic Cylinder ISO 15552',
  'prod-085': 'Air Solenoid Valve 5/2',
  'prod-086': 'FRL Unit with Gauge',
  'prod-087': 'Pneumatic Gripper Parallel',
  'prod-088': 'Air Dryer Regenerative',
  'prod-089': 'Pneumatic Rotary Actuator',
  'prod-090': 'Quick Exhaust Valve',
  'prod-091': 'Pneumatic Air Gun',
  'prod-092': 'Air Preparation Unit Mini',
  'prod-093': 'Pneumatic Tubing 8mm Blue',
  'prod-094': 'Flow Sensor Pneumatic',
  'prod-095': 'Vacuum Generator Multi Stage',
  'prod-096': 'Pneumatic Silencer Muffler',
  'prod-097': 'Rodless Cylinder Guided',
  'prod-098': 'Pneumatic Push-In Fitting Set',
  'prod-099': 'Air Receiver Tank 100L',
  'prod-100': 'Pneumatic Timer Valve',
  'prod-101': 'Pressure Switch Pneumatic',
  'prod-102': 'Pneumatic Slide Table Cylinder',
  'prod-103': 'Quick Connect Coupling Set',
  'prod-104': 'Pneumatic Filter Element 5um',
  'prod-105': 'Micro Pneumatic Cylinder',
  'prod-106': '3-Phase Induction Motor 15kW',
  'prod-107': 'Deep Groove Ball Bearing 6205',
  'prod-108': 'Flexible Coupling 28mm',
  'prod-109': 'Inductive Proximity Sensor M18',
  'prod-110': 'Industrial Encoder Incremental',
  'prod-111': 'AC Servo Motor 2kW',
  'prod-112': 'Thermal Overload Bimetal Relay',
  'prod-113': 'Timing Belt HTD 5M-450',
  'prod-114': 'Stainless Steel Coupling Jaw',
  'prod-115': 'Photoelectric Sensor Retro',
  'prod-116': 'Vibration Sensor Industrial',
  'prod-117': 'NTN Bearing 6310-2RS',
  'prod-118': 'Fluorescent Tube Guard IP65',
  'prod-119': 'Conveyor Rollers 50mm Ø',
  'prod-120': 'Power Cable 3G2.5mm 10m',
  'prod-121': 'Unused ABB VFD ACS580',
  'prod-122': 'New Old Stock Siemens PLC S7-300',
  'prod-123': 'Surplus Hydraulic Pump A10VSO',
  'prod-124': 'Overstock Schneider MCCB 630A',
  'prod-125': 'Unopened Parker Valve Kit',
  'prod-126': 'Unused Atlas Air Compressor',
  'prod-127': 'Surplus Festo Cylinder DSBC',
  'prod-128': 'Overstock Honeywell Sensor Kit',
  'prod-129': 'New Danfoss Compressor SC15',
  'prod-130': 'Surplus Grundfos Pump CRN',
  'prod-131': 'Unused Emerson Valve Positioner',
  'prod-132': 'Overstock SMC Pneumatic Set',
  'prod-133': 'Surplus Siemens HMI TP1500',
  'prod-134': 'Overhead Bridge Crane 5 Ton',
  'prod-135': 'Electric Chain Hoist 2 Ton',
  'prod-136': 'Manual Pallet Jack 2500kg',
  'prod-137': 'Forklift Counterbalance 3 Ton',
  'prod-138': 'Jib Crane Floor Mounted 1 Ton',
  'prod-139': 'Hydraulic Scissor Lift Table',
  'prod-140': 'Wire Rope Sling Set 3m',
  'prod-141': 'Vacuum Lifting Pad 500kg',
  'prod-142': 'Gantry Crane Adjustable 2 Ton',
  'prod-143': 'Lifting Beam Spreader 4 Point',
  'prod-144': 'Industrial Heat Gun 2000W',
  'prod-145': 'Digital Multimeter True RMS',
  'prod-146': 'Battery Powered Impact Wrench',
  'prod-147': 'Angle Grinder 7 inch 2000W',
  'prod-148': 'Thermal Imaging Camera',
  'prod-149': 'Bench Grinder 8 inch',
  'prod-150': 'Cordless Drill Driver 18V',
  'prod-151': 'Pipe Threading Machine 1/2-2 inch',
  'prod-152': 'Ultrasonic Thickness Gauge',
  'prod-153': 'Hydraulic Crimping Tool 400mm²',
  'prod-154': 'Full Body Fall Arrest Harness',
  'prod-155': 'Gas Detector Multi-Gas',
  'prod-156': 'Fire Extinguisher CO2 5kg',
  'prod-157': 'Safety Helmet Industrial Grade',
  'prod-158': 'Welding Shield Auto-Darkening',
  'prod-159': 'Emergency Eye Wash Station',
  'prod-160': 'High Visibility Safety Vest Class 2',
  'prod-161': 'Safety Goggles Anti-Fog',
  'prod-162': 'Life Buoy Ring 30 inch',
  'prod-163': 'Confined Space Tripod Kit',
  'prod-164': 'Combination Wrench Set 8-24mm',
  'prod-165': 'Socket Set 1/2 Drive 40 Piece',
  'prod-166': 'Adjustable Wrench 12 inch',
  'prod-167': 'Torque Wrench 1/2 Drive',
  'prod-168': 'Pliers Set 5 Piece Insulated',
  'prod-169': 'Screwdriver Set 20 Piece',
  'prod-170': 'Tape Measure 25ft Magnetic',
  'prod-171': 'Allen Key Set Metric 1.5-10mm',
  'prod-172': 'Hacksaw Frame Heavy Duty',
  'prod-173': 'Chisel Set 4 Piece Cold',
  'prod-174': 'Ball Peen Hammer 16oz',
  'prod-175': 'Dead Blow Hammer 3lb',
  'prod-176': 'Utility Knife Retractable',
  'prod-177': 'Pipe Wrench 24 inch',
  'prod-178': 'Spud Wrench 18 inch',
  'prod-179': 'Wire Stripper Multi Gauge',
  'prod-180': 'Crimping Tool Ratcheting',
  'prod-181': 'Rubber Mallet 2lb',
  'prod-182': 'Caulking Gun Heavy Duty',
  'prod-183': 'Level Magnetic 48 inch',
  'prod-184': 'Speed Square 7 inch',
  'prod-185': 'Combination Square 12 inch',
  'prod-186': 'Feeler Gauge Set 32 Blade',
  'prod-187': 'Thread Gauge Metric UNC UNF',
  'prod-188': 'Vernier Caliper Digital 6 inch',
  'prod-189': 'Micrometer Outside 0-1 inch',
  'prod-190': 'Dial Indicator 0.001 inch',
  'prod-191': 'Bolt Cutters 36 inch',
  'prod-192': 'Cable Cutter Ratcheting 750MCM',
  'prod-193': 'Hole Saw Kit 19 Piece',
  'prod-194': 'Step Drill Bit 1/8-1/2 inch',
  'prod-195': 'Masonry Drill Set 5 Piece',
  'prod-196': 'Wood Chisel Set 4 Piece',
  'prod-197': 'Block Plane 6 inch Adjustable',
  'prod-198': 'Circular Saw Blade 7-1/4 inch',
  'prod-199': 'Jigsaw Blades 10 Pack T-Shank',
  'prod-200': 'Reciprocating Blades 12 Pack',
  'prod-201': 'Band Saw Blade 64-1/2 inch × 1/2',
  'prod-202': 'Ratchet Strap Set 4 Pack 15ft',
  'prod-203': 'Bungee Cord Set 10 Pack Assorted',
  'prod-204': 'Webbing Sling 2 inch × 10ft',
  'prod-205': 'Load Binder Ratcheting',
  'prod-206': 'Chain Binder Lever Type 5/16',
  'prod-207': 'Tow Strap Recovery 30ft 20k lb',
  'prod-208': 'Winch Cable 3/8 inch × 100ft',
  'prod-209': 'Snatch Block Pulley 10 Ton',
  'prod-210': 'Steel Gate Hook 1 Ton Safety',
  'prod-211': 'Shackle Screw Pin 3/4 inch',
  'prod-212': 'Turnbuckle Jaw and Jaw 3/4 inch',
  'prod-213': 'Eye Bolt Shoulder 1/2-13 × 4 inch',
  'prod-214': 'Wire Rope Clip 1/2 inch Galvanized',
  'prod-215': 'Thimble Wire Rope 1/2 inch',
  'prod-216': 'Hoist Ring Swivel 1/2-13 5000lb',
  'prod-217': 'Magnetic Base Indicator Holder',
  'prod-218': 'Test Indicator 0.0005 inch',
  'prod-219': 'Bore Gauge 2-6 inch',
  'prod-220': 'Thread Pitch Gauge 60 Degree',
  'prod-221': 'Radius Gauge Set Fillet',
  'prod-222': 'Screw Pitch Gauge Metric UNC',
  'prod-223': 'Wire Gauge Sheet Metal',
  'prod-224': 'Drill Gauge 1/16-1/2 inch',
  'prod-225': 'Center Punch Automatic',
  'prod-226': 'Pin Punch Set 4 Piece',
  'prod-227': 'Brass Punch Set 3 Piece',
  'prod-228': 'Chisel Punch Set 8 Piece',
  'prod-229': 'Scraper Set 3 Piece Carbide',
  'prod-230': 'File Set 10 Piece Needle',
  'prod-231': 'Rasp Set 3 Piece Wood',
  'prod-232': 'Deburring Tool Set 3 Piece',
  'prod-233': 'Knife Set Utility 3 Piece',
  'prod-234': 'Scissors Industrial Shears 12 inch',
  'prod-235': 'Snips Aviation Left Cut 12 inch',
  'prod-236': 'Bolt Cutters 14 inch',
  'prod-237': 'Cable Cutters 8 inch',
  'prod-238': 'End Cutters 6 inch',
  'prod-239': 'Diagonal Cutters 6 inch',
  'prod-240': 'Long Nose Pliers 6 inch',
  'prod-241': 'Slip Joint Pliers 10 inch',
  'prod-242': 'Water Pump Pliers 12 inch',
  'prod-243': 'Locking Pliers 10 inch Curved',
  'prod-244': 'Clamp Set Quick Grip 4 Piece',
  'prod-245': 'C-Clamp 6 inch Heavy Duty',
  'prod-246': 'Woodworking Vice Quick Release',
  'prod-247': 'Magnetic Welding Square 3 Way',
  'prod-248': 'Welding Clamp Ground 400 Amp',
  'prod-249': 'Welding Electrode Holder 400 Amp',
  'prod-250': 'Welding Tip Cleaner Set 10 Piece',
  'prod-251': 'Welding Goggles Shade 10',
  'prod-252': 'Welding Jacket Flame Resistant',
  'prod-253': 'Welding Gloves MIG 14 inch',
  'prod-254': 'Welding Curtain 6x8 Transparent',
  'prod-255': 'Plasma Cutter Consumable Set',
}

function getProductBaseName(name) {
  return name.replace(/\s*\(.*?\)/, '') // Strip parenthetical notes
}

/**
 * Generate locale-prefixed routes for all locales.
 * Each route object includes `locale` so the prerender script can
 * customize the HTML (lang, dir, hreflang) per locale.
 */
export function getAllRoutes() {
  const routes = []

  for (const locale of LOCALES) {
    // Static routes
    for (const tmpl of STATIC_ROUTES_TEMPLATES) {
      const localePath = `/${locale}${tmpl.path === '/' ? '' : tmpl.path}`
      const title = tmpl.titles?.[locale] || tmpl.titles?.en
      const desc = tmpl.descriptions?.[locale]
      routes.push({
        path: localePath,
        title: `${title} | Alka Traders`,
        description: desc || `${title} — Alka Traders Marine & Industrial Equipment`,
        priority: tmpl.priority,
        changefreq: tmpl.changefreq,
        locale,
      })
    }

    // Product routes
    for (const [id, name] of Object.entries(PRODUCT_NAMES)) {
      const baseName = getProductBaseName(name)
      const localePath = `/${locale}/product/${id}`
      const localizedTitle = locale === 'ar'
        ? `${baseName} — Alka Traders قطع غيار بحرية`
        : locale === 'es'
          ? `${baseName} — Alka Traders Repuestos Marinos`
          : `${baseName} — Alka Traders Marine & Industrial Equipment`
      routes.push({
        path: localePath,
        title: localizedTitle,
        description: `${baseName} — Marine & industrial equipment supplied by Alka Traders from Bhavnagar, Gujarat, India. SKU: ${id.replace('prod-', '')}. Condition varies — inquire for current stock status and pricing.`,
        priority: 0.7,
        changefreq: 'weekly',
        locale,
      })
    }
  }

  return routes
}
