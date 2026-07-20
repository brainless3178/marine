import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, Clock, Package, Anchor, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAddToCart } from '../hooks/useAddToCart'
import { SEO } from '../components/seo/SEO'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { useApi } from '../hooks/useApi'
import { storefront } from '../lib/api'
import { apiProductsToFrontend } from '../lib/adapters'
import { products as staticProducts } from '../data/products'
import { Hero } from '../components/sections/Hero'
import { StatsBar } from '../components/sections/StatsBar'
import { CategoriesGrid } from '../components/sections/CategoriesGrid'
import { HowItWorks } from '../components/sections/HowItWorks'
import { IndustriesTabs } from '../components/sections/IndustriesTabs'
import { BrandsMarquee } from '../components/sections/BrandsMarquee'
import { RFQSection } from '../components/sections/RFQSection'
import { Testimonials } from '../components/sections/Testimonials'
import { SectionLabel } from '../components/ui/SectionLabel'
import { ProductCard } from '../components/ui/ProductCard'

export default function Home() {
  const { t } = useTranslation()
  const { handleAddToCart, addedIds } = useAddToCart()
  const { whatsappNumber } = useStoreSettings()

  // Fetch new arrivals from backend API; fall back to static data if backend is unavailable
  const { data: apiNewArrivals, loading } = useApi(
    async () => {
      const res = await storefront.products.newArrivals()
      return apiProductsToFrontend(res.products)
    },
    [],
  )

  // Use API data if available, otherwise fall back to static products marked as new arrivals
  const staticNewArrivals = staticProducts.filter(p => p.isNewArrival).slice(0, 8)
  const displayProducts = loading
    ? []
    : (apiNewArrivals && apiNewArrivals.length > 0 
        ? apiNewArrivals.slice(0, 8) 
        : staticNewArrivals.length > 0 ? staticNewArrivals : staticProducts.slice(0, 8))

  return (
    <>
      <SEO
        title="Marine & Industrial Equipment Supplier"
        description="Alka Traders — global supplier of marine spares, ship machinery, electrical automation, hydraulics, and emergency procurement. Serving Singapore, Dubai, Rotterdam, Mumbai."
        canonical="/"
      />
      <Hero />

      {/* ── SHIPPING BADGES ── */}
      <section className="py-8 bg-[var(--navy-deep)] border-b border-white/10" aria-label="Shipping and service guarantees">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, label: t('topbar.freeShipping'), desc: t('topbar.freeShippingSub') },
              { icon: Clock, label: t('topbar.timelyDelivery'), desc: t('topbar.timelyDeliverySub') },
              { icon: ShieldCheck, label: t('topbar.securePayment'), desc: t('topbar.securePaymentSub') },
              { icon: Package, label: t('topbar.easyReturns'), desc: t('topbar.easyReturnsSub') },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-gold)]/[0.1] flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-[var(--accent-gold)]" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-white">{item.label}</span>
                    <span className="text-xs text-white/60">{item.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section className="py-20 marine-section" aria-labelledby="new-arrivals-heading">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">
            <div>
              <SectionLabel>{t('shop.newArrivals')}</SectionLabel>
              <h2 id="new-arrivals-heading" className="font-display font-bold text-section tracking-tight text-[var(--text-primary)]">
                {t('shop.freshInventory')}
              </h2>
              <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-[var(--text-secondary)]">
                Ship-ready spares, tested surplus, and hard-to-find equipment presented for fast buying decisions.
              </p>
              <div className="gold-accent-bar mt-4" />
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold border-2 border-[var(--accent-blue)] text-[var(--accent-blue)] px-6 py-3 rounded-xl hover:bg-[var(--accent-blue)] hover:text-[var(--btn-blue-text)] transition-all duration-300 no-underline"
            >
              {t('shop.cta')} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                added={addedIds.has(product.id)}
                t={t}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--secondary-bg)] py-16">
        <div className="mx-auto grid max-w-[1280px] gap-5 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--gold-muted)] text-[var(--accent-gold)]">
              <Anchor size={24} />
            </div>
            <h2 className="font-display text-display-lg font-bold tracking-tight text-[var(--text-primary)]">
              Built for marine buyers who cannot wait.
            </h2>
            <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-[var(--text-secondary)]">
              Clear stock status, direct WhatsApp quote paths, verified condition labels, and RFQ-first buying make the store feel practical for vessel owners, shipyards, and maintenance teams.
            </p>
          </div>
          <div className="rounded-[28px] bg-[var(--navy-deep)] p-8 text-white shadow-[var(--shadow-soft)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--accent-gold)]">Fast procurement lane</p>
            <h3 className="mt-3 font-display text-3xl font-bold leading-tight">Need a rare spare?</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/68">Send part number, photo, or vessel details. The CTA now stays visible and buyer-friendly.</p>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent-gold)] px-5 py-3 text-xs font-black uppercase tracking-[0.1em] text-[var(--navy-deep)] no-underline hover:bg-[var(--gold-light)]">
              <MessageCircle size={16} /> WhatsApp RFQ
            </a>
          </div>
        </div>
      </section>

      <StatsBar />
      <CategoriesGrid />
      <HowItWorks />
      <IndustriesTabs />
      <BrandsMarquee />
      <RFQSection />
      <Testimonials />
    </>
  )
}
