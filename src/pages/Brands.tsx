import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { brandImages } from '../data/brandImages'
import { brands as staticBrands } from '../data/brands'
import { storefront } from '../lib/api'
import { SEO } from '../components/seo/SEO'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import type { Brand } from '../types'

const filters = ['All', 'Marine', 'Industrial', 'Automation', 'Pneumatic'] as const

export default function Brands() {
  const { t } = useTranslation()
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const navigate = useNavigate()
  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {
    let cancelled = false
    storefront.brands.list().then((res) => {
      if (!cancelled && res.brands?.length) {
        setBrands(res.brands.map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          sectors: b.sectors || [],
          productCount: b._count?.products ?? b.productCount ?? 0,
          logo: b.logoUrl || undefined,
        })))
      } else if (!cancelled) {
        // Fall back to static brands if API returns empty
        setBrands(staticBrands)
      }
    }).catch(() => {
      // Fall back to static brands if API is unavailable
      if (!cancelled) setBrands(staticBrands)
    })
    return () => { cancelled = true }
  }, [])

  const filtered = activeFilter === 'All'
    ? brands
    : brands.filter((b) => b.sectors.includes(activeFilter))

  const marqueeRows = useMemo(() => {
    const chunkSize = Math.ceil(brandImages.length / 4)
    return [
      brandImages.slice(0, chunkSize),
      brandImages.slice(chunkSize, chunkSize * 2),
      brandImages.slice(chunkSize * 2, chunkSize * 3),
      brandImages.slice(chunkSize * 3),
    ]
  }, [])

  return (
    <div className="overflow-x-hidden">
      <SEO
        title="Brands — Marine & Industrial Equipment Suppliers"
        description="Explore the brands we work with — ABB, Siemens, Parker Hannifin, Bosch Rexroth, Danfoss, Honeywell, and 100+ more leading manufacturers."
        canonical="/brands"
      />
      {/* Hero Section */}
      <section className="py-20 bg-secondary-bg text-center">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-4">
            {t('brands.label')}
          </span>
          <h1 className="font-display font-bold text-display-xl tracking-tight">
            {t('brands.title')}
          </h1>
          <p className="text-body text-[var(--text-secondary)] max-w-[640px] mx-auto mt-4">
            {t('brands.sub')}
          </p>
        </div>
      </section>

      {/* Brand Image Showcase Marquee */}
      <section className="py-12 overflow-hidden bg-[var(--primary-bg)] border-y border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-6 text-center">
          <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--accent-gold)] mb-2">
            {brandImages.length}+ Brands We Work With
          </span>
          <h2 className="font-display font-bold text-display-lg tracking-tight">
            Brands We Deal In
          </h2>
          <p className="text-body-sm text-[var(--text-secondary)] max-w-[480px] mx-auto mt-2">
            Explore the Top Brands in Our Marine &amp; Industrial Collections
          </p>
        </div>

        <div className="space-y-4">
          {marqueeRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="relative overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
              }}
            >
              <div
                className="flex gap-4 w-max"
                style={{
                  animation: `marqueeLeft ${60 + rowIndex * 10}s linear infinite`,
                  animationDirection: rowIndex % 2 === 0 ? 'normal' : 'reverse',
                }}
              >
                {[...row, ...row].map((img, i) => (
                  <div
                    key={`${rowIndex}-${i}`}
                    className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-[var(--border)] bg-surface/50 hover:border-[var(--accent-gold)]/40 hover:shadow-lg transition-all duration-300 group"
                  >
                    <OptimizedImage
                      src={`/brand/${img}`}
                      alt={`${img.replace(/\.(avif|png|jpg|jpeg|webp)$/i, '').replace(/-/g, ' ')} brand logo`}
                      width={112}
                      height={112}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { const img = e.target as HTMLImageElement; img.src = '/images/placeholder.avif'; img.onerror = null; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Cards Section */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <h2 className="font-display font-bold text-section-lg tracking-tight mb-8 text-center">
            Our Partner Brands
          </h2>
          <div className="flex gap-2 flex-wrap mb-8 justify-center">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                aria-label={`Filter brands by ${f === 'All' ? 'all categories' : f}`}
                aria-pressed={activeFilter === f}
                className={`px-5 py-2.5 font-body font-medium text-xs border transition-all duration-300 ${
                  activeFilter === f
                    ? 'bg-accent-blue border-accent-blue text-[var(--text-primary)]'
                    : 'bg-surface border-[var(--border)] text-[var(--text-secondary)] hover:border-accent-blue hover:text-[var(--text-primary)]'
                }`}
              >
                {f === 'All' ? t('brands.all') : t(`brands.${f.toLowerCase()}`)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((brand) => (
              <div
                key={brand.id}
                onClick={() => navigate(`/products?brand=${brand.slug}`)}
                className="bg-secondary-bg border border-[var(--border)] border-l-[3px] border-l-transparent p-6 cursor-pointer transition-all duration-300 hover:border-l-accent-blue hover:-translate-y-1"
              >
                <h3 className="heading-xl mb-2">{brand.name}</h3>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {brand.sectors.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs font-mono border border-[var(--border)] text-[var(--text-muted)] bg-surface">
                      {s}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-xs text-accent-gold">{t('brands.productCount', { count: brand.productCount })}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
