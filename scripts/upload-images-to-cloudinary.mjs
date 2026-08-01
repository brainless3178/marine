#!/usr/bin/env node
/**
 * Upload ALL static images to Cloudinary for CDN delivery.
 *
 * Usage:
 *   CLOUDINARY_URL=cloudinary://key:secret@cloudname node scripts/upload-images-to-cloudinary.mjs
 *
 * What it does:
 *   - Scans public/images/products/ (100 product images)
 *   - Scans public/images/categories/ (16 category images)
 *   - Scans public/brand/ (~500 brand logos)
 *   - Scans public/images/ (logo, placeholder, payments, hero banners)
 *   - Uploads each to Cloudinary with a deterministic public_id
 *   - Generates src/data/cloudinary-images.ts with all Cloudinary URLs
 *   - Generates src/data/brandImages.ts with Cloudinary URLs for brands
 */

import { v2 as cloudinary } from 'cloudinary'
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs'
import { join, extname, parse, resolve } from 'path'
import { fileURLToPath } from 'url'

// ─── Cloudinary Config ───────────────────────────────────────
cloudinary.config() // auto-reads CLOUDINARY_URL from env

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'y7up4zti'
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1`

// ─── Directories ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname = parse(__filename).dir
const ROOT = resolve(__dirname, '..')
const PRODUCTS_DIR = join(ROOT, 'public', 'images', 'products')
const CATEGORIES_DIR = join(ROOT, 'public', 'images', 'categories')
const BRAND_DIR = join(ROOT, 'public', 'brand')
const STATIC_DIR = join(ROOT, 'public', 'images')
const OUTPUT_BRAND_TS = join(ROOT, 'src', 'data', 'brandImages.ts')
const VIDEO_DIR = join(ROOT, 'public')

// Track upload results for summary
const results = { products: 0, categories: 0, brands: 0, static: 0, videos: 0, skipped: 0, failed: 0 }
const cloudinaryUrls = {}

// ─── Helper: upload a single file to Cloudinary ──────────────
async function uploadFile(filePath, publicId) {
  try {
    const data = readFileSync(filePath)
    const b64 = `data:${getMimeType(filePath)};base64,${data.toString('base64')}`
    const result = await cloudinary.uploader.upload(b64, {
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      invalidate: true,
    })
    return result.secure_url
  } catch (err) {
    console.error(`  ✗ Failed: ${publicId} — ${err.message}`)
    results.failed++
    return null
  }
}

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase()
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' }
  return map[ext] || 'image/jpeg'
}

// ─── Helper: upload a video to Cloudinary ─────────────────────
async function uploadVideo(filePath, publicId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      resource_type: 'video',
      overwrite: true,
      invalidate: true,
      eager_async: false,
      transformation: [
        { width: 1280, crop: 'limit', quality: 'auto' },
      ],
    })
    return result.secure_url
  } catch (err) {
    console.error(`  ✗ Failed: ${publicId} — ${err.message}`)
    results.failed++
    return null
  }
}

// ─── Upload Product Images ──────────────────────────────────
async function uploadProducts() {
  console.log('\n📦 Uploading product images...')
  const files = readdirSync(PRODUCTS_DIR).filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
  
  for (const file of files) {
    const publicId = `alka/products/${file.replace(extname(file), '')}`
    const url = await uploadFile(join(PRODUCTS_DIR, file), publicId)
    if (url) {
      cloudinaryUrls[`products/${file}`] = url
      results.products++
      process.stdout.write('.')
    }
  }
  console.log(`\n  ✓ ${results.products} product images uploaded`)
}

// ─── Upload Category Images ─────────────────────────────────
async function uploadCategories() {
  console.log('\n📁 Uploading category images...')
  const files = readdirSync(CATEGORIES_DIR).filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
  
  for (const file of files) {
    const slug = file.replace(extname(file), '').toLowerCase().replace(/\s+/g, '-')
    const publicId = `alka/categories/${slug}`
    const url = await uploadFile(join(CATEGORIES_DIR, file), publicId)
    if (url) {
      cloudinaryUrls[`categories/${file}`] = url
      results.categories++
    }
  }
  console.log(`  ✓ ${results.categories} category images uploaded`)
}

// ─── Upload Brand Logos ─────────────────────────────────────
async function uploadBrands() {
  console.log('\n🏷️  Uploading brand logos...')
  if (!existsSync(BRAND_DIR)) {
    console.log('  ⚠️  public/brand/ directory not found, skipping')
    return
  }
  const files = readdirSync(BRAND_DIR).filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
  
  for (const file of files) {
    const name = file.replace(extname(file), '')
    const publicId = `alka/brands/${name}`
    const url = await uploadFile(join(BRAND_DIR, file), publicId)
    if (url) {
      cloudinaryUrls[`brands/${file}`] = url
      results.brands++
      if (results.brands % 50 === 0) process.stdout.write('.')
    }
  }
  console.log(`\n  ✓ ${results.brands} brand logos uploaded`)
}

// ─── Upload Static Images ───────────────────────────────────
async function uploadStatic() {
  console.log('\n🖼️  Uploading static images...')
  const staticFiles = ['alka-traders-logo.jpg', 'placeholder.jpg', 'payments.png', 'marq-3.png', 'marq11.png', 'marq-1.png', 'marq-2.png']
  
  for (const file of staticFiles) {
    const filePath = join(STATIC_DIR, file)
    if (!existsSync(filePath)) {
      console.log(`  ⚠️  ${file} not found, skipping`)
      continue
    }
    const name = file.replace(extname(file), '')
    const publicId = `alka/static/${name}`
    const url = await uploadFile(filePath, publicId)
    if (url) {
      cloudinaryUrls[`static/${file}`] = url
      results.static++
    }
  }
  console.log(`  ✓ ${results.static} static images uploaded`)
}

// ─── Upload Videos ──────────────────────────────────────────
async function uploadVideos() {
  console.log('\n🎬 Uploading videos...')
  const videoFiles = readdirSync(VIDEO_DIR).filter(f => /\.(mp4|webm|mov)$/i.test(f))
  
  if (videoFiles.length === 0) {
    console.log('  ⚠️  No video files found in public/, skipping')
    return
  }

  for (const file of videoFiles) {
    const name = file.replace(extname(file), '')
    const publicId = `alka/static/${name}`
    const url = await uploadVideo(join(VIDEO_DIR, file), publicId)
    if (url) {
      cloudinaryUrls[`static/${file}`] = url
      results.videos++
      console.log(`  ✓ ${file} uploaded → ${url}`)
    }
  }
  console.log(`  ✓ ${results.videos} video(s) uploaded`)
}

// ─── Generate TypeScript mapping files ──────────────────────
async function generateBrandImages() {
  console.log('\n📝 Generating brandImages.ts with Cloudinary URLs...')
  
  const brandImageUrls = Object.entries(cloudinaryUrls)
    .filter(([key]) => key.startsWith('brands/'))
    .map(([_, url]) => url)
  
  let ts = `/**\n * Auto-generated list of brand image Cloudinary URLs.\n * Generated by scripts/upload-images-to-cloudinary.mjs\n * Used by the Brands page showcase marquee\n */\nexport const brandImages: string[] = ${JSON.stringify(brandImageUrls, null, 2)}\n`
  
  writeFileSync(OUTPUT_BRAND_TS, ts, 'utf-8')
  console.log(`  ✓ Generated ${OUTPUT_BRAND_TS} with ${brandImageUrls.length} brand image URLs`)
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60))
  console.log('  Cloudinary Image Upload')
  console.log(`  Cloud: ${CLOUD_NAME}`)
  console.log('═'.repeat(60))
  
  if (!process.env.CLOUDINARY_URL) {
    console.error('\n❌ CLOUDINARY_URL environment variable is required.')
    console.error('   Usage: CLOUDINARY_URL=cloudinary://key:secret@cloudname node scripts/upload-images-to-cloudinary.mjs')
    process.exit(1)
  }
  
  await uploadProducts()
  await uploadCategories()
  await uploadBrands()
  await uploadStatic()
  await uploadVideos()
  
  await generateBrandImages()
  
  console.log('\n' + '═'.repeat(60))
  console.log('  Upload Complete')
  console.log(`  Products:  ${results.products}`)
  console.log(`  Categories: ${results.categories}`)
  console.log(`  Brands:     ${results.brands}`)
  console.log(`  Static:     ${results.static}`)
  console.log(`  Videos:     ${results.videos}`)
  console.log(`  Failed:     ${results.failed}`)
  console.log('═'.repeat(60))
}

main().catch(console.error)
