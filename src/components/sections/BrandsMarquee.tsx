import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionLabel } from '../ui/SectionLabel'
import { Marquee } from '../ui/Marquee'
import { storefront } from '../../lib/api'
import { brandMarqueeItems, brandMarqueeItems2 } from '../../data/brands'

export function BrandsMarquee() {
  const { t } = useTranslation()
  const [row1, setRow1] = useState<string[]>(brandMarqueeItems)
  const [row2, setRow2] = useState<string[]>(brandMarqueeItems2)

  useEffect(() => {
    let cancelled = false
    storefront.brands.list()
      .then((res) => {
        if (!cancelled && res.brands?.length) {
          const names = res.brands.map((b: any) => b.name).filter(Boolean)
          const mid = Math.ceil(names.length / 2)
          setRow1(names.slice(0, mid))
          setRow2(names.slice(mid))
        }
      })
      .catch(() => { /* API unavailable — keep static fallback */ })
    return () => { cancelled = true }
  }, [])

  if (row1.length === 0 && row2.length === 0) return null

  return (
    <section className="py-28 bg-[var(--primary-bg)]" id="brands">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-12">
        <SectionLabel>{t('brands.label')}</SectionLabel>
        <h2 className="font-display font-bold text-section tracking-tight">{t('brands.title')}</h2>
        <div className="gold-accent-bar mt-4" />
      </div>
      {row1.length > 0 && (
        <div className="mb-4">
          <Marquee items={row1} direction="left" speed="30s" />
        </div>
      )}
      {row2.length > 0 && (
        <div>
          <Marquee items={row2} direction="right" speed="25s" />
        </div>
      )}
    </section>
  )
}
