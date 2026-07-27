import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, ShoppingCart, Check, SlidersHorizontal, X as XIcon } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useProducts } from '../hooks/useProducts'
import { useAddToCart } from '../hooks/useAddToCart'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { storefront } from '../lib/api'
import { isLightColor, getProductImageUrl } from '../lib/utils'
import { SEO } from '../components/seo/SEO'
import { BreadcrumbJsonLd } from '../components/seo/BreadcrumbJsonLd'
import { apiProductsToFrontend } from '../lib/adapters'
import { products as staticProducts } from '../data/products'
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

  // Fetch products from API with fallback to static catalog
  const [apiProducts, setApiProducts] = useState<Product[]>([])
  const [apiLoaded, setApiLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await storefront.products.list()
        if (!cancelled && res.products?.length > 0) {
          setApiProducts(apiProductsToFrontend(res.products))
          setApiLoaded(true)
          return
        }
      } catch {
        // API unavailable — fallback to static catalog
      }
      if (!cancelled) {
        setApiProducts(staticProducts)
        setApiLoaded(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const { products: allProducts, filteredCount } = useProducts(apiProducts)
  const finalProducts = apiLoaded ? allProducts : []
  const finalCount = apiLoaded ? filteredCount : 0

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
            {/* Mobile filter toggle */}
            <div className="lg:hidden flex justify-between items-center mb-2">
              <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">
                {finalCount} {finalCount === 1 ? t('products.product') : t('products.products')}
              </span>
              <button
                onClick={() => setShowFiltersMobile((v) => !v)}
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
                    <label key={cat.id} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer"
                      />
                      <span className="flex-1">{cat.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{cat.count}</span>
                    </label>
                  ))}
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-3">
                    {t('products.priceRange')}
                  </span>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={1000} value={localMinPrice} onChange={(e) => setLocalMinPrice(e.target.value)} onBlur={applyPriceFilter} onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()} placeholder={t('products.priceMin')} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)]" />
                    <span className="text-[var(--text-muted)] text-xs">—</span>
                    <input type="number" min={0} max={1000} value={localMaxPrice} onChange={(e) => setLocalMaxPrice(e.target.value)} onBlur={applyPriceFilter} onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()} placeholder={t('products.priceMax')} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)]" />
                  </div>
                  <button onClick={applyPriceFilter} className="w-full mt-2 py-2 text-xs font-bold text-[var(--accent-primary)] hover:text-[var(--accent-gold)] transition-colors bg-transparent border border-[var(--border)] rounded-lg">
                    {t('products.applyPrice')}
                  </button>
                </div>

                {/* On Sale Filter */}
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5">
                    <input type="checkbox" checked={showOnSale} onChange={() => setShowOnSale(!showOnSale)} className="accent-[var(--accent-gold)] w-4 h-4 cursor-pointer" />
                    <span className="font-bold text-[var(--danger)]">{t('products.onSaleOnly')}</span>
                  </label>
                </div>

                {/* Brands */}
                <div className="mb-6">
                  <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-3">
                    {t('products.brand')}
                  </span>
                  {derivedBrands.map((brand) => (
                      <label key={brand.slug} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5">
                        <input type="checkbox" checked={selectedBrands.includes(brand.slug)} onChange={() => toggleBrand(brand.slug)} className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer" />
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
                    <input type="radio" name="urgency" checked={urgencyFilter === 'all'} onChange={() => setUrgencyFilter('all')} className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer" />
                    {t('products.allItems')}
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors min-h-[44px] py-2.5">
                    <input type="radio" name="urgency" checked={urgencyFilter === 'emergency'} onChange={() => setUrgencyFilter('emergency')} className="accent-[var(--accent-primary)] w-4 h-4 cursor-pointer" />
                    {t('products.emergencyAvailable')}
                  </label>
                </div>

                <button onClick={clearFilters} className="w-full text-right text-xs font-bold text-[var(--accent-primary)] hover:text-[var(--accent-gold)] transition-colors bg-transparent border-none cursor-pointer py-2">
                  {t('products.clearFilters')}
                </button>
              </div>
            </aside>

            {/* Main content */}
            <main>
              {/* Active filter chips */}
              {(searchQuery || selectedCategories.length > 0 || selectedBrands.length > 0 || showOnSale || urgencyFilter === 'emergency') && (
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
                <div className="text-center py-20">
                  <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent animate-spin mx-auto mb-4" />
                  <p className="text-sm text-[var(--text-muted)]">Loading products...</p>
                </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginatedProducts.map((product) => {
                    const effPrice = product.onSale && product.salePrice ? product.salePrice : product.price
                    return (
                      <div key={product.id} className="commerce-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-primary)] group">
                        <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[var(--surface-soft)]">
                            <OptimizedImage
                            src={getProductImageUrl(product.filename)}
                            alt={product.name}
                            width={400}
                            height={400}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="w-full aspect-square object-cover border-b border-[var(--border)] transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => { const img = e.target as HTMLImageElement; img.src = '/images/placeholder.jpg'; img.onerror = null; }}
                          />
                          {product.customLabel && (
                            <span className="absolute top-2 left-2 z-10 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded" style={{ backgroundColor: product.customLabelColor || '#159a67', color: isLightColor(product.customLabelColor || '#159a67') ? '#1a1a1a' : '#ffffff' }}>
                              {product.customLabel}
                            </span>
                          )}
                          {product.availability === 'emergency' && (
                            <span className="absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-mono border border-[var(--danger)]/20 text-[var(--danger)] bg-white">{t('product.emergency')}</span>
                          )}
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold text-sm bg-black/70 px-4 py-2 rounded-lg">{t('product.outOfStock')}</span>
                            </div>
                          )}
                        </Link>
                        <div className="p-4">
                          <span className="inline-block font-mono text-xs px-2 py-1 rounded-full border text-[var(--accent-primary)] border-[var(--accent-primary)]/15 bg-[var(--accent-primary)]/5 mb-2">{product.brand}</span>
                          <h4 className="text-label leading-tight hover:text-[var(--accent-primary)] transition-colors min-h-[40px]">
                            <Link to={`/product/${product.id}`}>{product.name}</Link>
                          </h4>
                          <span className="font-mono text-xs text-[var(--text-muted)] block mt-1">{t('product.skuPrefix', { sku: product.sku })}</span>
                          <div className="mt-3 flex items-end justify-between gap-2">
                            <div>
                              {product.onSale && product.salePrice ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-bold text-xl tracking-tight tabular-nums text-[var(--danger)]">${product.salePrice.toFixed(2)}</span>
                                  <span className="font-display font-bold text-sm text-[var(--text-muted)] line-through">${product.price.toFixed(2)}</span>
                                </div>
                              ) : (
                                <span className="font-display font-bold text-xl tracking-tight tabular-nums text-[var(--text-primary)]">${effPrice.toFixed(2)}</span>
                              )}
                            </div>
                            <span className={`text-xs font-bold ${product.inStock ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                              {product.inStock ? t('product.inStockCount', { count: product.stockCount }) : t('product.outOfStockCount')}
                            </span>
                          </div>
                          <button
                            onClick={() => { if (!product.inStock) return; handleAddToCart(product) }}
                            disabled={!product.inStock}
                            className={`inline-flex items-center justify-center w-full gap-2 text-xs font-bold px-[18px] py-[11px] mt-3 transition-all duration-300 border cursor-pointer rounded-lg ${!product.inStock ? 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-muted)] cursor-not-allowed' : addedIds.has(product.id) ? 'border-[var(--success)] bg-[var(--success)] text-[var(--btn-success-text)]' : 'commerce-button'}`}
                          >
                            {!product.inStock ? t('product.outOfStock') : addedIds.has(product.id) ? <><Check size={14} /> {t('product.added')}</> : <><ShoppingCart size={14} /> {t('product.addToCart')}</>}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-2 text-xs font-bold border border-[var(--border)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent-primary)] transition-colors bg-[var(--surface)] text-[var(--text-primary)]">← Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2).reduce<(number | string)[]>((acc, p, i, arr) => { if (i > 0 && (arr[i - 1] as number) < p - 1) acc.push('...'); acc.push(p); return acc }, []).map((p, i) =>
                      typeof p === 'string' ? <span key={`dots-${i}`} className="px-1 text-xs text-[var(--text-muted)]">…</span> : (
                        <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${p === currentPage ? 'bg-[var(--accent-primary)] text-white border border-[var(--accent-primary)]' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'}`}>{p}</button>
                      )
                    )}
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-2 text-xs font-bold border border-[var(--border)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent-primary)] transition-colors bg-[var(--surface)] text-[var(--text-primary)]">Next →</button>
                  </div>
                )}
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  )
}
