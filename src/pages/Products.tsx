import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X as XIcon } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useProducts } from '../hooks/useProducts'
import { useAddToCart } from '../hooks/useAddToCart'
import { useProductList } from '../hooks/useApiQuery'
import { apiProductsToFrontend } from '../lib/adapters'
import { products as staticProducts } from '../data/products'
import { ProductFilters } from '../components/product/ProductFilters'
import { ProductGrid } from '../components/product/ProductGrid'
import { ProductPagination } from '../components/product/ProductPagination'
import { SEO } from '../components/seo/SEO'
import { BreadcrumbJsonLd } from '../components/seo/BreadcrumbJsonLd'
import type { Product } from '../types'

export default function Products() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const {
    searchQuery, setSearchQuery,
    selectedCategories, setSelectedCategories,
    selectedBrands, setSelectedBrands,
    setSelectedIndustry,
    priceRange, setPriceRange,
    showOnSale, setShowOnSale,
    urgencyFilter, setUrgencyFilter,
    sortBy, setSortBy,
    clearFilters,
  } = useStore()

  const { handleAddToCart, addedIds } = useAddToCart()

  // React Query caches the product list with deduplication + background refetch
  const { data: productListData, isLoading } = useProductList()

  const apiProducts: Product[] = useMemo(() => {
    if (productListData?.products?.length) {
      return apiProductsToFrontend(productListData.products)
    }
    return []
  }, [productListData])

  const apiLoaded = !isLoading

  const finalProducts: Product[] = useMemo(() => {
    if (productListData?.products?.length) return apiProducts
    if (!isLoading) return staticProducts
    return []
  }, [apiProducts, productListData, isLoading])

  const { filteredCount } = useProducts(finalProducts)
  const finalCount = filteredCount

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 24
  const totalPages = Math.ceil(finalCount / PAGE_SIZE)
  const paginatedProducts = finalProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => { setCurrentPage(1) }, [searchQuery, selectedCategories, selectedBrands, priceRange, showOnSale, urgencyFilter, sortBy])

  useEffect(() => {
    const el = document.querySelector('main')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPage])

  const [showFiltersMobile, setShowFiltersMobile] = useState(false)
  const [localMinPrice, setLocalMinPrice] = useState(priceRange.min.toString())
  const [localMaxPrice, setLocalMaxPrice] = useState(priceRange.max.toString())
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLocalSearch(searchQuery) }, [searchQuery])

  const debouncedSetSearch = useCallback((value: string) => {
    setLocalSearch(value)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => setSearchQuery(value), 300)
  }, [setSearchQuery])

  useEffect(() => () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }, [])

  useEffect(() => {
    const catParam = searchParams.get('category')
    const brandParam = searchParams.get('brand')
    const searchParam = searchParams.get('search')
    const industryParam = searchParams.get('industry')
    if (catParam) setSelectedCategories([catParam])
    if (brandParam) setSelectedBrands([brandParam])
    if (searchParam) setSearchQuery(searchParam)
    if (industryParam) setSelectedIndustry(industryParam)
    return () => { clearFilters() }
  }, [searchParams, setSelectedCategories, setSelectedBrands, setSelectedIndustry, setSearchQuery, clearFilters])

  useEffect(() => { setLocalMinPrice(priceRange.min.toString()); setLocalMaxPrice(priceRange.max.toString()) }, [priceRange])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(selectedCategories.includes(cat) ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat])
  }
  const toggleBrand = (slug: string) => {
    setSelectedBrands(selectedBrands.includes(slug) ? selectedBrands.filter(b => b !== slug) : [...selectedBrands, slug])
  }
  const applyPriceFilter = () => {
    const min = parseInt(localMinPrice) || 0
    const max = parseInt(localMaxPrice) || 0
    setPriceRange({ min: Math.max(0, min), max: Math.max(max, min + 1) })
  }

  // Derive categories and brands from loaded products (API or static fallback)
  const derivedCategories = finalProducts.reduce<{ id: string; name: string; count: number }[]>((acc, p) => {
    const existing = acc.find(c => c.id === p.category)
    if (existing) { existing.count++ } else { acc.push({ id: p.category, name: p.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), count: 1 }) }
    return acc
  }, [])

  const derivedBrands = finalProducts.reduce<{ slug: string; name: string }[]>((acc, p) => {
    const slug = p.brand.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')
    if (!acc.find(b => b.slug === slug)) { acc.push({ slug, name: p.brand }) }
    return acc
  }, [])

  // Active filter chips
  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || selectedBrands.length > 0 || showOnSale || urgencyFilter === 'emergency'

  return (
    <div>
      <SEO
        title="All Products — Marine & Industrial Equipment"
        description="Browse our full catalog of marine spares, surplus machinery, hydraulic systems, electrical automation components, and safety equipment."
        canonical="/products"
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Products', url: '/products' }]} />
      {/* Header */}
      <section className="bg-[var(--secondary-bg)] py-16 border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block font-body font-bold text-xs tracking-[3px] uppercase text-[var(--accent-primary)] mb-4">
            {t('products.catalog')}
          </span>
          <h1 className="font-display font-bold text-display-xl tracking-tight">
            {t('products.title')}
          </h1>
          <p className="max-w-[680px] mx-auto mt-4 text-body text-[var(--text-secondary)]">
            {t('products.description')}
          </p>
          <div className="relative max-w-[640px] mx-auto mt-8">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => debouncedSetSearch(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
              className="w-full pl-11 pr-4 py-4 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)] transition-all outline-none"
            />
          </div>
        </div>
      </section>

      {/* Layout */}
      <section className="py-12 bg-[var(--primary-bg)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
            {/* Sidebar Filters */}
            <ProductFilters
              derivedCategories={derivedCategories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              derivedBrands={derivedBrands}
              selectedBrands={selectedBrands}
              onToggleBrand={toggleBrand}
              localMinPrice={localMinPrice}
              localMaxPrice={localMaxPrice}
              onMinPriceChange={setLocalMinPrice}
              onMaxPriceChange={setLocalMaxPrice}
              onApplyPrice={applyPriceFilter}
              showOnSale={showOnSale}
              onToggleOnSale={() => setShowOnSale(!showOnSale)}
              urgencyFilter={urgencyFilter}
              onSetUrgencyFilter={setUrgencyFilter}
              onClearFilters={clearFilters}
              showFiltersMobile={showFiltersMobile}
              onToggleMobile={() => setShowFiltersMobile((v) => !v)}
              totalCount={finalCount}
            />

            {/* Main content */}
            <main>
              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]">
                      Search: "{searchQuery}"
                      <button onClick={() => { setSearchQuery(''); setLocalSearch('') }} className="ml-0.5 hover:text-[var(--danger)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-bold">×</button>
                    </span>
                  )}
                  {selectedCategories.map((catId) => {
                    const cat = derivedCategories.find((c) => c.id === catId)
                    return (
                      <span key={catId} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-[var(--accent-gold)] bg-[var(--accent-gold)]/5 text-[var(--accent-gold)]">
                        {cat?.name ?? catId}
                        <button onClick={() => toggleCategory(catId)} className="ml-0.5 hover:text-[var(--danger)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-bold">×</button>
                      </span>
                    )
                  })}
                  {selectedBrands.map((slug) => {
                    const brand = derivedBrands.find((b) => b.slug === slug)
                    return (
                      <span key={slug} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]">
                        {brand?.name ?? slug}
                        <button onClick={() => toggleBrand(slug)} className="ml-0.5 hover:text-[var(--danger)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-bold">×</button>
                      </span>
                    )
                  })}
                  {showOnSale && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-[var(--danger)] bg-[var(--danger)]/5 text-[var(--danger)]">
                      On Sale
                      <button onClick={() => setShowOnSale(false)} className="ml-0.5 hover:text-[var(--danger)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-bold">×</button>
                    </span>
                  )}
                  {urgencyFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5 text-[var(--accent-gold)]">
                      Emergency Available
                      <button onClick={() => setUrgencyFilter('all')} className="ml-0.5 hover:text-[var(--danger)] transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-bold">×</button>
                    </span>
                  )}
                  <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer">
                    Clear all
                  </button>
                </div>
              )}
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <span className="text-sm text-[var(--text-secondary)]">
                  {t('products.showing')} {finalCount} {finalCount === 1 ? t('products.product') : t('products.products')}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'relevance' | 'name-asc' | 'name-desc' | 'category' | 'price-asc' | 'price-desc')}
                  aria-label={t('products.sort')}
                  className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394A3B8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    paddingRight: '32px',
                  }}
                >
                  <option value="relevance">{t('products.sort')}: {t('products.sortRelevance')}</option>
                  <option value="name-asc">{t('products.sort')}: {t('products.sortNameAsc')}</option>
                  <option value="name-desc">{t('products.sort')}: {t('products.sortNameDesc')}</option>
                  <option value="category">{t('products.sort')}: {t('products.sortCategory')}</option>
                  <option value="price-asc">{t('products.sort')}: {t('products.sortPriceAsc')}</option>
                  <option value="price-desc">{t('products.sort')}: {t('products.sortPriceDesc')}</option>
                </select>
              </div>

              {!apiLoaded ? (
                <ProductGrid products={[]} addedIds={addedIds} onAddToCart={handleAddToCart} isLoading />
              ) : finalCount === 0 ? (
                <div className="text-center py-20">
                  <p className="text-sm text-[var(--text-muted)]">{t('products.noResults')}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">Try removing some filters or search with different keywords.</p>
                  <button onClick={clearFilters} className="mt-4 text-xs font-bold text-[var(--accent-primary)] hover:text-[var(--accent-gold)] bg-transparent border border-[var(--border)] px-4 py-2 rounded-lg cursor-pointer">
                    {t('products.clearFilters')}
                  </button>
                </div>
              ) : (
                <>
                  <ProductGrid products={paginatedProducts} addedIds={addedIds} onAddToCart={handleAddToCart} />
                  <ProductPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  )
}
