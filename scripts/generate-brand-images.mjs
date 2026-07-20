/**
 * generate-brand-images.mjs
 *
 * Build-time script that scans the `public/brand/` directory and
 * generates `src/data/brandImages.ts` with a sorted list of filenames.
 *
 * Usage:
 *   node scripts/generate-brand-images.mjs
 *
 * This script replaces the manually maintained ~470-line file with
 * an auto-generated one, ensuring brandImages.ts always reflects
 * the actual files on disk.
 */

import { readdirSync, writeFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const BRAND_DIR = resolve(import.meta.dirname, '..', 'public', 'brand')
const OUTPUT_FILE = resolve(import.meta.dirname, '..', 'src', 'data', 'brandImages.ts')

if (!existsSync(BRAND_DIR)) {
  console.warn(`⚠️  Brand directory not found: ${BRAND_DIR}`)
  console.warn('   Creating an empty brandImages.ts placeholder.')
  const placeholder = `/**
 * Auto-generated list of brand images from public/brand/
 * Run \`node scripts/generate-brand-images.mjs\` to regenerate.
 */
export const brandImages: string[] = []
`
  writeFileSync(OUTPUT_FILE, placeholder, 'utf-8')
  console.log(`✅ Generated empty ${OUTPUT_FILE}`)
  process.exit(0)
}

const files = readdirSync(BRAND_DIR)
  .filter((f) => /\.(png|jpg|jpeg|webp|avif|svg)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

const content = `/**
 * Auto-generated list of brand images from public/brand/
 * Generated on ${new Date().toISOString().split('T')[0]}
 * Run \`node scripts/generate-brand-images.mjs\` to regenerate.
 * Total: ${files.length} files
 */
export const brandImages: string[] = [
${files.map((f) => `  "${f}",`).join('\n')}
]
`

writeFileSync(OUTPUT_FILE, content, 'utf-8')
console.log(`✅ Generated ${OUTPUT_FILE} with ${files.length} brand images`)
