import { memo, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, Globe, MessageSquare, Search, ShieldCheck, Ship, ShoppingCart,
} from 'lucide-react'
import { useHeroVideo } from '@/hooks/useHeroVideo'
import { getHeroPosterJpgUrl } from '@/lib/cloudinaryVideo'
import { useLocalizedPath } from '@/lib/locale'
import { HeroFeatureCard, type HeroFeatureCardProps } from './HeroFeatureCard'

const FEATURE_CARDS: HeroFeatureCardProps[] = [
  {
    icon: ShieldCheck,
    title: 'Tested & Certified Parts',
    description: 'Every unit inspected, tested, and certified before dispatch.',
  },
  {
    icon: Globe,
    title: 'Worldwide Shipping',
    description: 'DHL, FedEx, air freight, and sea freight to 50+ countries.',
  },
  {
    icon: Ship,
    title: 'Buyer Arranged Export',
    description: 'Customs-ready documentation and buyer-arranged logistics.',
  },
  {
    icon: MessageSquare,
    title: 'RFQ Support',
    description: 'Send a part number or photo — quoted within 4 business hours.',
  },
]

const TRUST_BADGES = [
  'Worldwide Shipping',
  'Quality Assured',
  'Buyer Arranged Export',
  'RFQ Support',
]

interface HeroBackgroundProps {
  posterUrl: string
  posterSrcSet: string
  showVideo: boolean
  isPlaying: boolean
  videoSrc: string
  videoRef: RefObject<HTMLVideoElement | null>
  onVideoPlaying: () => void
  onVideoError: () => void
}

/**
 * Memoized media layer: a WebP poster (paints immediately, CLS = 0) plus the
 * lazy, codec-negotiated video that fades in over it. It only re-renders when
 * one of its props changes.
 */
const HeroBackground = memo(function HeroBackground({
  posterUrl,
  posterSrcSet,
  showVideo,
  isPlaying,
  videoSrc,
  videoRef,
  onVideoPlaying,
  onVideoError,
}: HeroBackgroundProps) {
  return (
    <>
      <img
        data-testid="hero-poster"
        src={posterUrl}
        srcSet={posterSrcSet}
        sizes="100vw"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
        decoding="async"
        onError={(e) => {
          const img = e.currentTarget
          if (img.src.includes('.webp')) {
            // srcSet candidates still point at .webp — drop them, then swap
            // to a jpg poster of the same width.
            img.removeAttribute('srcset')
            img.removeAttribute('sizes')
            const width = img.src.match(/w_(\d+)/)?.[1]
            img.src = getHeroPosterJpgUrl(width ? Number(width) : 'desktop')
          } else {
            img.onerror = null
          }
        }}
      />
      {showVideo && (
        <video
          ref={videoRef}
          data-testid="hero-video"
          src={videoSrc}
          className={`absolute inset-0 h-full w-full object-cover saturate-[0.85] transition-opacity duration-700 ease-out ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onPlaying={onVideoPlaying}
          onError={onVideoError}
        />
      )}
    </>
  )
})

export function Hero() {
  const {
    sectionRef,
    videoRef,
    showVideo,
    isPlaying,
    videoSrc,
    posterUrl,
    posterSrcSet,
    onVideoPlaying,
    onVideoError,
  } = useHeroVideo()
  const localizedPath = useLocalizedPath()

  return (
    <section
      ref={sectionRef}
      aria-label="Alka Traders — trusted marine spare parts delivered worldwide"
      className="relative -mt-[var(--hero-header-offset)] min-h-[calc(100vh_+_var(--hero-header-offset))] overflow-hidden bg-[var(--hero-bg)] supports-[height:100svh]:min-h-[calc(100svh_+_var(--hero-header-offset))]"
    >
      <HeroBackground
        posterUrl={posterUrl}
        posterSrcSet={posterSrcSet}
        showVideo={showVideo}
        isPlaying={isPlaying}
        videoSrc={videoSrc}
        videoRef={videoRef}
        onVideoPlaying={onVideoPlaying}
        onVideoError={onVideoError}
      />

      {/* Dark overlays: keep the video atmospheric — never the focal point */}
      <div className="absolute inset-0 bg-[var(--hero-bg)]/65" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[var(--hero-overlay-start)] via-[var(--hero-overlay-mid)] to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[var(--hero-bg)]/90 via-transparent to-[var(--hero-bg)]/40"
        aria-hidden="true"
      />

      <div className="site-container relative z-10 pt-[var(--hero-header-offset)] pb-16 sm:pb-20 lg:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ── Left: label, headline, CTAs, trust badges ── */}
          <div className="max-w-2xl lg:col-span-7 backdrop-blur-[2px]">
            <span className="hero-reveal inline-flex items-center gap-2 rounded-full border border-[var(--hero-border)] bg-[var(--hero-chip-bg)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hero-text-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--hero-accent)]" aria-hidden="true" />
              Marine & Industrial Procurement
            </span>

            <h1
              className="hero-reveal mt-6 font-manrope text-[clamp(2.75rem,5.2vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-[var(--hero-text)]"
              style={{ animationDelay: '60ms' }}
            >
              Trusted Marine Spare Parts.
              <span className="block text-[var(--hero-accent-hover)]">Delivered Worldwide.</span>
            </h1>

            <p
              className="hero-reveal mt-6 font-manrope text-[clamp(1.375rem,2.2vw,1.875rem)] font-semibold leading-snug tracking-[-0.01em] text-[var(--hero-text)]"
              style={{ animationDelay: '120ms' }}
            >
              Global sourcing for ship owners, yards, and maintenance teams.
            </p>

            <p
              className="hero-reveal mt-4 max-w-xl text-lg leading-relaxed text-[var(--hero-text-secondary)]"
              style={{ animationDelay: '160ms' }}
            >
              Shop marine engine parts, hydraulic pumps, electrical automation, navigation
              equipment, and industrial surplus online — or send an RFQ and our team will
              source it.
            </p>

            <div
              className="hero-reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: '200ms' }}
            >
              <Link to={localizedPath('/shop')} className="hero-btn-primary px-7 py-3.5 no-underline">
                <ShoppingCart size={18} strokeWidth={2} /> Shop Products
              </Link>
              <Link
                to={localizedPath('/products?search=ship%20spares')}
                className="hero-btn-secondary px-7 py-3.5 no-underline"
              >
                <Search size={18} strokeWidth={2} /> Search Ship Spares
              </Link>
            </div>

            <ul
              className="hero-reveal mt-8 flex flex-wrap gap-x-6 gap-y-2.5"
              style={{ animationDelay: '240ms' }}
            >
              {TRUST_BADGES.map((badge) => (
                <li
                  key={badge}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--hero-text-secondary)]"
                >
                  <Check size={15} strokeWidth={2.5} className="shrink-0 text-[var(--hero-accent)]" />
                  {badge}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right: four feature cards (snap-scroll on mobile, 2×2 grid on lg) ── */}
          <div className="lg:col-span-5">
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:p-0">
              {FEATURE_CARDS.map((card, i) => (
                <HeroFeatureCard key={card.title} {...card} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
