import { useEffect, useRef, useState } from 'react'

interface TypewriterProps {
  phrases: string[]
  /** Typing speed in ms per character. */
  typeSpeed?: number
  /** Deleting speed in ms per character. */
  deleteSpeed?: number
  /** Pause (ms) after a phrase is fully typed before deleting. */
  holdDelay?: number
  /** Pause (ms) before typing starts. */
  startDelay?: number
  /** ARIA label read by screen readers — full text regardless of animation state. */
  ariaLabel?: string
  className?: string
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  )
}

/**
 * Cycles through `phrases` with a classic typewriter animation (type → hold →
 * delete → next) plus a blinking caret. Accessible: the animated text is
 * aria-hidden and a stable full-phrase label is exposed to screen readers.
 * Under prefers-reduced-motion the first phrase is shown instantly, static.
 */
export function Typewriter({
  phrases,
  typeSpeed = 55,
  deleteSpeed = 30,
  holdDelay = 1600,
  startDelay = 400,
  ariaLabel,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState(() => (prefersReducedMotion() ? phrases[0] : ''))
  const [phraseIndex, setPhraseIndex] = useState(0)
  const phraseIndexRef = useRef(0)

  useEffect(() => {
    if (phrases.length === 0) return
    if (prefersReducedMotion()) {
      setDisplayText(phrases[0])
      return
    }

    let currentPhrase = phrases[phraseIndexRef.current] ?? phrases[0]
    let charIndex = 0
    let deleting = false
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      if (deleting) {
        charIndex -= 1
        setDisplayText(currentPhrase.slice(0, charIndex))
        if (charIndex === 0) {
          deleting = false
          phraseIndexRef.current = (phraseIndexRef.current + 1) % phrases.length
          setPhraseIndex(phraseIndexRef.current)
          currentPhrase = phrases[phraseIndexRef.current] ?? phrases[0]
        }
      } else {
        charIndex += 1
        setDisplayText(currentPhrase.slice(0, charIndex))
        if (charIndex === currentPhrase.length) {
          // Pause on the fully-typed phrase, then start deleting.
          timer = setTimeout(() => {
            deleting = true
            tick()
          }, holdDelay)
          return
        }
      }
      timer = setTimeout(tick, deleting ? deleteSpeed : typeSpeed)
    }

    timer = setTimeout(tick, startDelay)
    return () => clearTimeout(timer)
  }, [phrases, typeSpeed, deleteSpeed, holdDelay, startDelay])

  return (
    <span className={className}>
      <span aria-hidden="true" data-testid="typewriter-display">{displayText}</span>
      <span aria-hidden="true" className="hero-typewriter-caret" />
      <span className="sr-only">{ariaLabel ?? phrases[phraseIndex]}</span>
    </span>
  )
}
