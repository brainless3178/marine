import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, ShieldCheck, ShoppingCart } from 'lucide-react'
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

const typewriterPhrases = [
  'Marine & industrial equipment supplier',
  'Ship spares, marine engine parts, and ship machinery',
  'Hydraulic pumps, automation spares, and MRO components',
  'Tested stock from Bhavnagar and Alang for global buyers',
]

export function Hero() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [typedLength, setTypedLength] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSlides = heroSlides.length

  const goTo = useCallback((index: number) => {
    setCurrent(((index % totalSlides) + totalSlides) % totalSlides)
  }, [totalSlides])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

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

  useEffect(() => {
    const phrase = typewriterPhrases[phraseIndex]
    const isComplete = typedLength === phrase.length
    const isEmpty = typedLength === 0
    const delay = isComplete && !isDeleting ? 1400 : isDeleting ? 34 : 58

    const timeout = window.setTimeout(() => {
      if (isComplete && !isDeleting) {
        setIsDeleting(true)
        return
      }

      if (isEmpty && isDeleting) {
        setIsDeleting(false)
        setPhraseIndex((phraseIndex + 1) % typewriterPhrases.length)
        return
      }

      setTypedLength((length) => length + (isDeleting ? -1 : 1))
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [isDeleting, phraseIndex, typedLength])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev()
    else if (e.key === 'ArrowRight') next()
  }, [prev, next])

  return (
    <>
      <section className="relative flex min-h-[520px] items-center overflow-hidden bg-[var(--hero-bg-deep)] py-8 sm:min-h-[540px] sm:py-10 lg:min-h-[560px] lg:py-12" aria-label="Shop marine spare parts online">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={heroSlides[0].src}
          aria-hidden="true"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/48" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/74 to-black/48" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-black/34" />
        <div className="site-container relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="max-w-3xl rounded-2xl border border-white/12 bg-black/44 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-[2px] sm:p-6 lg:bg-black/34">
            <span className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
              Marine spare parts ecommerce
            </span>
            <h1 className="font-display text-[clamp(2.6rem,6.4vw,5.8rem)] font-black leading-[0.92] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
              Alka Traders
            </h1>
            <p className="mt-4 min-h-[5rem] max-w-3xl font-display text-[clamp(1.15rem,2.4vw,2rem)] font-bold leading-[1.18] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.9)] sm:min-h-[3.2rem]">
              {typewriterPhrases[phraseIndex].slice(0, typedLength)}
              <span className="ml-1 inline-block animate-pulse text-[var(--hero-accent-gold)]">|</span>
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/88 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] md:text-base">
              Shop ship spares online or send an RFQ for marine engine parts, hydraulic pumps, electrical automation, navigation equipment, safety gear, rigging, and surplus industrial components.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-[var(--btn-blue-text)] no-underline shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition hover:bg-[var(--accent-primary-hover)] hover:text-[var(--btn-blue-text)]"
              >
                <ShoppingCart size={17} /> Shop products
              </Link>
              <Link
                to="/products?search=marine%20spare%20parts"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/22 bg-white/12 px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white no-underline backdrop-blur-md transition hover:bg-white hover:text-[var(--navy-deep)]"
              >
                <Search size={17} /> Search ship spares
              </Link>
            </div>
          </div>

          <div className="hidden h-fit gap-3 rounded-2xl border border-white/12 bg-black/28 p-5 text-sm leading-relaxed text-white/86 shadow-[0_18px_54px_rgba(0,0,0,0.22)] backdrop-blur-md lg:grid">
            {['Tested new old stock, used, refurbished, and reconditioned parts', 'DHL, FedEx, air freight, sea freight, and buyer-arranged export', 'RFQ support for maker, model, part number, and nameplate photos'].map((item) => (
              <span key={item} className="flex gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--hero-accent-gold)]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative aspect-[3/1] w-full overflow-hidden bg-white select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Marine spare parts and ship equipment carousel"
        aria-roledescription="carousel"
      >
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
              className="h-full w-full object-contain object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onError={(e) => {
                const img = e.target as HTMLImageElement
                img.style.background =
                  'linear-gradient(135deg, var(--hero-bg-mid) 0%, var(--hero-bg-light) 50%, var(--hero-bg-deep) 100%)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/34 via-transparent to-black/10" />
          </div>
        ))}

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/16 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:border-[var(--hero-accent-orange)] hover:bg-[var(--hero-accent-orange)] focus-visible:outline-2 focus-visible:outline-white/60 md:flex"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        <button
          onClick={next}
          className="absolute right-3 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/16 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:border-[var(--hero-accent-orange)] hover:bg-[var(--hero-accent-orange)] focus-visible:outline-2 focus-visible:outline-white/60 md:flex"
          aria-label="Next slide"
        >
          <ChevronRight size={24} strokeWidth={2.5} />
        </button>

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

        <div className="absolute right-4 top-4 z-30 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-xs font-semibold tracking-widest text-white/70 backdrop-blur-md">
          {String(current + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </div>
      </section>
    </>
  )
}
