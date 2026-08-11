import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Eye } from 'lucide-react'
import { ProductCard } from '../ui/ProductCard'
import { fromLocalInputValue } from '../../lib/utils'
import type { Product } from '../../types'
import type { ProductFormData } from '../../hooks/useProductForm'

interface ProductPreviewModalProps {
  form: ProductFormData
  brandList: { id: string; name: string }[]
  onClose: () => void
}

/**
 * Build a storefront-shaped Product from the current form state so the real
 * ProductCard can be rendered — a true WYSIWYG preview of the listing
 * (image, sale badge, countdown, price, stock, custom label).
 */
export function buildPreviewProduct(
  form: ProductFormData,
  brandList: { id: string; name: string }[],
): Product {
  const regularPrice = Number(form.regularPrice) || 0
  const salePrice = form.salePrice ? Number(form.salePrice) : undefined
  const start = form.saleStartsAt ? new Date(fromLocalInputValue(form.saleStartsAt)).getTime() : -Infinity
  const end = form.saleEndsAt ? new Date(fromLocalInputValue(form.saleEndsAt)).getTime() : Infinity
  const now = Date.now()
  const isOnSale =
    Boolean(salePrice) &&
    salePrice != null &&
    salePrice > 0 &&
    regularPrice > salePrice &&
    now >= start &&
    now <= end

  const brandName = brandList.find((b) => b.id === form.brand)?.name || form.brand || 'Brand'

  return {
    id: 'preview-product',
    filename: form.images.find((img) => img.url)?.url || '',
    name: form.name || 'Product name',
    brand: brandName,
    sku: form.sku || 'SKU',
    category: 'spares' as Product['category'],
    industry: [],
    availability: form.availability as Product['availability'],
    specs: Object.fromEntries(
      form.specs.filter((s) => s.name.trim()).map((s) => [s.name, s.value]),
    ),
    description: form.description || form.shortDescription || '',
    condition: form.condition as Product['condition'],
    price: isOnSale && salePrice ? salePrice : regularPrice,
    regularPrice: regularPrice || undefined,
    salePrice: isOnSale ? salePrice : undefined,
    onSale: isOnSale,
    saleStartsAt: isOnSale && form.saleStartsAt ? fromLocalInputValue(form.saleStartsAt) : undefined,
    saleEndsAt: isOnSale && form.saleEndsAt ? fromLocalInputValue(form.saleEndsAt) : undefined,
    inStock: form.inStock,
    stockCount: Number(form.stockCount) || 0,
    customLabel: form.customLabel || undefined,
    customLabelColor: form.customLabel ? form.customLabelColor : undefined,
    images: [],
    makeOffer: form.makeOfferEnabled,
  }
}export function ProductPreviewModal({ form, brandList, onClose }: ProductPreviewModalProps) {
  const { t } = useTranslation()
  const product = buildPreviewProduct(form, brandList)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Product listing preview"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <h3 className="flex items-center gap-2 font-display text-sm font-extrabold text-[var(--text-primary)]">
            <Eye size={15} className="text-[var(--accent-gold)]" />
            Storefront Preview
          </h3>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            This is how the listing will appear to customers on the storefront, using the data
            currently filled in — including images, sale pricing, and labels.
          </p>
          <div className="pointer-events-none mx-auto w-full max-w-[320px] select-none">
            <ProductCard product={product} t={t} />
          </div>
          {!form.images.some((img) => img.url) && (
            <p className="mt-4 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-subtle)] px-3 py-2 text-center text-[11px] font-semibold text-[var(--accent-gold)]">
              No image added yet — a placeholder image will be shown.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
