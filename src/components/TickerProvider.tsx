import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

/**
 * A single shared "now" clock for the whole app.
 *
 * Instead of every on-sale product card mounting its own `setInterval`,
 * one provider owns a single interval that only runs while at least one
 * consumer needs it. Consumers read the current timestamp through
 * `useSyncExternalStore`, so only active subscribers re-render on each tick.
 */

interface TickerHandle {
  /** Register a listener. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void
  /** Read the current tick timestamp (ms). */
  getNow: () => number
}

const TickerContext = createContext<TickerHandle | null>(null)

const NOOP_SUBSCRIBE = () => () => {}
const ZERO_SNAPSHOT = () => 0

export function TickerProvider({ children }: { children: ReactNode }) {
  const nowRef = useRef(Date.now())
  const listenersRef = useRef(new Set<() => void>())
  const subscriberCountRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tickNow = useCallback(() => {
    nowRef.current = Date.now()
    listenersRef.current.forEach((l) => l())
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current != null) return
    intervalRef.current = setInterval(tickNow, 1000)
  }, [tickNow])

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener)
    subscriberCountRef.current += 1
    // Refresh now before the first tick so a late subscriber sees a fresh timestamp.
    nowRef.current = Date.now()
    listenersRef.current.forEach((l) => l())
    start()
    return () => {
      listenersRef.current.delete(listener)
      subscriberCountRef.current -= 1
      if (subscriberCountRef.current <= 0) stop()
    }
  }, [start, stop])

  // Pause the interval while the tab is hidden; resync when it becomes visible.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        tickNow()
        if (subscriberCountRef.current > 0) start()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [stop, start, tickNow])

  const handle = useMemo<TickerHandle>(() => ({
    subscribe,
    getNow: () => nowRef.current,
  }), [subscribe])

  return <TickerContext.Provider value={handle}>{children}</TickerContext.Provider>
}

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
