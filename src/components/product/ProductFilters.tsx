import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, X as XIcon } from 'lucide-react'

interface ProductFiltersProps {
  // Categories
  derivedCategories: { id: string; name: string; count: number }[]
  selectedCategories: string[]
  onToggleCategory: (cat: string) => void
  // Brands
  derivedBrands: { slug: string; name: string }[]
  selectedBrands: string[]
  onToggleBrand: (slug: string) => void
  // Price range
  localMinPrice: string
  localMaxPrice: string
  onMinPriceChange: (v: string) => void
  onMaxPriceChange: (v: string) => void
  onApplyPrice: () => void
  // On Sale
  showOnSale: boolean
  onToggleOnSale: () => void
  // Availability
  urgencyFilter: string
  onSetUrgencyFilter: (v: string) => void
  // Actions
  onClearFilters: () => void
  // Mobile
  showFiltersMobile: boolean
  onToggleMobile: () => void
  // Count
  totalCount: number
}

export function ProductFilters({
  derivedCategories, selectedCategories, onToggleCategory,
  derivedBrands, selectedBrands, onToggleBrand,
  localMinPrice, localMaxPrice, onMinPriceChange, onMaxPriceChange, onApplyPrice,
  showOnSale, onToggleOnSale,
  urgencyFilter, onSetUrgencyFilter,
  onClearFilters,
  showFiltersMobile, onToggleMobile,
  totalCount,
}: ProductFiltersProps) {
  const { t } = useTranslation()

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="lg:hidden flex justify-between items-center mb-2">
        <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">
          {totalCount} {totalCount === 1 ? t('products.product') : t('products.products')}
        </span>
        <button
          onClick={onToggleMobile}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-primary)]"
        >
          {showFiltersMobile ? <XIcon size={14} /> : <SlidersHorizontal size={14} />}
          {showFiltersMobile ? t('products.hideFilters') : t('products.showFilters')}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`lg:sticky lg:top-20 ${showFiltersMobile ? 'block' : 'hidden'} lg:block`}>
        <div className="commerce-card p-6">
          {/* Categories */}
          <div className="mb-6">
            <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-3">
              {t('products.category')}
            </span>
            {derivedCategories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => onToggleCategory(cat.id)}
                  className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
                />
                <span className="flex-1">{cat.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{cat.count}</span>
              </label>
            ))}
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-3">
              {t('products.priceRange')}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0} max={1000}
                value={localMinPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                onBlur={onApplyPrice}
                onKeyDown={(e) => e.key === 'Enter' && onApplyPrice()}
                placeholder={t('products.priceMin')}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)]"
              />
              <span className="text-[var(--text-muted)] text-xs">—</span>
              <input
                type="number"
                min={0} max={1000}
                value={localMaxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                onBlur={onApplyPrice}
                onKeyDown={(e) => e.key === 'Enter' && onApplyPrice()}
                placeholder={t('products.priceMax')}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)]"
              />
            </div>
            <button
              onClick={onApplyPrice}
              className="w-full mt-2 py-2 text-xs font-bold text-[var(--accent-primary)] hover:text-[var(--accent-gold)] transition-colors bg-transparent border border-[var(--border)] rounded-lg"
            >
              {t('products.applyPrice')}
            </button>
          </div>

          {/* On Sale */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5">
              <input
                type="checkbox"
                checked={showOnSale}
                onChange={onToggleOnSale}
                className="accent-[var(--accent-gold)] w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-[var(--danger)]">{t('products.onSaleOnly')}</span>
            </label>
          </div>

          {/* Brands */}
          <div className="mb-6">
            <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-3">
              {t('products.brand')}
            </span>
            {derivedBrands.map((brand) => (
              <label
                key={brand.slug}
                className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.slug)}
                  onChange={() => onToggleBrand(brand.slug)}
                  className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
                />
                {brand.name}
              </label>
            ))}
          </div>

          {/* Availability */}
          <div className="mb-6">
            <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-3">
              {t('products.availability')}
            </span>
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5">
              <input
                type="radio"
                name="urgency"
                checked={urgencyFilter === 'all'}
                onChange={() => onSetUrgencyFilter('all')}
                className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
              />
              {t('products.allItems')}
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5">
              <input
                type="radio"
                name="urgency"
                checked={urgencyFilter === 'emergency'}
                onChange={() => onSetUrgencyFilter('emergency')}
                className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
              />
              {t('products.emergencyAvailable')}
            </label>
          </div>

          <button
            onClick={onClearFilters}
            className="w-full text-right text-xs font-bold text-[var(--accent-primary)] hover:text-[var(--accent-gold)] transition-colors bg-transparent border-none cursor-pointer py-2"
          >
            {t('products.clearFilters')}
          </button>
        </div>
      </aside>
    </>
  )
}
