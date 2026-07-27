/**
 * Shared utility functions for Alka Traders.
 */

/**
 * Determine whether a hex color is "light" (needs dark text) or "dark" (needs light text).
 * Uses the W3C relative luminance formula.
 *
 * @param hex - A hex color string, e.g. "#159a67" or "159a67"
 * @returns true if the color is light (use dark text), false if dark (use light text)
 */
export function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '')
  if (clean.length < 3) return false
  // Expand 3-char hex to 6-char
  const hex6 = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const r = parseInt(hex6.slice(0, 2), 16) / 255
  const g = parseInt(hex6.slice(2, 4), 16) / 255
  const b = parseInt(hex6.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return luminance > 0.179 // threshold per WCAG
}

/** Cloudinary base URL for this project */
const CLOUDINARY_BASE = 'https://res.cloudinary.com/y7up4zti/image/upload/v1'

/**
 * Safely format a product image URL.
 * Priority:
 *   1. Cloudinary CDN for product images (product-XXX[_category].jpg)
 *   2. Absolute URLs (http/https) → passed through
 *   3. /uploads/ paths (admin-uploaded images, stored in Cloudinary) → passed through
 *   4. Local static files → /images/products/...
 */
export function getProductImageUrl(pathOrFilename?: string): string {
  if (!pathOrFilename) return `${CLOUDINARY_BASE}/alka/static/placeholder`
  if (pathOrFilename.startsWith('http://') || pathOrFilename.startsWith('https://')) return pathOrFilename
  if (pathOrFilename.startsWith('/uploads/')) return pathOrFilename
  
  const clean = pathOrFilename.startsWith('/') ? pathOrFilename.slice(1) : pathOrFilename
  const filename = clean.split('/').pop() || ''
  
  // If this is a product image pattern, serve from Cloudinary CDN
  if (/^product-\d{3}(_[a-z0-9-]+)?\.jpg$/.test(filename)) {
    const name = filename.replace(/\.jpg$/, '')
    return `${CLOUDINARY_BASE}/alka/products/${name}`
  }
  
  // Fallback: local static files
  if (clean.startsWith('images/products/')) return `/${clean}`
  if (clean.startsWith('products/')) return `/images/${clean}`
  if (clean.startsWith('images/')) return `/images/products/${clean.slice(7)}`
  if (clean.startsWith('uploads/')) return `/${clean}`
  return `/images/products/${clean}`
}

/**
 * Get Cloudinary URL for a category image.
 */
export function getCategoryImageUrl(categoryFile: string): string {
  const slug = categoryFile.replace(/\.\w+$/, '').toLowerCase().replace(/\s+/g, '-')
  return `${CLOUDINARY_BASE}/alka/categories/${slug}`
}

/**
 * Get Cloudinary URL for a static image (logo, placeholder, payments, hero).
 */
export function getStaticImageUrl(name: string): string {
  return `${CLOUDINARY_BASE}/alka/static/${name}`
}
