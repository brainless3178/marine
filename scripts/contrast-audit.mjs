#!/usr/bin/env node
/**
 * Static WCAG AA contrast audit (light + dark mode).
 *
 * Scans every .tsx/.ts source file under src/ for Tailwind color classes
 * (text-*, bg-*), resolves them through tailwind.config.ts → CSS variables →
 * :root / html.dark values, and computes WCAG contrast ratios for each
 * same-element text-on-background pairing in BOTH themes.
 *
 * Usage: node scripts/contrast-audit.mjs [--json]
 *
 * Thresholds (WCAG 2.1 AA):
 *   - < 4.5 : FAIL normal text
 *   - < 3.0 : FAIL large text (18.66px bold / 24px+) & UI components
 * We report everything < 4.5 and let the dynamic axe audit refine sizes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'src')

// ─── 1. Parse CSS variables (light :root / html.light + html.dark) ────────
const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8')
const lightCss = css.split('html.dark')[0] // :root + html.light
const darkBlock = css.match(/html\.dark\s*\{([\s\S]*?)\}/)?.[1] ?? ''

function parseVars(block) {
  const vars = {}
  for (const m of block.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    vars[m[1]] = m[2].trim()
  }
  return vars
}
const LIGHT = parseVars(lightCss)
const DARK = parseVars(darkBlock)

// Resolve var() references (with fallback) against a theme map.
function resolveVar(name, theme) {
  let value = theme[name]
  if (value === undefined) return null
  // Strip leading `var(--x)` references (e.g. admin-table-head-text: var(--text-muted))
  while (value.startsWith('var(')) {
    const inner = value.match(/^var\((--[\w-]+)(?:,\s*([^)]+))?\)/)?.[1]
    const fallback = value.match(/^var\(--[\w-]+\s*,\s*([^)]+)\)/)?.[1]
    if (inner && theme[inner] !== undefined) value = theme[inner]
    else if (fallback) value = fallback.trim()
    else return null
  }
  return value
}
function colorFor(name, theme) {
  if (name.startsWith('--')) return resolveVar(name.slice(2), theme)
  return resolveVar(name, theme)
}

// ─── 2. Tailwind color-name → var map (from tailwind.config.ts) ────────────
const twConfig = fs.readFileSync(path.join(ROOT, 'tailwind.config.ts'), 'utf8')
const twToVar = {}
const twBlock = twConfig.match(/colors:\s*\{([\s\S]*?)\}\s*,\s*fontFamily/s)?.[1] ?? twConfig.match(/colors:\s*\{([\s\S]*?)\n\s*\}/s)?.[1] ?? ''
for (const m of twBlock.matchAll(/'([\w-]+)':\s*'var\((--[\w-]+)\)'/g)) {
  twToVar[m[1]] = m[2]
}

// ─── 3. Color parsing & contrast ───────────────────────────────────────────
function parseHex(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  if (hex.length !== 6) return null
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))
}
function parseColor(str) {
  str = str.trim().toLowerCase()
  if (!str || str === 'transparent' || str === 'none') return null
  if (str.startsWith('#')) return { rgb: parseHex(str), alpha: 1 }
  const m = str.match(/rgba?\(([^)]*)\)/)
  if (m) {
    const parts = m[1].split(/[,\s/]+/).filter(Boolean)
    if (parts.length < 3) return null
    const alpha = parts.length >= 4 ? (parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])) : 1
    return { rgb: [0, 1, 2].map(i => parseInt(parts[i], 10)), alpha }
  }
  return null
}
// Composite a color over an opaque background.
function composite(fg, bg) {
  if (fg.alpha >= 1) return fg.rgb
  if (!bg) return fg.rgb // unknown bg → raw
  return fg.rgb.map((c, i) => Math.round(c * fg.alpha + bg[i] * (1 - fg.alpha)))
}
// Resolve a bg color to an opaque RGB, compositing translucency over the
// nearest solid surface (surface first, then primary-bg) in that theme.
function bgRGB(col, theme) {
  if (!col) return null
  if (col.alpha >= 1) return col.rgb
  const surf = parseColor(colorFor('surface', theme))
  const base = surf?.rgb ?? parseColor(colorFor('primary-bg', theme))?.rgb ?? [255, 255, 255]
  return col.rgb.map((c, i) => Math.round(c * col.alpha + base[i] * (1 - col.alpha)))
}
function luminance(rgb) {
  const lin = rgb.map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}
function contrast(fg, bg) {
  const l1 = luminance(fg), l2 = luminance(bg)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

// ─── 4. Extract className strings from source files ────────────────────────
const files = []
;(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.tsx?$/.test(e.name)) files.push(p)
  }
})(SRC)

// Class-token classification
const TXT_RE = /(?:^|\s)(text-\[[^\]]+\]|text-(?:primary|secondary|muted|white|black|navy-deep|navy-mid|navy-light|gold-light|danger|success|accent-primary|accent-blue|accent-gold|accent-teal|brick-ember|honeydew)(?:\/[0-9]+)?)(?=\s|$)/g
const BG_RE = /(?:^|\s)(bg-\[[^\]]+\]|bg-(?:primary-bg|secondary-bg|surface|surface-soft|surface-raised|accent-primary|accent-blue|accent-gold|accent-teal|text-primary|text-secondary|text-muted|danger|success|navy-deep|navy-mid|navy-light|gold-light|gold-dark|gold-muted|teal-soft|input-bg|honeydew)(?:\/[0-9]+)?)(?=\s|$)/g

function parseToken(token) {
  // token like text-[var(--x)] / bg-[#hex] / text-primary / text-primary/60
  const raw = token.replace(/^(text|bg)-/, '')
  let name = raw, opacity = 1
  const slash = raw.match(/^(.*)\/([0-9]+)$/)
  if (slash) { name = slash[1]; opacity = parseInt(slash[2], 10) / 100 }
  if (name.startsWith('[')) {
    let inner = name.slice(1, -1)
    if (inner.startsWith('var(')) inner = inner.match(/^var\((--[\w-]+)\)/)?.[1] ?? inner
    return { name: inner, opacity }
  }
  const mapped = twToVar[name] ? twToVar[name].slice(2) : null
  return { name: mapped ?? name, opacity }
}

const results = []
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  for (const m of src.matchAll(/(?:className|class)=["'`]([^"'`]*)["'`]/g)) {
    const cls = m[1]
    const texts = [...cls.matchAll(TXT_RE)].map(x => x[1])
    const bgs = [...cls.matchAll(BG_RE)].map(x => x[1])
    if (!texts.length || !bgs.length) continue
    const line = src.slice(0, m.index).split('\n').length
    const snippet = cls.slice(0, 120)
    for (const t of texts) {
      const tp = parseToken(t)
      for (const b of bgs) {
        const bp = parseToken(b)
        const pairKey = `${tp.name}|${bp.name}`
        for (const [themeName, theme] of [['light', LIGHT], ['dark', DARK]]) {
          const tc = colorFor(tp.name, theme)
          const bc = colorFor(bp.name, theme)
          if (!tc || !bc) continue
          const tCol = parseColor(tc), bCol = parseColor(bc)
          if (!tCol || !bCol) continue
          let fg = tCol
          if (tp.opacity < 1 || tCol.alpha < 1) fg = { ...tCol, alpha: tCol.alpha * tp.opacity }
          // Apply the bg token's opacity (e.g. bg-danger/5) before compositing.
          const bColOpaque = { ...bCol, alpha: bCol.alpha * bp.opacity }
          const bgRGBv = bgRGB(bColOpaque, theme)
          if (!bgRGBv) continue
          // If the text is translucent, composite it over the (opaque) bg.
          const fgRGB = composite(fg, bgRGBv)
          const ratio = contrast(fgRGB, bgRGBv)
          if (ratio < 4.5) {
            results.push({
              file: rel, line, theme: themeName, ratio: +ratio.toFixed(2),
              cls: `${t} + ${b}`, snippet,
              fg: `rgb(${fgRGB.join(',')})`, bg: `rgb(${bgRGBv.join(',')})`,
            })
          }
        }
      }
    }
  }
}

// Dedupe by file+line+theme+class
const seen = new Set()
const uniq = results.filter(r => {
  const k = `${r.file}:${r.line}|${r.theme}|${r.cls}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})

uniq.sort((a, b) => a.ratio - b.ratio)
const json = process.argv.includes('--json')
if (json) {
  console.log(JSON.stringify({ total: uniq.length, failures: uniq }, null, 2))
} else {
  console.log(`\n=== STATIC CONTRAST AUDIT ===`)
  console.log(`Source files scanned: ${files.length}`)
  console.log(`Tokens: ${Object.keys(LIGHT).length} light vars, ${Object.keys(DARK).length} dark vars, ${Object.keys(twToVar).length} tailwind mappings`)
  console.log(`Low-contrast pairings (<4.5:1): ${uniq.length}\n`)
  for (const r of uniq) {
    console.log(`  [${r.theme}] ${r.ratio}:1  ${r.file}:${r.line}`)
    console.log(`      ${r.cls}  →  "${r.snippet}"`)
    console.log(`      fg=${r.fg} on bg=${r.bg}`)
  }
}
