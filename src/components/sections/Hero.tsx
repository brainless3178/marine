import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MessageCircle, Search } from 'lucide-react'
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
      className="relative w-full h-[620px] min-h-[620px] overflow-hidden bg-[#0a0e17] select-none sm:h-[640px] lg:h-[660px]"
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
                'linear-gradient(135deg, #1a2332 0%, #0f172a 50%, #0a0e17 100%)'
            }}
          />
        </div>
      ))}

      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#06111f]/90 via-[#06111f]/62 to-[#06111f]/18" />

      <div className="absolute inset-0 z-20 flex items-center">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#ffb547]">
              Bhavnagar and Alang ship spares supplier
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              Tested marine spare parts and industrial equipment, sourced fast for vessels and plants.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
              Alka Traders supplies ship automation, engine spares, hydraulic pumps, electrical drives, navigation equipment, and surplus machinery from India to buyers worldwide.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/rfq"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#ff6b00] px-6 py-3 text-sm font-extrabold text-white no-underline shadow-[0_14px_36px_rgba(255,107,0,0.28)] transition-all hover:bg-[#e85f00]"
              >
                <MessageCircle size={18} />
                Request Ship Spare Quote
              </Link>
              <Link
                to="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/35 bg-white/10 px-6 py-3 text-sm font-extrabold text-white no-underline backdrop-blur transition-all hover:bg-white/18"
              >
                <Search size={18} />
                Browse Marine Parts
              </Link>
            </div>
            <dl className="mt-7 grid max-w-xl grid-cols-3 gap-3 text-white">
              <div>
                <dt className="text-2xl font-black">10k+</dt>
                <dd className="text-xs font-semibold text-white/62">parts sourced</dd>
              </div>
              <div>
                <dt className="text-2xl font-black">50+</dt>
                <dd className="text-xs font-semibold text-white/62">countries served</dd>
              </div>
              <div>
                <dt className="text-2xl font-black">4 hr</dt>
                <dd className="text-xs font-semibold text-white/62">RFQ response</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* ── Left Arrow ── */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/16 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:border-[#ff6b00] hover:bg-[#ff6b00] focus-visible:outline-2 focus-visible:outline-white/60 md:flex"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>

      {/* ── Right Arrow ── */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/16 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:border-[#ff6b00] hover:bg-[#ff6b00] focus-visible:outline-2 focus-visible:outline-white/60 md:flex"
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
                ? 'h-2.5 w-9 bg-[#ff6b00] shadow-[0_0_16px_rgba(255,107,0,0.5)]'
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
