import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Ship, Anchor, Flame, Zap, Factory, FlaskConical } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { storefront } from '../lib/api'
import { industries as staticIndustries } from '../data/industries'
import { SEO } from '../components/seo/SEO'
import { BreadcrumbJsonLd } from '../components/seo/BreadcrumbJsonLd'
import type { Industry } from '../types'

const iconMap: Record<string, LucideIcon> = {
  Ship, Anchor, Flame, Zap, Factory, FlaskConical,
}

export default function Industries() {
  const { t } = useTranslation()
  const [industries, setIndustries] = useState<Industry[]>([])

  useEffect(() => {
    let cancelled = false
    storefront.industries.list().then((res) => {
      if (!cancelled && res.industries?.length) {
        setIndustries(res.industries.map((i: any) => ({
          id: i.slug || i.id,
          name: i.name,
          icon: i.icon || 'Ship',
          description: i.description || '',
          painPoints: i.painPoints || [],
          productCount: i._count?.products ?? i.productCount ?? 0,
        })))
      } else if (!cancelled) {
        // Fall back to static industries if API returns empty
        setIndustries(staticIndustries)
      }
    }).catch(() => {
      // Fall back to static industries if API is unavailable
      if (!cancelled) setIndustries(staticIndustries)
    })
    return () => { cancelled = true }
  }, [])

  const [active, setActive] = useState('')

  // Set active to first industry once data loads
  useEffect(() => {
    if (industries.length > 0 && !active) setActive(industries[0].id)
  }, [industries, active])

  const current = industries.find((i) => i.id === active) || industries[0]
  const Icon = current ? (iconMap[current.icon] || Ship) : Ship

  return (
    <div>
      <SEO
        title="Industries Served — Marine, Oil & Gas, Power Generation"
        description="Alka Traders serves marine shipping, oil and gas, power generation, manufacturing, chemical processing, shipbuilding, and mining industries with specialized equipment."
        canonical="/industries"
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Industries', url: '/industries' }]} />
      <section className="py-20 bg-[var(--secondary-bg)] text-center">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <span className="inline-block font-body font-medium text-xs tracking-[3px] uppercase text-[var(--text-muted)] mb-4">
            {t('industries.label')}
          </span>
          <h1 className="font-display font-bold text-display-xl tracking-tight">
            {t('industries.title')}
          </h1>
          <p className="text-body text-[var(--text-secondary)] max-w-[640px] mx-auto mt-4">
            {t('industries.sub')}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          {industries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--text-muted)]">Loading industries...</p>
            </div>
          ) : (
          <>
          <div className="flex gap-2 flex-wrap mb-8">
            {industries.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setActive(ind.id)}
                aria-label={`View ${ind.name} industry details`}
                aria-pressed={active === ind.id}
                className={`px-5 py-2.5 font-body font-medium text-xs border transition-all duration-300 ${
                  active === ind.id
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--btn-blue-text)] rounded-xl'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] rounded-xl'
                }`}
              >
                {ind.name}
              </button>
            ))}
          </div>

          <div className="bg-[var(--secondary-bg)] border border-[var(--border)] border-l-[3px] border-l-[var(--accent-primary)] p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="text-5xl text-[var(--accent-primary)] flex-shrink-0">
                <Icon size={48} />
              </div>
              <div>
                <h2 className="heading-xl mb-4">{current.name}</h2>
                <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed mb-6">{current.description}</p>
                <h3 className="text-label mb-3">{t('industries.keyChallenges')}</h3>
                <ul className="flex flex-col gap-2 mb-6">
                  {current.painPoints.map((pp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-[var(--accent-primary)] mt-0.5">→</span>
                      {pp}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/products?industry=${current.id}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold border border-[var(--accent-primary)] text-[var(--accent-primary)] px-[18px] py-[10px] hover:bg-[var(--accent-primary)]/10 transition-all no-underline rounded-xl"
                >
                  {t('industries.viewProducts')} <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </section>
    </div>
  )
}
