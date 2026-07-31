import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getStaticImageUrl } from '@/lib/utils'

const heroSlides = [
  {
    id: 'banner-1',
    src: getStaticImageUrl('marq-3'),
    alt: 'Marine ship spares, automation equipment, and industrial surplus ready for export from Bhavnagar',
  },
  {
    id: 'banner-2',
    src: getStaticImageUrl('marq11'),
    alt: 'Tested ship machinery, hydraulic pumps, electrical drives, and vessel spare parts',
  },
  {
    id: 'banner-3',
    src: getStaticImageUrl('marq-1'),
    alt: 'Alang-sourced marine equipment and industrial components packed for global delivery',
  },
]

export function Hero() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSlides = heroSlides.length

  const goTo = useCallback((index: number) => {
    setCurrent(((index % totalSlides) + totalSlides) % totalSlides)
  }, [totalSlides])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-rotation
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(next, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused, next])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev()
    else if (e.key === 'ArrowRight') next()
  }, [prev, next])

  return (
    <section
      className="relative w-full h-[620px] min-h-[620px] overflow-hidden bg-[var(--hero-bg-deep)] select-none sm:h-[640px] lg:h-[660px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Alka Traders marine spare parts and industrial equipment"
      aria-roledescription="carousel"
    >
      {/* ── Slides ── */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === current
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-[1.03] pointer-events-none'
          }`}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${totalSlides}`}
          aria-hidden={index !== current}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className={`h-full w-full ${index === 0 || index === 1 ? 'object-cover object-[15%_18%]' : 'object-cover'}`}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            onError={(e) => {
              const img = e.target as HTMLImageElement
              img.style.background =
                'linear-gradient(135deg, var(--hero-bg-mid) 0%, var(--hero-bg-light) 50%, var(--hero-bg-deep) 100%)'
            }}
          />
        </div>
      ))}

      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[var(--hero-overlay)]/90 via-[var(--hero-overlay)]/62 to-[var(--hero-overlay)]/18" />



      {/* ── Left Arrow ── */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/16 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:border-[var(--hero-accent-orange)] hover:bg-[var(--hero-accent-orange)] focus-visible:outline-2 focus-visible:outline-white/60 md:flex"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>

      {/* ── Right Arrow ── */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/16 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:border-[var(--hero-accent-orange)] hover:bg-[var(--hero-accent-orange)] focus-visible:outline-2 focus-visible:outline-white/60 md:flex"
        aria-label="Next slide"
      >
        <ChevronRight size={24} strokeWidth={2.5} />
      </button>

      {/* ── Dots ── */}
      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-white/60 ${
              index === current
                ? 'h-2.5 w-9 bg-[var(--hero-accent-orange)] shadow-[0_0_16px_rgba(255,107,0,0.5)]'
                : 'h-2.5 w-2.5 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === current ? 'true' : undefined}
          />
        ))}
      </div>

      {/* ── Slide Counter ── */}
      <div className="absolute right-4 top-4 z-30 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-xs font-semibold tracking-widest text-white/70 backdrop-blur-md">
        {String(current + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </div>
    </section>
  )
}
