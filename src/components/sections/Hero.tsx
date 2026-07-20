import { useState, useEffect, useMemo, useRef, useCallback, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { FileText, ArrowRight, ShieldCheck, Truck, SearchCheck, ChevronRight, Search } from 'lucide-react'
import { storefront } from '../../lib/api'
import { apiProductsToFrontend } from '../../lib/adapters'
import { HeroProductMarquee } from './HeroProductMarquee'
import { OptimizedImage } from '../ui/OptimizedImage'
import type { Product } from '../../types'

export function Hero() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 })
  const [activeIndex, setActiveIndex] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heroProducts, setHeroProducts] = useState<Product[]>([])

  // Fetch products from API
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await storefront.products.list({ limit: '16' })
        if (!cancelled && res.products?.length) {
          setHeroProducts(apiProductsToFrontend(res.products).slice(0, 16))
        }
      } catch {
        // API unavailable — leave empty
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const marqueeRow1 = useMemo(() => heroProducts.slice(0, 8), [heroProducts])
  const marqueeRow2 = useMemo(() => heroProducts.slice(8, 16).length ? heroProducts.slice(8, 16) : heroProducts, [heroProducts])
  const rotatingNames = useMemo(() => heroProducts.map((p) => p.name), [heroProducts])

  const clearBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearBlurTimeout()
  }, [clearBlurTimeout])

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (query.length < 2) return []
    return heroProducts
      .filter((product) => {
        const category = product.category.replace(/-/g, ' ')
        return (
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query)
        )
      })
      .slice(0, 6)
  }, [searchQuery, heroProducts])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (rotatingNames.length === 0) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % rotatingNames.length)
      setAnimKey((k) => k + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [rotatingNames.length])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSuggestionIndex((i) => Math.min(i + 1, searchSuggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSuggestionIndex((i) => Math.max(i - 1, -1))
    } else if (event.key === 'Enter' && suggestionIndex >= 0) {
      event.preventDefault()
      const product = searchSuggestions[suggestionIndex]
      if (product) {
        clearBlurTimeout()
        navigate(`/product/${product.id}`)
      }
    } else if (event.key === 'Escape') {
      setSearchFocused(false)
    }
  }

  const showSuggestions = searchFocused && searchSuggestions.length > 0

  // Recalculate dropdown position on scroll/resize instead of closing it
  const recalcDropdown = useCallback(() => {
    if (!searchContainerRef.current) return
    const rect = searchContainerRef.current.getBoundingClientRect()
    // Close if the search input scrolled out of view
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setSearchFocused(false)
      return
    }
    setDropdownStyle({
      position: 'fixed',
      top: `${rect.bottom + 10}px`,
      left: `${rect.left}px`,
      right: `${window.innerWidth - rect.right}px`,
    })
  }, [])

  useEffect(() => {
    if (showSuggestions) recalcDropdown()
  }, [showSuggestions, searchQuery, recalcDropdown])

  useEffect(() => {
    if (!showSuggestions) return
    window.addEventListener('scroll', recalcDropdown, { passive: true })
    window.addEventListener('resize', recalcDropdown, { passive: true })
    return () => {
      window.removeEventListener('scroll', recalcDropdown)
      window.removeEventListener('resize', recalcDropdown)
    }
  }, [showSuggestions, recalcDropdown])

  return (
    <section className="relative flex flex-col overflow-hidden hero-maritime-bg text-white">
      <div className="absolute top-0 right-0 w-[min(520px,80vw)] h-[min(520px,80vw)] rounded-full bg-[var(--accent-gold)]/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[min(420px,70vw)] h-[min(420px,70vw)] rounded-full bg-[var(--accent-teal)]/[0.04] blur-[100px] pointer-events-none" />

      <div
        ref={ref}
        className="relative z-10 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-10 lg:py-12"
      >
        <div className="grid lg:grid-cols-[1.08fr_0.72fr] gap-8 lg:gap-10 items-center">
          {/* Left Column */}
          <div>
            <span
              className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] type-overline text-white/70 mb-4 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-pulse" />
              {t('hero.label')}
            </span>

            <h1
              className={`font-display text-[clamp(40px,5.5vw,68px)] font-bold leading-[1.0] tracking-[-0.025em] transition-all duration-700 delay-100 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <span className="block text-white">{t('hero.headline')}</span>
              <span
                key={animKey}
                className="block maritime-gradient-text animate-word-cycle min-h-[1.1em]"
              >
                {rotatingNames[activeIndex] || '...'}
              </span>
              <span className="block text-white">{t('hero.headlineSuffix')}</span>
            </h1>

            <p
              className={`text-base sm:text-lg leading-relaxed text-white/68 max-w-[620px] mt-4 transition-all duration-700 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              {t('hero.sub')}
            </p>

            <form
              onSubmit={handleSearch}
              className={`relative z-40 mt-6 max-w-[680px] transition-all duration-700 delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-2 shadow-[0_22px_60px_var(--shadow-medium)] backdrop-blur sm:flex-row">
                <label htmlFor="hero-product-search" className="sr-only">
                  {t('hero.searchLabel', { defaultValue: 'Search products' })}
                </label>
                <div ref={searchContainerRef} className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/65" />
                  <input
                    id="hero-product-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => { setSearchQuery(event.target.value); setSuggestionIndex(-1) }}
                    onFocus={() => { clearBlurTimeout(); setSearchFocused(true) }}
                    onBlur={() => { blurTimeoutRef.current = setTimeout(() => setSearchFocused(false), 120) }}
                    placeholder={t('hero.searchPlaceholder', { defaultValue: 'Search product, brand, SKU, part number...' })}
                    onKeyDown={handleSearchKeyDown}
                    aria-label={t('hero.searchPlaceholder', { defaultValue: 'Search product, brand, SKU, part number...' })}
                    aria-expanded={showSuggestions}
                    aria-activedescendant={suggestionIndex >= 0 ? `suggestion-${suggestionIndex}` : undefined}
                    aria-controls="hero-suggestions"
                    role="combobox"
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white pl-11 pr-4 text-sm font-semibold text-[var(--navy-deep)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.25)]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent-gold)] px-5 text-sm font-black text-[var(--navy-deep)] transition hover:bg-[var(--gold-light)]"
                >
                  <Search size={16} />
                  {t('hero.searchButton', { defaultValue: 'Search' })}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['ABB', 'Hydraulic Pump', 'Marine GPS'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => { setSearchQuery(term); navigate(`/products?search=${encodeURIComponent(term)}`) }}
                    className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-white/65 transition hover:border-[var(--accent-gold)]/40 hover:text-[var(--accent-gold)]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>

            {showSuggestions && (
              <div
                id="hero-suggestions"
                style={dropdownStyle}
                role="listbox"
                className="fixed z-[100] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_24px_70px_var(--shadow-heavy)]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="border-b border-[var(--border)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Product suggestions
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {searchSuggestions.map((product) => {
                    const effectivePrice = product.onSale && product.salePrice ? product.salePrice : product.price
                    return (
                      <button
                        key={product.id}
                        id={`suggestion-${searchSuggestions.indexOf(product)}`}
                        type="button"
                        role="option"
                        aria-selected={searchSuggestions.indexOf(product) === suggestionIndex}
                        onMouseDown={(event) => { event.preventDefault(); clearBlurTimeout(); navigate(`/product/${product.id}`) }}
                        className={`grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-left transition last:border-b-0 ${searchSuggestions.indexOf(product) === suggestionIndex ? 'bg-[var(--surface-soft)]' : 'hover:bg-[var(--primary-bg)]'}`}
                      >
                        <span className="h-14 w-14 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]">
                          <OptimizedImage src={`/images/${product.filename}`} alt={product.name} width={56} height={56} sizes="56px" className="h-full w-full object-cover" onError={(event) => { const img = event.target as HTMLImageElement; img.src = '/images/placeholder.avif'; img.onerror = null; }} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-[var(--text-primary)]">{product.name}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span className="font-bold text-[var(--text-secondary)]">{product.brand}</span>
                            <span>{product.sku}</span>
                            <span className="capitalize">{product.category.replace(/-/g, ' ')}</span>
                          </span>
                        </span>
                        <span className="hidden text-right sm:block">
                          <span className="block font-display text-lg font-black text-[var(--brick-ember)]">${effectivePrice.toFixed(2)}</span>
                          <span className={`text-[11px] font-bold ${product.inStock ? 'text-success' : 'text-danger'}`}>
                            {product.inStock ? `${product.stockCount} in stock` : 'Out of stock'}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onMouseDown={(event) => { event.preventDefault(); clearBlurTimeout(); const query = searchQuery.trim(); navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products') }}
                  className="flex w-full items-center justify-between bg-[var(--navy-deep)] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[var(--navy-mid)]"
                >
                  View all results for &quot;{searchQuery.trim()}&quot;
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <div
              className={`relative z-10 flex gap-4 mt-5 flex-wrap transition-all duration-700 delay-[360ms] ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <a href="/rfq" className="inline-flex items-center gap-2.5 maritime-btn-primary no-underline group">
                <FileText size={16} />
                {t('hero.ctaRfq')}
                <ChevronRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="/products" className="inline-flex items-center gap-2.5 maritime-btn-secondary no-underline">
                {t('hero.ctaProducts')}
                <ArrowRight size={14} />
              </a>
            </div>

            <div
              className={`relative z-10 mt-6 grid sm:grid-cols-3 gap-3 max-w-[640px] transition-all duration-700 delay-400 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              {[
                { icon: ShieldCheck, label: t('hero.trustVerified') },
                { icon: Truck, label: t('hero.trustExport') },
                { icon: SearchCheck, label: t('hero.trustRare') },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <span key={item.label} className="flex items-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white/70 backdrop-blur-sm hover:border-[var(--accent-gold)]/30 transition-all duration-300">
                    <Icon size={17} className="text-[var(--accent-gold)] flex-shrink-0" />
                    {item.label}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Right Column */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[var(--accent-gold)]/10 via-transparent to-[var(--accent-teal)]/5 rounded-3xl blur-xl pointer-events-none" />
              <div className="relative glass-card p-4 shadow-[0_32px_80px_var(--shadow-heavy)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="type-mono text-xs uppercase tracking-widest text-white/68">{t('hero.liveInventory')}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="rounded-full bg-success/15 px-3 py-1 text-overline text-success border border-success/20">{t('hero.inStock')}</span>
                  </div>
                </div>
                <div key={`spot-${animKey}`} className="animate-word-cycle">
                  <div className="w-full aspect-[5/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-4">
                    <OptimizedImage
                      src={`/images/${heroProducts[activeIndex]?.filename || 'placeholder.png'}`}
                      alt={rotatingNames[activeIndex] || ''}
                      loading="eager"
                      width={600}
                      height={480}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="w-full h-full object-cover"
                      onError={(e) => { const img = e.target as HTMLImageElement; img.src = '/images/placeholder.avif'; img.onerror = null; }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block font-mono text-xs px-2.5 py-1 rounded-full border border-white/15 text-white/60 bg-white/[0.04]">{heroProducts[activeIndex]?.brand}</span>
                    <span className="font-mono text-xs text-white/60">{t('product.skuPrefix', { sku: heroProducts[activeIndex]?.sku || '' })}</span>
                  </div>
                  <h3 className="heading-lg text-white mt-1">{rotatingNames[activeIndex]}</h3>
                </div>
                <a href="/rfq" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-[var(--navy-deep)] px-5 py-3.5 text-label font-bold hover:bg-white/90 transition-all duration-300 no-underline">
                  {t('hero.requestQuote')}
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom product marquees */}
      <div className="relative z-10 w-full pb-4 pt-3 border-t border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between">
          <span className="type-mono text-xs uppercase tracking-widest text-white/68">{t('hero.newArrivals')}</span>
          <a href="/products" className="type-mono text-xs uppercase tracking-wider text-white/60 hover:text-[var(--accent-gold)] transition-colors no-underline flex items-center gap-1">
            {t('hero.viewAll')} <ArrowRight size={12} />
          </a>
        </div>
        <HeroProductMarquee products={marqueeRow1} direction="left" />
        <div className="hidden md:block">
          <HeroProductMarquee products={marqueeRow2} direction="right" speed="slow" />
        </div>
      </div>
    </section>
  )
}
