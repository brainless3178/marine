import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { useCategories } from '../../hooks/useApiQuery'
import { SectionLabel } from '../ui/SectionLabel'
import { Ship, Zap, Droplet, Wind, Settings, Warehouse, ArrowRight, ArrowUpFromLine, Wrench, ShieldCheck, Hammer, Compass, Droplets, Cog, Anchor, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Ship, Zap, Droplet, Wind, Settings, Warehouse,
  ArrowUpFromLine, Wrench, ShieldCheck, Hammer, Compass, Droplets, Cog, Anchor, Package,
}

interface CategoryItem { id: string; name: string; icon: string; count: number }

interface TiltCardProps { children: React.ReactNode; className?: string; style?: React.CSSProperties }

function TiltCard({ children, className = '', style }: TiltCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if ('ontouchstart' in window || navigator.maxTouchPoints) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div className={className} style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ...style }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      {children}
    </motion.div>
  )
}

const categoryDescriptions: Record<string, { desc: string }> = {
  marine: { desc: 'Navigation systems, deck machinery, engine room components, vessel safety equipment.' },
  electrical: { desc: 'PLCs, VFDs, contactors, relays, circuit breakers, control panels — all major brands.' },
  hydraulic: { desc: 'Pumps, cylinders, valves, hydraulic power units for marine and heavy industrial use.' },
  pneumatic: { desc: 'Air tools, pneumatic valves, cylinders, FRL units, pneumatic control systems.' },
  spares: { desc: 'Motors, bearings, couplings, sensors, drives — sourced from OEM and authorized distributors.' },
  surplus: { desc: 'Unused and overstock industrial equipment bought and resold — extraordinary margins.' },
  'lifting-handling': { desc: 'Cranes, hoists, slings, and material handling equipment for industrial use.' },
  'tools-equipment': { desc: 'Industrial tools, test equipment, diagnostic instruments, and workshop gear.' },
  safety: { desc: 'Safety equipment, PPE, fire suppression, and marine safety gear.' },
  'hand-tools': { desc: 'Wrenches, screwdrivers, pliers, cutting tools, and precision hand tools.' },
  'ship-navigation': { desc: 'GPS, radar, ECDIS, gyro compasses, and bridge navigation systems.' },
  'marine-pumps': { desc: 'Ballast pumps, bilge pumps, seawater pumps, and marine pumping systems.' },
  'engine-spare': { desc: 'Engine components, pistons, rings, valves, gaskets, and cylinder heads.' },
  'engine-parts': { desc: 'Fuel injectors, turbochargers, heat exchangers, and engine control parts.' },
  'motor-components': { desc: 'Electric motors, servo drives, gearboxes, and motor control components.' },
  'ship-machinery': { desc: 'Deck machinery, winches, windlasses, steering gear, and propulsion systems.' },
  'hydraulic-pumps': { desc: 'Piston pumps, gear pumps, vane pumps, and hydraulic power units.' },
  rigging: { desc: 'Lifting slings, chains, shackles, hooks, lashing, and rigging hardware.' },
  'other-business': { desc: 'Miscellaneous industrial equipment, tools, and business supplies.' },
}

export function CategoriesGrid() {
  const { t } = useTranslation()
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 })

  // React Query caches categories — replaces manual useEffect + fetch
  const { data: categoriesData } = useCategories()

  const categories = useMemo(() => {
    if (categoriesData?.categories?.length) {
      return categoriesData.categories.map((c: any) => ({
        id: c.slug || c.id,
        name: c.name,
        icon: c.icon || 'Package',
        count: c._count?.products ?? c.productCount ?? 0,
      }))
    }
    return []
  }, [categoriesData])

  const descriptions = useMemo(() => {
    const merged = { ...categoryDescriptions }
    if (categoriesData?.categories?.length) {
      categoriesData.categories.forEach((c: any) => {
        if (c.description) {
          merged[c.slug || c.id] = { desc: c.description }
        }
      })
    }
    return merged
  }, [categoriesData])

  return (
    <section className="py-24 bg-[var(--primary-bg)]" id="categories">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <SectionLabel>{t('categories.label')}</SectionLabel>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <h2 className="font-display font-bold text-section tracking-tight text-[var(--text-primary)]">Shop by equipment type</h2>
            <div className="gold-accent-bar mt-4" />
          </div>
          <p className="max-w-[460px] text-body-sm text-[var(--text-secondary)] leading-relaxed">Browse practical categories built for buyers who need the right part, the right condition, and a fast quote.</p>
        </div>
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12" style={{ perspective: '1200px' }}>
          {categories.map((cat, i) => {
            const Icon = iconMap[cat.icon] || Package
            const info = descriptions[cat.id] || { desc: 'Browse our selection.' }
            const isGold = ['surplus', 'safety', 'rigging'].includes(cat.id)
            return (
              <TiltCard key={cat.id} className={`group maritime-card p-7 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'}`} style={{ transitionDelay: `${i * 80}ms`, transitionProperty: 'opacity, transform', transitionDuration: '0.5s' }}>
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${isGold ? 'bg-[var(--accent-gold)]/[0.1] text-[var(--accent-gold)]' : 'bg-[var(--accent-primary)]/[0.08] text-[var(--accent-primary)]'}`}><Icon size={28} /></div>
                <h3 className="heading-xl mb-3">{cat.name}</h3>
                <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed mb-4">{info.desc}</p>
                <span className={`inline-block font-mono text-xs px-3 py-1.5 border ${isGold ? 'text-[var(--accent-gold)] border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/[0.06]' : 'text-[var(--accent-primary)] border-[var(--accent-primary)]/15 bg-[var(--accent-primary)]/[0.04]'} rounded-full`}>
                  {cat.count} {t('categories.items', { defaultValue: 'Products' })}
                </span>
                <a href={`/products?category=${cat.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] no-underline mt-6 group-hover:text-[var(--accent-primary-hover)] transition-colors">
                  {t('categories.browse')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </TiltCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
