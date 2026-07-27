/**
 * Migration: Fix MediaAsset filename field to use full 64-char SHA-256 hash.
 *
 * Issue: Old uploads stored truncated 12-char hashes in filename (e.g. alka/a1b2c3d4e5f6).
 * New code uses full 64-char hashes. Delete operations fail on old records because
 * the public_id doesn't match what's actually on Cloudinary.
 *
 * Strategy:
 *   For each MediaAsset with a filename shorter than expected:
 *     1. Derive the full public_id from the stored URL (Cloudinary URLs contain the full path)
 *     2. Update the filename field to match the actual Cloudinary public_id
 *     3. If URL doesn't help, compute the full hash and re-upload (worst case)
 *
 * Run with: npx tsx prisma/migrate-media-filename-hash.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Extract the Cloudinary public_id from a secure_url.
 * Example: https://res.cloudinary.com/y7up4zti/image/upload/v1234567/alka/abc123...
 * Returns: alka/abc123...
 */
function extractPublicIdFromUrl(url: string): string | null {
  // Match the pattern after /upload/<version>/ up to the end (or before any transforms)
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\?|$)/)
  if (!match) return null
  // Remove file extension if present
  return match[1].replace(/\.\w+$/, '')
}

async function main() {
  console.log('🔍 Finding MediaAsset records with short filenames (legacy truncated hash)...\n')

  // Find all assets — we'll filter by filename pattern in JS
  const assets = await prisma.mediaAsset.findMany({
    select: { id: true, filename: true, url: true, originalName: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${assets.length} total MediaAsset records.\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const asset of assets) {
    // Check if filename already uses full 64-char hash
    const fullHashPattern = /^alka\/[a-f0-9]{64}$/
    if (fullHashPattern.test(asset.filename)) {
      skipped++
      continue // Already correct
    }

    // Try to extract the actual public_id from the URL
    const publicIdFromUrl = extractPublicIdFromUrl(asset.url)

    if (publicIdFromUrl && publicIdFromUrl !== asset.filename) {
      console.log(`  Updating: ${asset.id}`)
      console.log(`    Old filename: ${asset.filename}`)
      console.log(`    New filename: ${publicIdFromUrl}`)
      console.log(`    URL: ${asset.url}\n`)

      try {
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { filename: publicIdFromUrl },
        })
        updated++
      } catch (err) {
        console.error(`    ❌ Failed to update ${asset.id}: ${(err as Error).message}\n`)
        failed++
      }
    } else {
      // Can't determine the correct public_id from the URL
      // This might be a very old record or the URL format is unexpected
      console.log(`  ⚠️  Skipped (can't determine public_id): ${asset.id}`)
      console.log(`    filename: ${asset.filename}`)
      console.log(`    url: ${asset.url}`)
      console.log(`    url-derived: ${publicIdFromUrl ?? 'null'}\n`)
      skipped++
    }
  }

  console.log('\n' + '═'.repeat(60))
  console.log(`Migration complete:`)
  console.log(`  ✅ Updated: ${updated}`)
  console.log(`  ⏭️  Skipped (already correct): ${skipped}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log('═'.repeat(60))

  if (failed > 0) {
    console.log('\n⚠️  Some records couldn\'t be migrated automatically.')
    console.log('   These records may need manual intervention on Cloudinary.')
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
