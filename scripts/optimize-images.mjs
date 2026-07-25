#!/usr/bin/env node
/**
 * Image Optimization Script for Alka Traders
 * 
 * Compresses JPEG images and generates WebP + AVIF variants at multiple
 * responsive sizes for modern browsers.
 * 
 * Output per image (e.g. product-001):
 *   - product-001_electrical.jpg      (1200px — full size fallback)
 *   - product-001.webp     (1200px)
 *   - product-001.avif     (1200px)
 *   - product-001-800.jpg  (800px — tablet)
 *   - product-001-800.webp
 *   - product-001-800.avif
 *   - product-001-600.jpg  (600px — mobile large)
 *   - product-001-600.webp
 *   - product-001-600.avif
 *   - product-001-400.jpg  (400px — mobile small / thumbnails)
 *   - product-001-400.webp
 *   - product-001-400.avif
 * 
 * Run: node scripts/optimize-images.mjs
 */

import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = join(process.cwd(), 'public', 'images');

// Quality settings
const QUALITY_JPEG = 75;
const QUALITY_WEBP = 80;
const QUALITY_AVIF = 60;

// Full size cap
const MAX_WIDTH = 1200;

// Responsive breakpoints — images smaller than the source are resized down
const RESPONSIVE_SIZES = [800, 600, 400];

// Tracks whether the current runtime supports AVIF (detected on first use)
let avifSupported = true;

async function getImages(dir) {
  const entries = await readdir(dir);
  // Only process source images (not already-resized variants like -400, -600, -800)
  return entries.filter(f => /\.(jpe?g|png)$/i.test(f) && !/-(?:400|600|800)\.(jpe?g|png)$/i.test(f));
}

/**
 * Write buffer to disk and return its size in bytes.
 */
async function writeBuffer(path, buffer) {
  await writeFile(path, buffer);
  return buffer.length;
}

/**
 * Generate a single format at a single width, returning the buffer.
 */
async function generateFormat(inputBuffer, format, quality, width) {
  let pipeline = sharp(inputBuffer);
  if (width && width < MAX_WIDTH) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }
  switch (format) {
    case 'jpeg':
      return pipeline.jpeg({ quality: QUALITY_JPEG, progressive: true, mozjpeg: true }).toBuffer();
    case 'webp':
      return pipeline.webp({ quality: QUALITY_WEBP, effort: 4 }).toBuffer();
    case 'avif':
      return pipeline.avif({ quality: QUALITY_AVIF, effort: 4 }).toBuffer();
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

async function optimizeImage(filename) {
  const inputPath = join(IMAGES_DIR, filename);
  const name = basename(filename, extname(filename));
  
  const inputStat = await stat(inputPath);
  const inputSize = inputStat.size;
  const inputBuffer = await readFile(inputPath);
  
  // Get metadata from original
  const metadata = await sharp(inputBuffer).metadata();
  
  const sizes = [];
  let totalAfter = 0;

  // --- Full size (1200px max) ---
  const formats = ['jpeg', 'webp'];
  if (avifSupported) formats.push('avif');

  for (const fmt of formats) {
    try {
      const buffer = await generateFormat(inputBuffer, fmt, null, null);
      const ext = fmt === 'jpeg' ? 'jpg' : fmt;
      const outPath = join(IMAGES_DIR, `${name}.${ext}`);
      const written = await writeBuffer(outPath, buffer);
      totalAfter += written;
      sizes.push({ format: ext, width: MAX_WIDTH, size: written });
    } catch (err) {
      if (fmt === 'avif') {
        avifSupported = false;
        sizes.push({ format: 'avif', width: MAX_WIDTH, size: 0, error: err.message });
      } else {
        throw err;
      }
    }
  }

  // --- Responsive variants (800, 600, 400) ---
  const sourceWidth = metadata.width || MAX_WIDTH;
  for (const size of RESPONSIVE_SIZES) {
    if (sourceWidth <= size) continue; // Don't upscale

    const fmts = ['jpeg', 'webp'];
    if (avifSupported) fmts.push('avif');

    for (const fmt of fmts) {
      try {
        const buffer = await generateFormat(inputBuffer, fmt, null, size);
        const ext = fmt === 'jpeg' ? 'jpg' : fmt;
        const outPath = join(IMAGES_DIR, `${name}-${size}.${ext}`);
        const written = await writeBuffer(outPath, buffer);
        totalAfter += written;
        sizes.push({ format: ext, width: size, size: written });
      } catch (err) {
        if (fmt === 'avif') {
          avifSupported = false;
        }
        // For non-avif errors, log but continue
        if (fmt !== 'avif') {
          console.error(`  ⚠ ${name}-${size}.${fmt}: ${err.message}`);
        }
      }
    }
  }

  const jpegSavings = ((1 - sizes.find(s => s.width === MAX_WIDTH && s.format === 'jpg')?.size / inputSize) * 100).toFixed(1);
  
  return {
    filename,
    before: inputSize,
    after: totalAfter,
    jpegSavings,
    width: metadata.width,
    height: metadata.height,
    variantCount: sizes.length,
  };
}

async function main() {
  console.log('🖼️  Alka Traders Image Optimizer (Responsive)\n');
  console.log(`Source: ${IMAGES_DIR}`);
  console.log(`Quality: JPEG ${QUALITY_JPEG}, WebP ${QUALITY_WEBP}, AVIF ${QUALITY_AVIF}`);
  console.log(`Max width: ${MAX_WIDTH}px`);
  console.log(`Responsive sizes: ${RESPONSIVE_SIZES.join(', ')}px\n`);
  
  const images = await getImages(IMAGES_DIR);
  console.log(`Found ${images.length} source images to process\n`);
  
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let errors = 0;
  let totalVariants = 0;
  
  for (const image of images) {
    try {
      const result = await optimizeImage(image);
      totalBefore += result.before;
      totalAfter += result.after;
      totalVariants += result.variantCount;
      processed++;
      
      const beforeKB = (result.before / 1024).toFixed(0);
      const afterKB = (result.after / 1024).toFixed(0);
      
      console.log(`✅ ${image}: ${beforeKB}KB → ${afterKB}KB total (${result.variantCount} variants, ${result.jpegSavings}% JPEG savings)`);
    } catch (err) {
      errors++;
      console.error(`❌ ${image}: ${err.message}`);
    }
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Processed: ${processed}/${images.length} images`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total variants generated: ${totalVariants}`);
  console.log(`   AVIF supported: ${avifSupported ? 'Yes' : 'No (fallback to WebP only)'}`);
  console.log(`   Total before: ${(totalBefore / 1024 / 1024).toFixed(1)}MB`);
  console.log(`   Total after: ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
  console.log(`\n   Breakdown: ${RESPONSIVE_SIZES.map(s => `${s}px`).join(' + ')} + ${MAX_WIDTH}px (full)`);
}

main().catch(console.error);
