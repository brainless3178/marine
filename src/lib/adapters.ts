/**
 * Adapters to transform backend API responses into the frontend Product type.
 * This bridges the shape mismatch between Prisma model output and the
 * existing frontend Product interface.
 */
import type { Product } from '../types'

interface ApiProduct {
  id: string
  name: string
  sku: string
  slug: string
  brand?: { id: string; name: string; slug: string } | null
  category?: { id: string; name: string; slug: string; icon?: string } | null
  status: string
  availability: string
  condition: string
  shortDescription?: string | null
  description?: string | null
  regularPrice: number | string
  salePrice?: number | string | null
  saleStartsAt?: string | null
  saleEndsAt?: string | null
  currency: string
  showPrice: boolean
  makeOfferEnabled: boolean
  stockCount: number
  lowStockThreshold: number
  warehouseLocation?: string | null
  publicItemLocation?: string | null
  leadTime?: string | null
  isNewArrival: boolean
  isFeatured: boolean
  customLabel?: string | null
  customLabelColor?: string | null
  sortPriority: number
  images: { id: string; url: string; altText?: string | null; label?: string | null; isMain: boolean; sortOrder: number }[]
  specs: { name: string; value: string }[]
  industries: { industry: { id: string; name: string; slug: string } }[]
  price?: number
  onSale?: boolean
  inStock?: boolean
  keyFeatures?: string[]
  compatibilityNotes?: string | null
  conditionNotes?: string | null
  warrantyNotes?: string | null
  includedItems?: string[]
  excludedItems?: string[]
  legacyId?: string | null
}

export function apiProductToFrontend(api: ApiProduct): Product {
  const regularPrice = Number(api.regularPrice) || 0
  const salePriceNum = api.salePrice ? Number(api.salePrice) : undefined
  const now = new Date()
  const isOnSale =
    salePriceNum != null &&
    salePriceNum < regularPrice &&
    (!api.saleStartsAt || new Date(api.saleStartsAt) <= now) &&
    (!api.saleEndsAt || new Date(api.saleEndsAt) >= now)

  const effectivePrice = isOnSale && salePriceNum ? salePriceNum : regularPrice

  let rawFilename = api.images?.[0]?.url?.split('/').pop()?.split('?')[0]
  if (rawFilename) {
    rawFilename = rawFilename
      .replace(/^prod-/, 'product-')
      .replace(/\.avif$/, '.jpg')
      .replace(/\.png$/, '.jpg')
  }

  // If no valid filename or doesn't match product-XXX.jpg pattern (e.g. UUID filename from admin upload),
  // attempt matching by numeric part of product ID or SKU, or fallback to placeholder
  if (!rawFilename || rawFilename.includes('placeholder') || !/^product-\d{3}\.jpg$/.test(rawFilename)) {
    const match = api.id.match(/\d+/) || api.sku.match(/\d+/)
    if (match) {
      const num = String((parseInt(match[0], 10) % 255) + 1).padStart(3, '0')
      rawFilename = `product-${num}.jpg`
    } else {
      rawFilename = 'placeholder.jpg'
    }
  }

  const filename = rawFilename.startsWith('products/') ? rawFilename : `products/${rawFilename}`

  return {
    id: api.id,
    filename,
    name: api.name,
    brand: api.brand?.name || 'Unknown',
    sku: api.sku,
    category: (api.category?.slug || 'other-business') as Product['category'],
    industry: api.industries?.map((i) => i.industry.slug) || [],
    availability: api.availability as Product['availability'],
    specs: Object.fromEntries(api.specs?.map((s) => [s.name, s.value]) || []),
    description: api.description || api.shortDescription || '',
    condition: api.condition as Product['condition'],
    price: effectivePrice,
    salePrice: isOnSale ? salePriceNum : undefined,
    onSale: isOnSale,
    inStock: api.stockCount > 0,
    stockCount: api.stockCount,
    customLabel: api.customLabel || undefined,
    customLabelColor: api.customLabelColor || undefined,
    images: api.images?.length
      ? api.images.map((img) => {
          let cleanName = (img.url.split('/').pop()?.split('?')[0] || '')
            .replace(/^prod-/, 'product-')
            .replace(/\.avif$/, '.jpg')
            .replace(/\.png$/, '.jpg') || ''
          // If not a recognizable product-XXX.jpg, use the computed fallback filename
          if (!cleanName || !/^product-\d{3}\.jpg$/.test(cleanName)) {
            cleanName = filename.startsWith('products/') ? filename.slice(9) : filename
          }
          return {
            url: `/images/products/${cleanName}`,
            alt: img.altText || `${api.name} - ${img.label || 'View'}`,
            label: img.label || undefined,
          }
        })
      : [{ url: `/images/${filename}`, alt: api.name }],
    isNewArrival: api.isNewArrival,
    makeOffer: api.makeOfferEnabled,
  }
}

export function apiProductsToFrontend(apiProducts: ApiProduct[]): Product[] {
  return apiProducts.map(apiProductToFrontend)
}
