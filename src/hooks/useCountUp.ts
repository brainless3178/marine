import { useEffect, useState, useCallback, useRef } from 'react'

interface UseCountUpOptions {
  end: number
  duration?: number
  suffix?: string
  enabled?: boolean
}

export function useCountUp({ end, duration = 2000, suffix = '', enabled = false }: UseCountUpOptions) {
  const [count, setCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const rafRef = useRef<number | null>(null)

  const animate = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)

    const startTime = performance.now()

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3)
    }

    function step(timestamp: number) {
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = easeOutCubic(progress)
      const current = Math.floor(easedProgress * end)

      setCount(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setCount(end)
      }
    }

    rafRef.current = requestAnimationFrame(step)
  }, [end, duration, isAnimating])

  // Cancel RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (enabled && !isAnimating) {
      animate()
    }
  }, [enabled, animate, isAnimating])

  const formattedCount = end > 999 ? count.toLocaleString() : count.toString()

  return { count: formattedCount + suffix, isAnimating }
}
