#!/usr/bin/env node

/**
 * Sitemap Validator
 * Checks public/sitemap.xml for structural correctness against the sitemap spec.
 */

import { readFileSync } from 'fs'

const xml = readFileSync('public/sitemap.xml', 'utf8')
const errors = []
const warnings = []

// 1. Structure checks
if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  errors.push('Missing or incorrect XML declaration')
}
if (!xml.includes('<urlset')) {
  errors.push('Missing <urlset> wrapper')
}
if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  errors.push('Missing sitemaps.org namespace')
}
if (!xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) {
  errors.push('Missing xhtml namespace for hreflang')
}
if (!xml.trim().endsWith('</urlset>')) {
  errors.push('Missing closing </urlset>')
}

// 1b. Basic well-formedness check (tag balance)
const openUrlTags = (xml.match(/<url>/g) || []).length
const closeUrlTags = (xml.match(/<\/url>/g) || []).length
const openUrlsetTags = (xml.match(/<urlset/g) || []).length
const closeUrlsetTags = (xml.match(/<\/urlset>/g) || []).length
if (openUrlTags !== closeUrlTags) {
  errors.push(`Tag mismatch: ${openUrlTags} <url> openings vs ${closeUrlTags} closings`)
}
if (openUrlsetTags !== closeUrlsetTags) {
  errors.push(`Tag mismatch: ${openUrlsetTags} <urlset> openings vs ${closeUrlsetTags} closings`)
}

// 2. Counts
const urlEntries = xml.match(/<url>[\s\S]*?<\/url>/g) || []
const locs = xml.match(/<loc>/g) || []
const xhtmlLinks = xml.match(/xhtml:link/g) || []
const allHreflang = xml.match(/hreflang="/g) || []
const enLinks = xml.match(/hreflang="en"/g) || []
const arLinks = xml.match(/hreflang="ar"/g) || []
const esLinks = xml.match(/hreflang="es"/g) || []
const xDefaultLinks = xml.match(/hreflang="x-default"/g) || []

// 3. Per-entry checks
let entriesWithExpectedHreflang = 0
let entriesWithExpectedNamespace = 0

// Extract all <loc> URLs for duplicate check
const allLocUrls = []

for (const entry of urlEntries) {
  const hreflangCount = (entry.match(/xhtml:link/g) || []).length
  if (hreflangCount === 4) entriesWithExpectedHreflang++
  if (entry.includes('xhtml:link')) entriesWithExpectedNamespace++

  // Collect loc URL
  const locMatch = entry.match(/<loc>([^<]+)<\/loc>/)
  if (locMatch) allLocUrls.push(locMatch[1])
}

// 3b. Duplicate & absolute URL checks
const seenUrls = new Set()
const duplicateUrls = []
const nonAbsoluteUrls = []
for (const url of allLocUrls) {
  if (seenUrls.has(url)) duplicateUrls.push(url)
  seenUrls.add(url)
  if (!url.startsWith('https://alkatraders.co')) nonAbsoluteUrls.push(url)
}
if (duplicateUrls.length > 0) {
  errors.push(`${duplicateUrls.length} duplicate URLs found`)
  for (const dup of duplicateUrls.slice(0, 3)) warnings.push(`Duplicate: ${dup}`)
}
if (nonAbsoluteUrls.length > 0) {
  errors.push(`${nonAbsoluteUrls.length} non-absolute URLs found`)
}

// 3c. File size check
const fileSizeKB = (Buffer.byteLength(xml, 'utf8') / 1024).toFixed(1)
if (fileSizeKB > 50000) {
  errors.push(`Sitemap too large: ${fileSizeKB} KB (> 50MB limit)`)
}

// 4. URL encoding check
const suspiciousLocs = locs.filter(loc => {
  const url = loc.replace(/<\/?loc>/g, '')
  return url.includes(' ') || (url.includes('&') && !url.includes('&amp;'))
})

// 5. Summary
console.log('')
console.log('═══════════════════════════════════════')
console.log('   Sitemap Validation Report')
console.log('═══════════════════════════════════════')
console.log('')
console.log('├── Structure')
if (errors.length === 0) {
  console.log('│   ✅ XML declaration:             Present')
  console.log('│   ✅ urlset wrapper:              Present')
  console.log('│   ✅ xhtml namespace:             Present')
  console.log('│   ✅ Closing tag:                 Present')
} else {
  for (const e of errors) console.log(`│   ❌ ${e}`)
}
console.log('')
console.log('├── Counts')
console.log(`│   📄 <url> entries:            ${urlEntries.length}`)
console.log(`│   🔗 <loc> URLs:               ${locs.length}`)
console.log(`│   🌐 xhtml:link tags:          ${xhtmlLinks.length}`)
console.log(`│   🏷️  hreflang attributes:     ${allHreflang.length}`)
console.log('')
console.log('├── Hreflang Distribution')
console.log(`│   🇬🇧  hreflang="en":           ${enLinks.length}`)
console.log(`│   🇸🇦  hreflang="ar":           ${arLinks.length}`)
console.log(`│   🇪🇸  hreflang="es":           ${esLinks.length}`)
console.log(`│   🌍  hreflang="x-default":     ${xDefaultLinks.length}`)
console.log(`│   Expected per entry:              4`)
console.log(`│   Entries with exactly 4 links:     ${entriesWithExpectedHreflang} / ${urlEntries.length}`)
console.log(`│   Entries with xhtml links:         ${entriesWithExpectedNamespace} / ${urlEntries.length}`)
console.log('')
console.log('├── Quality Checks')
if (suspiciousLocs.length === 0) {
  console.log('│   ✅ No URL encoding issues found')
} else {
  warnings.push(`${suspiciousLocs.length} URLs with possible encoding issues`)
  console.log(`│   ⚠️  ${suspiciousLocs.length} URLs with possible encoding issues`)
}
console.log('')

// 6. Verify top 5 URLs are correctly formed
console.log('├── First 5 URL Entries (trimmed)')
const firstFive = urlEntries.slice(0, 5)
for (const entry of firstFive) {
  const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1] || 'MISSING'
  const hreflangs = [...entry.matchAll(/hreflang="([^"]+)"/g)].map(m => m[1])
  console.log(`│   📍 ${loc}`)
  console.log(`│      → hreflangs: [${hreflangs.join(', ')}]`)
}

// 7. Check Arabic/Spanish home URLs
console.log('')
console.log('├── Locale Home Pages')
for (const locale of ['ar', 'es']) {
  const homeEntry = urlEntries.find(e => e.includes(`<loc>https://alkatraders.co/${locale}</loc>`))
  if (homeEntry) {
    const hreflangs = [...homeEntry.matchAll(/hreflang="([^"]+)"/g)].map(m => m[1])
    console.log(`│   ✅ /${locale}/ → ${locale}/: hreflangs [${hreflangs.join(', ')}]`)
  }
}

// 8. Instructions for Google Search Console
console.log('')
console.log('├── Next Steps')
console.log('│   To submit to Google Search Console:')
console.log('│   1. Go to https://search.google.com/search-console')
console.log('│   2. Select your property (https://alkatraders.co)')
console.log('│   3. Navigate to Sitemaps section')
console.log('│   4. Enter: sitemap.xml')
console.log('│   5. Click Submit')
console.log('│   ')
console.log('│   The sitemap is hosted at:')
console.log('│   https://alkatraders.co/sitemap.xml')
console.log('│   ')
console.log('│   ⚡ Deploy first: push this commit so the new')
console.log('│   sitemap.xml is live before submitting.')

// 9. Summary verdict
console.log('')
console.log('═══════════════════════════════════════')
if (errors.length === 0 && warnings.length === 0) {
  console.log('   ✅ PASS — Sitemap is valid')
} else if (errors.length === 0 && warnings.length > 0) {
  console.log('   ⚠️  PASS with warnings')
  for (const w of warnings) console.log(`        ${w}`)
} else {
  console.log('   ❌ FAIL')
  for (const e of errors) console.log(`        ${e}`)
}
console.log('═══════════════════════════════════════')
console.log('')
