#!/usr/bin/env node
/**
 * Generate a simple 400x400 placeholder.png for image error fallbacks.
 */
import sharp from 'sharp'
import { join } from 'node:path'

const OUTPUT = join(process.cwd(), 'public', 'images', 'placeholder.png')

const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="#f1f5f9"/>
  <circle cx="200" cy="160" r="60" fill="#cbd5e1"/>
  <rect x="120" y="240" width="160" height="12" rx="6" fill="#cbd5e1"/>
  <rect x="150" y="265" width="100" height="10" rx="5" fill="#94a3b8"/>
  <text x="200" y="320" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" font-weight="500">No Image Available</text>
</svg>`

await sharp(Buffer.from(svg))
  .resize(400, 400)
  .png()
  .toFile(OUTPUT)

console.log(`✅ Created placeholder.png (400x400)`)
