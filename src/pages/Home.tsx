import { Link } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ArrowRight, Truck, ShieldCheck, Clock, Package, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAddToCart } from '../hooks/useAddToCart'
import { SEO } from '../components/seo/SEO'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { useNewArrivals } from '../hooks/useApiQuery'
import { apiProductsToFrontend } from '../lib/adapters'
import { products as staticProducts } from '../data/products'
import { Hero } from '../components/sections/Hero'
import { ShopByCategory } from '../components/sections/ShopByCategory'
const StatsBar = lazy(() => import('../components/sections/StatsBar').then(m => ({ default: m.StatsBar })))
const CategoriesGrid = lazy(() => import('../components/sections/CategoriesGrid').then(m => ({ default: m.CategoriesGrid })))
const HowItWorks = lazy(() => import('../components/sections/HowItWorks').then(m => ({ default: m.HowItWorks })))
const IndustriesTabs = lazy(() => import('../components/sections/IndustriesTabs').then(m => ({ default: m.IndustriesTabs })))
const BrandsMarquee = lazy(() => import('../components/sections/BrandsMarquee').then(m => ({ default: m.BrandsMarquee })))
const RFQSection = lazy(() => import('../components/sections/RFQSection').then(m => ({ default: m.RFQSection })))
const Testimonials = lazy(() => import('../components/sections/Testimonials').then(m => ({ default: m.Testimonials })))
import { SectionLabel } from '../components/ui/SectionLabel'
import { ProductCard } from '../components/ui/ProductCard'

export default function Home() {
  const { t } = useTranslation()
  const { handleAddToCart, addedIds } = useAddToCart()
  const { whatsappNumber } = useStoreSettings()

  // Fetch new arrivals from backend API; fall back to static data if backend is unavailable
  const { data: newArrivalsData, isLoading } = useNewArrivals()

  const apiNewArrivals = newArrivalsData?.products ? apiProductsToFrontend(newArrivalsData.products) : null

  // Use API data if available, otherwise fall back to static products marked as new arrivals
  const staticNewArrivals = staticProducts.filter(p => p.isNewArrival).slice(0, 8)
  const displayProducts = isLoading
    ? []
    : (apiNewArrivals && apiNewArrivals.length > 0 
        ? apiNewArrivals.slice(0, 8) 
        : staticNewArrivals.length > 0 ? staticNewArrivals : staticProducts.slice(0, 8))

  return (
    <>
      <SEO
        title="Marine Spare Parts Supplier in India | Ship Spares from Bhavnagar"
        description="Alka Traders supplies tested marine spare parts, ship automation, engine spares, hydraulic pumps, electrical drives, and surplus industrial equipment from Bhavnagar, India."
        canonical="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Alka Traders',
            url: 'https://alkatraders.co',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://alkatraders.co/products?search={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What marine spare parts does Alka Traders supply?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Alka Traders supplies ship automation parts, marine engine spares, hydraulic pumps and motors, navigation equipment, electrical drives, marine pumps, rigging, lifting gear, and surplus industrial machinery.',
                },
              },
              {
                '@type': 'Question',
                name: 'Where are Alka Traders marine parts shipped from?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Most export orders are coordinated from Bhavnagar, Gujarat, India, near the Alang marine equipment and ship recycling market, with courier, air freight, and sea freight options.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I request a quote with only a part number or nameplate photo?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Buyers can send a part number, maker name, model, serial plate photo, or product description through the RFQ form, email, or WhatsApp.',
                },
              },
            ],
          },
        ]}
      />
      <Hero />

      <ShopByCategory />

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
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/[0.1] flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-[var(--accent-primary)]" />
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
                Ready-to-quote ship spares, tested surplus machinery, and hard-to-find automation parts for urgent vessel and plant maintenance.
              </p>
              <div className="gold-accent-bar mt-4" />
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] px-6 py-3 rounded-xl hover:bg-[var(--accent-primary)] hover:text-white transition-all duration-300 no-underline"
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
            <img
              src="/images/alka-traders-logo.jpeg"
              alt="Alka Traders Logo"
              className="h-12 w-12 rounded-2xl object-cover shadow-sm mb-5"
            />
            <h2 className="font-display text-display-lg font-bold tracking-tight text-[var(--text-primary)]">
              Ship spares sourcing for buyers who cannot wait.
            </h2>
            <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-[var(--text-secondary)]">
              Send a maker, model, part number, serial plate, or product photo. Our team checks availability, condition, compatibility notes, export packing, and freight options before quoting.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
              <p><strong className="text-[var(--text-primary)]">Marine focus:</strong> ship automation, navigation, pumps, engine spares, rigging, and deck equipment.</p>
              <p><strong className="text-[var(--text-primary)]">Industrial focus:</strong> ABB, Siemens, Parker, Bosch Rexroth, Danfoss, Festo, SMC, and similar MRO components.</p>
              <p><strong className="text-[var(--text-primary)]">Condition clarity:</strong> new old stock, used, refurbished, and reconditioned items are labelled before dispatch.</p>
              <p><strong className="text-[var(--text-primary)]">Export support:</strong> DHL, FedEx, air freight, sea freight, and buyer-arranged shipping from India.</p>
            </div>
          </div>
          <div className="rounded-[28px] bg-[var(--navy-deep)] p-8 text-white shadow-[var(--shadow-soft)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--accent-primary)]">Urgent vessel procurement</p>
            <h3 className="mt-3 font-display text-3xl font-bold leading-tight">Need a rare ship spare?</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/68">Send the part number, photo, maker name, vessel details, and delivery port. We will confirm stock or source an alternative.</p>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-xs font-black uppercase tracking-[0.1em] text-white no-underline hover:bg-[var(--accent-primary-hover)]">
              <MessageCircle size={16} /> WhatsApp RFQ
            </a>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-40 flex items-center justify-center text-sm text-[var(--text-muted)]">Loading sections...</div>}>
        <StatsBar />
        <CategoriesGrid />
        <HowItWorks />
        <IndustriesTabs />
        <BrandsMarquee />
        <RFQSection />
        <Testimonials />
      </Suspense>
    </>
  )
}
