#!/usr/bin/env node

/**
 * Build-time Prerender Script
 *
 * Generates static HTML shell files for every route in the SPA across
 * three locales (en, ar, es). Each file includes:
 *   - Correct <html lang="..."> and dir="..." attributes per locale
 *   - Complete <head> with locale-specific title, meta description,
 *     Open Graph, Twitter Card
 *   - hreflang alternate links for all locales + x-default
 *   - <link rel="canonical"> pointing to the locale-specific URL
 *   - JSON-LD structured data
 *   - Standard SPA shell so React hydrates on load for human visitors
 *
 * Usage: node scripts/prerender.mjs
 * Runs automatically after `npm run build` via postbuild chain.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { getAllRoutes } from './prerender-routes.mjs'

const DIST = 'dist'
const BASE_URL = 'https://alkatraders.co'
const SITE_NAME = 'Alka Traders'
const DEFAULT_DESC = 'Global supplier of marine spares, industrial equipment, surplus machinery, and emergency procurement parts. Based in Bhavnagar, Gujarat, India.'
const LOGO_URL = 'https://res.cloudinary.com/y7up4zti/image/upload/v1/alka/static/alka-traders-logo'

// ─── Helpers ────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Locale → og:locale value */
const LOCALE_OG_MAP = { en: 'en_US', ar: 'ar_SA', es: 'es_ES' }
/** Locale → dir attribute */
const LOCALE_DIR_MAP = { en: 'ltr', ar: 'rtl', es: 'ltr' }

// ─── Hreflang Tags ──────────────────────────────────────────────

/**
 * Generate hreflang <link> tags for all three locales plus x-default.
 * @param {string} path - The FULL locale-prefixed path, e.g. "/en/products"
 */
function hreflangTags(path) {
  // Extract the path without locale prefix
  const segments = path.split('/').filter(Boolean)
  const locale = segments[0] // 'en', 'ar', or 'es'
  const rest = segments.slice(1).join('/') // 'products', 'product/prod-001', etc.

  const tags = []
  const locales = ['en', 'ar', 'es']

  for (const lang of locales) {
    let href
    if (lang === 'en' && !rest) {
      href = BASE_URL
    } else if (lang === 'en' && rest) {
      href = `${BASE_URL}/en/${rest}`
    } else if (!rest) {
      href = `${BASE_URL}/${lang}`
    } else {
      href = `${BASE_URL}/${lang}/${rest}`
    }
    tags.push(`<link rel="alternate" hreflang="${lang}" href="${href}" />`)
  }

  // x-default → English
  const defaultHref = !rest ? BASE_URL : `${BASE_URL}/en/${rest}`
  tags.push(`<link rel="alternate" hreflang="x-default" href="${defaultHref}" />`)

  return tags.join('\n  ')
}

// ─── JSON-LD Generators ─────────────────────────────────────────

function orgJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: LOGO_URL,
    description: DEFAULT_DESC,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'PLOT - 7 ALANG HOUSE, MOTITALAV ROAD, KHUMBHARWADA',
      addressLocality: 'Bhavnagar',
      addressRegion: 'Gujarat',
      postalCode: '364001',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+919726900547',
      contactType: 'sales',
      availableLanguage: ['English', 'Arabic', 'Spanish'],
    },
    sameAs: ['https://www.linkedin.com/company/alka-traders'],
  }
}

function breadcrumbJsonLd(segments) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: segments.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      item: `${BASE_URL}${s.path}`,
    })),
  }
}

function productJsonLd(id, name) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    sku: id.replace('prod-', ''),
    description: `${name} — Marine & industrial equipment supplied by Alka Traders from Bhavnagar, Gujarat, India. Condition varies. Contact for current stock status and pricing.`,
    brand: { '@type': 'Brand', name: 'Alka Traders' },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      url: `${BASE_URL}/product/${id}`,
    },
    image: `${LOGO_URL}`,
  }
}

// ─── SEO Head Generator ─────────────────────────────────────────

function seoHeadTags({ path, title, description, locale = 'en', extraJsonLd, breadcrumbs }) {
  const fullTitle = title || `${SITE_NAME} — ${DEFAULT_DESC}`
  const fullDesc = description || DEFAULT_DESC
  const url = path === `/${locale}` ? `${BASE_URL}/${locale}` : `${BASE_URL}${path}`

  const jsonLdBlocks = [orgJsonLd()]
  if (breadcrumbs) jsonLdBlocks.push(breadcrumbJsonLd(breadcrumbs))
  if (extraJsonLd) {
    Array.isArray(extraJsonLd) ? jsonLdBlocks.push(...extraJsonLd) : jsonLdBlocks.push(extraJsonLd)
  }

  // WebSite schema + SearchAction
  jsonLdBlocks.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  })

  const ogLocale = LOCALE_OG_MAP[locale] || 'en_US'

  const tags = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(fullDesc)}" />`,
    `<link rel="canonical" href="${url}" />`,
    hreflangTags(path),

    `<!-- Open Graph -->`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(fullDesc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:image" content="${LOGO_URL}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="${ogLocale}" />`,

    `<!-- Twitter Card -->`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(fullDesc)}" />`,
    `<meta name="twitter:image" content="${LOGO_URL}" />`,
  ]

  const jsonLdScripts = jsonLdBlocks.map(block =>
    `<script type="application/ld+json">${JSON.stringify(block)}</script>`
  )

  return tags.join('\n  ') + '\n  ' + jsonLdScripts.join('\n  ')
}

// ─── Template Injection ─────────────────────────────────────────

function injectIntoTemplate(template, path, routeData) {
  const locale = routeData.locale || 'en'
  const headTags = seoHeadTags({ ...routeData, path, locale })

  let html = template

  // Set <html lang="..." dir="...">
  html = html.replace(/<html[^>]*>/i, () => {
    return `<html lang="${locale}" dir="${LOCALE_DIR_MAP[locale] || 'ltr'}">`
  })

  // Remove existing <title>
  html = html.replace(/<title>[^<]*<\/title>/, '')
  // Remove existing meta description
  html = html.replace(/<meta name="description"[^>]*\/?>/, '')

  // Inject SEO tags after <head>
  html = html.replace('<head>', '<head>\n  ' + headTags)

  return html
}

// ─── File Writer ────────────────────────────────────────────────

function writeHtml(path, html) {
  const filePath = path === '/' || path === '/en'
    ? join(DIST, 'index.html')
    : join(DIST, path, 'index.html')
  const dir = dirname(filePath)

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(filePath, html, 'utf-8')
  const relative = path + '/'
  console.log(`  ✅ ${relative}`)
}

// ─── Main ───────────────────────────────────────────────────────

function main() {
  console.log('\n🔍 Generating prerendered HTML shells (3 locales)...\n')

  const indexPath = join(DIST, 'index.html')
  if (!existsSync(indexPath)) {
    console.error(`❌ dist/index.html not found. Run "npm run build" first.`)
    process.exit(1)
  }

  const template = readFileSync(indexPath, 'utf-8')
  const routes = getAllRoutes()
  let count = 0

  for (const route of routes) {
    const locale = route.locale || 'en'
    let extraJsonLd
    let breadcrumbs

    // Home pages get FAQPage schema (one per locale)
    if (route.path === `/${locale}`) {
      breadcrumbs = [{ name: 'Home', path: `/${locale}` }]
      extraJsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What marine spare parts does Alka Traders supply?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Alka Traders supplies ship automation parts, marine engine spares, hydraulic pumps and motors, navigation equipment, electrical drives, marine pumps, rigging, lifting gear, and surplus industrial machinery.',
              },
            },
            {
              '@type': 'Question',
              name: 'Where are Alka Traders marine parts shipped from?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Most export orders are coordinated from Bhavnagar, Gujarat, India, near the Alang marine equipment and ship recycling market.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I request a quote with only a part number or nameplate photo?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Buyers can send a part number, maker name, model, serial plate photo, or product description through the RFQ form, email, or WhatsApp.',
              },
            },
          ],
        },
      ]
    }

    // Product pages get Product schema
    if (route.path.includes('/product/')) {
      const productId = route.path.split('/product/')[1]
      const productName = route.title.split(' — ')[0]
      extraJsonLd = productJsonLd(productId, productName)
      breadcrumbs = [
        { name: 'Home', path: `/${locale}` },
        { name: 'Products', path: `/${locale}/products` },
        { name: productName, path: route.path },
      ]
    }

    // Other pages get generic breadcrumbs
    if (!route.path.includes('/product/') && route.path !== `/${locale}`) {
      const segments = route.path.replace(`/${locale}/`, '').split('/').filter(Boolean)
      breadcrumbs = [
        { name: 'Home', path: `/${locale}` },
        ...segments.map((seg, i) => ({
          name: seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          path: `/${locale}/` + segments.slice(0, i + 1).join('/'),
        })),
      ]
    }

    const html = injectIntoTemplate(template, route.path, {
      title: route.title,
      description: route.description,
      locale,
      extraJsonLd,
      breadcrumbs,
    })
    writeHtml(route.path, html)
    count++
  }

  console.log(`\n✨ Prerendered ${count} pages to ${DIST}/\n`)
}

main()
