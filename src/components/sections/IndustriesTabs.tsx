import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionLabel } from '../ui/SectionLabel'
import { storefront } from '../../lib/api'
import { Ship, Anchor, Flame, Zap, Factory, FlaskConical, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Ship, Anchor, Flame, Zap, Factory, FlaskConical,
}

interface IndustryItem { id: string; name: string; icon: string; description: string; painPoints: string[] }

export function IndustriesTabs() {
  const { t } = useTranslation()
  const [industries, setIndustries] = useState<IndustryItem[]>([])
  const [active, setActive] = useState('')

  useEffect(() => {
    let cancelled = false
    storefront.industries.list()
      .then((res) => {
        if (!cancelled && res.industries?.length) {
          const mapped = res.industries.map((i: any) => ({
            id: i.slug || i.id, name: i.name, icon: i.icon || 'Ship',
            description: i.description || '', painPoints: i.painPoints || [],
          }))
          setIndustries(mapped)
          if (!active) setActive(mapped[0].id)
        }
      })
      .catch(() => { /* API unavailable */ })
    return () => { cancelled = true }
  }, [])

  const current = industries.find((i) => i.id === active) || industries[0]
  const Icon = current ? (iconMap[current.icon] || Ship) : Ship

  return (
    <section className="py-28 bg-[var(--primary-bg)]" id="industries">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <SectionLabel>{t('industries.label')}</SectionLabel>
        <h2 className="font-display font-bold text-section tracking-tight mb-12">
          {t('industries.title')}
        </h2>
        <div className="gold-accent-bar mt-0 mb-12" />

        {industries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--text-muted)]">Loading industries...</p>
          </div>
        ) : (
        <>
        {/* Tab buttons */}
        <div className="flex gap-2.5 overflow-x-auto flex-nowrap md:flex-wrap mb-10 -mx-6 px-6 md:mx-0 md:px-0 pb-2 scrollbar-none">
          {industries.map((ind) => {
            const isActive = active === ind.id
            return (
              <button
                key={ind.id}
                onClick={() => setActive(ind.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-xl font-body font-semibold text-xs tracking-wide transition-all duration-300 border ${
                  isActive
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-[0_4px_16px_var(--focus-ring)]'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {ind.name}
              </button>
            )
          })}
        </div>

        {/* Active panel */}
        <div className="flex gap-10 p-9 bg-[var(--surface)] border border-[var(--border)] rounded-2xl border-l-[4px] border-l-[var(--accent-primary)] shadow-[var(--shadow-card)]">
          <div className="hidden md:flex items-start text-[var(--accent-primary)] flex-shrink-0 mt-1">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/[0.1] flex items-center justify-center">
              <Icon size={32} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="heading-xl mb-3 text-[var(--text-primary)]">{current.name}</h3>
            <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed mb-5">{current.description}</p>
            <div className="flex gap-2.5 flex-wrap mb-6">
              {current.painPoints.slice(0, 3).map((pp, i) => (
                <span key={i} className="px-3.5 py-1.5 text-xs font-mono border border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-soft)] rounded-lg">
                  {pp.split(' ').slice(0, 3).join(' ')}…
                </span>
              ))}
            </div>
            <a
              href={`/products?industry=${current.id}`}
              className="inline-flex items-center gap-2 text-xs font-bold border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] px-5 py-2.5 rounded-xl hover:bg-[var(--accent-primary)] hover:text-white transition-all duration-300 no-underline"
            >
              {t('industries.viewProducts')} <ArrowRight size={14} />
            </a>
          </div>
        </div>
        </>
        )}
      </div>
    </section>
  )
}
