#!/usr/bin/env node
/**
 * Upload hero.mp4 to Cloudinary (video only — no images).
 *
 * Usage:
 *   CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@y7up4zti node scripts/upload-hero-video.mjs
 */

import { v2 as cloudinary } from 'cloudinary'
import { existsSync } from 'fs'
import { join, parse, resolve } from 'path'
import { fileURLToPath } from 'url'

cloudinary.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = parse(__filename).dir
const ROOT = resolve(__dirname, '..')
const VIDEO_PATH = join(ROOT, 'public', 'hero.mp4')

async function main() {
  console.log('═'.repeat(50))
  console.log('  Hero Video → Cloudinary Upload')
  console.log('═'.repeat(50))

  if (!process.env.CLOUDINARY_URL) {
    console.error('\n❌ CLOUDINARY_URL environment variable is required.')
    console.error('   Usage: CLOUDINARY_URL=cloudinary://KEY:SECRET@y7up4zti node scripts/upload-hero-video.mjs')
    process.exit(1)
  }

  if (!existsSync(VIDEO_PATH)) {
    console.error(`\n❌ Video not found at ${VIDEO_PATH}`)
    process.exit(1)
  }

  console.log(`\n🎬 Uploading hero.mp4 to Cloudinary...`)
  console.log(`   File: ${VIDEO_PATH}`)

  const startTime = Date.now()

  const result = await cloudinary.uploader.upload(VIDEO_PATH, {
    public_id: 'alka/static/hero',
    resource_type: 'video',
    overwrite: true,
    invalidate: true,
    eager_async: false,
    transformation: [
      { width: 1280, crop: 'limit', quality: 'auto' },
    ],
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log(`\n  ✅ Upload complete in ${elapsed}s`)
  console.log(`  URL: ${result.secure_url}`)
  console.log(`  Public ID: ${result.public_id}`)
  console.log(`  Format: ${result.format}`)
  console.log(`  Size: ${(result.bytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`  Duration: ${result.duration?.toFixed(1)}s`)
  console.log('\n' + '═'.repeat(50))
}

main().catch(err => {
  console.error(`\n❌ Upload failed: ${err.message}`)
  process.exit(1)
})
