import { useTranslation } from 'react-i18next'
import { StatCounter } from '../ui/StatCounter'

export function StatsBar() {
  const { t } = useTranslation()
  return (
    <section className="py-6 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="stats-gradient flex justify-center items-center flex-wrap p-5 md:p-7 rounded-2xl border border-[var(--border)]">
          <StatCounter end={10000} label={t('hero.statsProducts')} />
          <div className="w-px h-14 bg-[var(--border)] hidden md:block" />
          <StatCounter end={200} label={t('hero.statsBrands')} delay={100} />
          <div className="w-px h-14 bg-[var(--border)] hidden md:block" />
          <StatCounter end={50} label={t('hero.statsCountries')} delay={200} />
          <div className="w-px h-14 bg-[var(--border)] hidden md:block" />
          <StatCounter end={15} label={t('hero.statsYears')} delay={300} />
        </div>
      </div>
    </section>
  )
}
