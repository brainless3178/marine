import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'

/**
 * A single shared "now" clock for the whole app.
 *
 * Instead of every on-sale product card mounting its own `setInterval`,
 * one provider (TickerProvider in components/TickerProvider.tsx) owns a
 * single interval that only runs while at least one consumer needs it.
 * Consumers read the current timestamp through `useSyncExternalStore`, so
 * only active subscribers re-render on each tick.
 */

export interface TickerHandle {
  /** Register a listener. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void
  /** Read the current tick timestamp (ms). */
  getNow: () => number
}

export const TickerContext = createContext<TickerHandle | null>(null)

export const NOOP_SUBSCRIBE = () => () => {}
export const ZERO_SNAPSHOT = () => 0

/**
 * Subscribe to the shared ticker while `active` is true.
 * Returns the current timestamp (ms). When the provider is missing (e.g. a
 * component rendered standalone in tests), falls back to a local interval so
 * countdowns still tick.
 */
export function useTickerNow(active: boolean): number {
  const ticker = useContext(TickerContext)
  const [fallbackNow, setFallbackNow] = useState(() => Date.now())

  const tickerNow = useSyncExternalStore(
    ticker && active ? ticker.subscribe : NOOP_SUBSCRIBE,
    ticker && active ? ticker.getNow : ZERO_SNAPSHOT,
    ZERO_SNAPSHOT,
  )

  // Standalone fallback: no provider in the tree → own 1s interval.
  useEffect(() => {
    if (ticker || !active) return
    // Resync immediately so a late activation isn't stuck on the mount-time value.
    setFallbackNow(Date.now())
    let interval: ReturnType<typeof setInterval> | null = null
    const tick = () => setFallbackNow(Date.now())
    interval = setInterval(tick, 1000)
    const onVisibility = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [ticker, active])

  return ticker ? tickerNow : fallbackNow
}
