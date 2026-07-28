#!/usr/bin/env node

/**
 * Sitemap Generator
 *
 * Reads the full route list (including locale-prefixed paths) from
 * prerender-routes.mjs and generates a sitemap.xml with:
 *   - Every locale variant as its own <url> entry
 *   - xhtml:link rel="alternate" hreflang for all 3 locales + x-default
 *   - changefreq and priority from the route data
 *
 * Usage:  node scripts/generate-sitemap.mjs
 * Output: public/sitemap.xml (overwrites)
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { getAllRoutes } from './prerender-routes.mjs'

const BASE_URL = 'https://alkatraders.co'
const LOCALES = ['en', 'ar', 'es']
const VALID_LOCALES = LOCALES

/**
 * Build the xhtml:link hreflang tags for a given page path.
 * @param {string} path - e.g. '/en/products'
 * @returns {string[]} array of <xhtml:link ... /> strings
 */
function buildHreflangLinks(localePath) {
  // Extract locale and rest path
  const segments = localePath.split('/').filter(Boolean)
  const rest = segments.length > 1 ? segments.slice(1).join('/') : ''

  const links = []

  for (const lang of VALID_LOCALES) {
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
    links.push(`      <xhtml:link rel="alternate" hreflang="${lang}" href="${href}" />`)
  }

  // x-default → English
  const defaultHref = !rest ? BASE_URL : `${BASE_URL}/en/${rest}`
  links.push(`      <xhtml:link rel="alternate" hreflang="x-default" href="${defaultHref}" />`)

  return links
}

function buildUrlEntry(route) {
  const loc = route.path === '/en' ? BASE_URL : `${BASE_URL}${route.path}`
  const hreflangLines = buildHreflangLinks(route.path)
  const changefreq = route.changefreq || 'monthly'
  const priority = route.priority || 0.5

  return [
    '    <url>',
    `      <loc>${loc}</loc>`,
    ...hreflangLines,
    `      <changefreq>${changefreq}</changefreq>`,
    `      <priority>${priority.toFixed(1)}</priority>`,
    '    </url>',
  ].join('\n')
}

function main() {
  console.log('\n🔍 Generating sitemap.xml...\n')

  const routes = getAllRoutes()
  const urlEntries = routes.map(buildUrlEntry)

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    '',
    ...urlEntries,
    '',
    '</urlset>',
    '',
  ].join('\n')

  const outPath = join('dist', 'sitemap.xml')
  writeFileSync(outPath, sitemap, 'utf-8')

  console.log(`  ✅ ${routes.length} URLs written to ${outPath}`)
  console.log(`     (${LOCALES.length} locales × ${routes.length / LOCALES.length} unique pages)`)
  console.log(`     Sitemap size: ${(Buffer.byteLength(sitemap) / 1024).toFixed(1)} KB\n`)
}

main()
