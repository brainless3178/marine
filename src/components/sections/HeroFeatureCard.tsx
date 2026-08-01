import { memo } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface HeroFeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  /** Stagger delay (ms) for the entrance animation. */
  index?: number
}

/**
 * One of the four hero trust cards. Memoized so the hero's video-state
 * transitions never re-render it. Entrances use the global .hero-reveal
 * animation (fade up 20px / 300ms) with a per-card stagger.
 */
export const HeroFeatureCard = memo(function HeroFeatureCard({
  icon: Icon,
  title,
  description,
  index = 0,
}: HeroFeatureCardProps) {
  return (
    <article
      className="hero-card hero-reveal min-w-[260px] shrink-0 snap-start p-5 sm:min-w-[280px] lg:min-w-0 lg:p-6"
      style={{ animationDelay: `${280 + index * 80}ms` }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[var(--hero-accent)]">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-manrope text-base font-semibold text-[var(--hero-text)]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--hero-text-muted)]">{description}</p>
    </article>
  )
})
