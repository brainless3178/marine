import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const heroSlides = [
  { id: 'banner-1', src: '/images/marq-3.png' },
  { id: 'banner-2', src: '/images/marq11.png' },
  { id: 'banner-3', src: '/images/marq-1%20(2).png' },
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
      className="relative w-full h-[300px] sm:h-[400px] md:h-[480px] lg:h-[540px] overflow-hidden bg-[#0a0e17] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Premium industrial showcase carousel"
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
            alt="Industrial equipment and marine engineering"
            className={`h-full w-full ${index === 0 || index === 1 ? 'object-cover object-[15%_18%]' : 'object-cover'}`}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            onError={(e) => {
              const img = e.target as HTMLImageElement
              img.style.background =
                'linear-gradient(135deg, #1a2332 0%, #0f172a 50%, #0a0e17 100%)'
            }}
          />
        </div>
      ))}

      {/* ── Left Arrow ── */}
      <button
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:bg-[#ff6b00] hover:border-[#ff6b00] hover:scale-110 hover:shadow-[0_8px_32px_rgba(255,107,0,0.35)] focus-visible:outline-2 focus-visible:outline-white/60"
        aria-label="Previous slide"
      >
        <ChevronLeft size={28} strokeWidth={2.5} />
      </button>

      {/* ── Right Arrow ── */}
      <button
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:bg-[#ff6b00] hover:border-[#ff6b00] hover:scale-110 hover:shadow-[0_8px_32px_rgba(255,107,0,0.35)] focus-visible:outline-2 focus-visible:outline-white/60"
        aria-label="Next slide"
      >
        <ChevronRight size={28} strokeWidth={2.5} />
      </button>

      {/* ── Dots ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-white/60 ${
              index === current
                ? 'h-2.5 w-9 bg-[#ff6b00] shadow-[0_0_16px_rgba(255,107,0,0.5)]'
                : 'h-2.5 w-2.5 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === current ? 'true' : undefined}
          />
        ))}
      </div>

      {/* ── Slide Counter ── */}
      <div className="absolute top-6 right-6 z-20 rounded-full bg-black/30 backdrop-blur-md border border-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-white/70">
        {String(current + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </div>
    </section>
  )
}
