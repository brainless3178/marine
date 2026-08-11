#!/usr/bin/env node
/**
 * Dynamic WCAG AA contrast audit — axe-core across all routes, both themes.
 *
 * Requires: dev server on :5173, axe-core installed (npm i --no-save axe-core)
 * Usage: node scripts/axe-contrast-audit.mjs [--json] [--only=<routeSubstring>]
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const BASE = process.env.AUDIT_BASE || 'http://localhost:5173'

// ─── All 42 routes (storefront × locale-neutral + admin) ───────────────────
const STOREFRONT = [
  '', 'shop', 'products', 'industries', 'brands', 'about', 'rfq', 'contact',
  'search', 'emergency', 'network', 'intelligence', 'checkout',
  'forgot-password', 'reset-password', 'track-order',
  'account/orders', 'account/profile',
  'product/a0000000-0000-4000-8000-000000000001',
  'privacy-policy', 'terms-of-service', 'refund-policy',
]
const ADMIN = [
  'admin/login',
]

const ROUTES = [
  ...STOREFRONT.map(r => `/en/${r}`),
  '/en/this-page-does-not-exist-404', // 404
  ...ADMIN.map(r => `/${r}`),
]

let axeSource
try {
  axeSource = fs.readFileSync(path.join(import.meta.dirname, '..', 'node_modules/axe-core/axe.min.js'), 'utf8')
} catch {
  console.error('axe-core not found — run: npm i --no-save axe-core')
  process.exit(1)
}

async function runAxe(page) {
  await page.addScriptTag({ content: axeSource })
  return page.evaluate(async () => {
    const results = await window.axe.run(document, {
      runOnly: { type: 'rule', values: ['color-contrast'] },
    })
    return results.violations
  })
}

function summarize(node) {
  const el = node.target.join(' ')
  const text = (node.failureSummary || '').split('\n').slice(0, 6).join(' | ')
  return { target: el, html: (node.html || '').slice(0, 140), summary: text }
}

const only = process.argv.find(a => a.startsWith('--only='))?.split('=')[1]
const routes = only ? ROUTES.filter(r => r.includes(only)) : ROUTES

const EXEC = process.env.AUDIT_CHROME
  || 'C:\\Users\\HP\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
const browser = await chromium.launch({ executablePath: EXEC, headless: true })
const failures = []
const visited = []

for (const route of routes) {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const url = BASE + route
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() =>
        page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
      )
      // Set theme via the html class (same mechanism as the toggle)
      await page.evaluate((t) => {
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(t)
        root.style.colorScheme = t
      }, theme)
      // Ensure storefront theme matches (site may default light on some pages)
      if (route.includes('/en/')) {
        await page.evaluate((t) => {
          const root = document.documentElement
          root.classList.remove('light', 'dark')
          root.classList.add(t)
        }, theme)
      }
      await page.waitForTimeout(500)
      const violations = await runAxe(page)
      for (const v of violations) {
        for (const n of v.nodes) {
          const s = summarize(n)
          const ratio = (n.any && n.any[0]?.data && n.any[0].data.contrastRatio) || '?'
          failures.push({
            route, theme, rule: v.id, impact: v.impact,
            ratio: typeof ratio === 'number' ? +ratio.toFixed(2) : ratio,
            target: s.target, html: s.html, summary: s.summary,
          })
        }
      }
      visited.push({ route, theme, status: 'ok', violations: violations.length })
    } catch (e) {
      visited.push({ route, theme, status: 'ERR ' + e.message.split('\n')[0].slice(0, 80) })
    }
    await page.close()
  }
}
await browser.close()

// Dedupe identical (route, theme, target, ratio)
const seen = new Set()
const uniq = failures.filter(f => {
  const k = `${f.route}|${f.theme}|${f.target}|${f.ratio}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})

const json = process.argv.includes('--json')
if (json) {
  console.log(JSON.stringify({ visited, failures: uniq }, null, 2))
} else {
  console.log(`\n=== DYNAMIC AXE CONTRAST AUDIT (${BASE}) ===`)
  console.log(`Routes visited: ${visited.length} (${new Set(visited.map(v => v.route)).size} unique × 2 themes)`)
  const errs = visited.filter(v => v.status !== 'ok')
  if (errs.length) { console.log(`⚠️  ${errs.length} pages failed to load:`); errs.forEach(e => console.log(`    ${e.route} [${e.theme}] ${e.status}`)) }
  console.log(`WCAG AA contrast violations: ${uniq.length}\n`)
  // Group by pairing (target) — most actionable
  const byPair = {}
  for (const f of uniq) {
    const key = `${f.target} :: ${f.html}`
    ;(byPair[key] ||= []).push(f)
  }
  for (const [key, arr] of Object.entries(byPair)) {
    const ratios = [...new Set(arr.map(a => a.ratio))].join('/')
    const routes = [...new Set(arr.map(a => a.route))].join(', ')
    const themes = [...new Set(arr.map(a => a.theme))].join('+')
    console.log(`  [${themes}] ${ratios}:1  ${key.slice(0, 110)}`)
    console.log(`      routes: ${routes.slice(0, 150)}`)
  }
}
