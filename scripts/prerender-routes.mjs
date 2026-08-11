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
      en: 'Product catalog of marine, electrical, hydraulic, pneumatic, and industrial equipment. Filter by brand, category, condition, and price.',
      ar: 'كتالوج المنتجات للمعدات البحرية والكهربائية والهيدروليكية والهوائية والصناعية.',
      es: 'Catálogo de productos de equipos marinos, eléctricos, hidráulicos, neumáticos e industriales.',
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
// All products were removed from the store. No product routes are generated.
const PRODUCT_NAMES = {}

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
