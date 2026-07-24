import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionLabel } from '../ui/SectionLabel'
import { ArrowRight, ShoppingCart, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAddToCart } from '../../hooks/useAddToCart'
import { OptimizedImage } from '../ui/OptimizedImage'
import { storefront } from '../../lib/api'
import { apiProductsToFrontend } from '../../lib/adapters'
import type { Product } from '../../types'

import { getProductImageUrl } from '../../lib/utils'

import { products as staticProducts } from '../../data/products'

export function FeaturedProducts() {
  const { t } = useTranslation()
  const { handleAddToCart, addedIds } = useAddToCart()
  const [featured, setFeatured] = useState<Product[]>([])

  useEffect(() => {
    let cancelled = false
    storefront.products.featured()
      .then((res) => {
        if (!cancelled && res.products?.length) {
          setFeatured(apiProductsToFrontend(res.products).slice(0, 8))
        } else if (!cancelled) {
          setFeatured(staticProducts.slice(0, 8))
        }
      })
      .catch(() => {
        if (!cancelled) setFeatured(staticProducts.slice(0, 8))
      })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="py-28 bg-[var(--secondary-bg)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">
          <div>
            <SectionLabel>{t('featured.label')}</SectionLabel>
            <h2 className="font-display font-bold text-section tracking-tight">{t('featured.title')}</h2>
            <div className="gold-accent-bar mt-4" />
          </div>
          <a href="/products" className="inline-flex items-center gap-2 text-sm font-bold border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] px-6 py-3 rounded-xl hover:bg-[var(--accent-primary)] hover:text-white transition-all duration-300 no-underline">
            {t('featured.viewAll')} <ArrowRight size={16} />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((product, i) => (
            <div key={product.id} className="maritime-card overflow-hidden group" style={{ animationDelay: `${i * 50}ms` }}>
              <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[var(--surface-soft)]">
                <OptimizedImage src={getProductImageUrl(product.filename)} alt={product.name} className="w-full aspect-[4/3] object-cover border-b border-[var(--border)] transition-transform duration-500 group-hover:scale-105" width={400} height={300} loading="lazy" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" onError={(e) => { const img = e.target as HTMLImageElement; img.src = '/images/placeholder.avif'; img.onerror = null; }} />
                {product.availability === 'emergency' && <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-xs font-mono font-bold border border-danger/30/30 text-white bg-danger/90 rounded-lg shadow-[0_2px_10px_var(--danger-border)]">Emergency</span>}
              </Link>
              <div className="p-4">
                <span className="inline-block font-mono text-xs px-2.5 py-1 border border-[var(--accent-primary)]/15 text-[var(--accent-primary)] bg-[var(--accent-primary)]/[0.04] rounded-lg">{product.brand}</span>
                <h4 className="text-label mt-3 leading-tight hover:text-[var(--accent-primary)] transition-colors min-h-[40px]">
                  <Link to={`/product/${product.id}`}>{product.name}</Link>
                </h4>
                <span className="font-mono text-xs text-[var(--text-muted)] block mt-1">{t('product.skuPrefix', { sku: product.sku })}</span>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <span className="font-display font-bold text-xl tracking-tight tabular-nums text-[var(--text-primary)]">
                    ${(product.onSale && product.salePrice ? product.salePrice : product.price).toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-[var(--success)]">{t('featured.ready')}</span>
                </div>
                <button onClick={() => handleAddToCart(product)} className={`inline-flex items-center justify-center w-full gap-2 text-xs font-bold px-[18px] py-[11px] mt-3 transition-all duration-300 border cursor-pointer rounded-xl ${addedIds.has(product.id) ? 'border-[var(--success)] bg-[var(--success)] text-[var(--btn-success-text)]' : 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] hover:shadow-[0_4px_16px_var(--focus-ring)]'}`}>
                  {addedIds.has(product.id) ? <><Check size={14} /> {t('product.added')}</> : <><ShoppingCart size={14} /> {t('product.addToCart')}</>}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm font-semibold text-[var(--text-secondary)]">{t('featured.needPart')}</div>
      </div>
    </section>
  )
}
