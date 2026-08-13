import { useEffect, useMemo, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { TickerContext, type TickerHandle } from '../hooks/useTickerNow'

/**
 * A single shared "now" clock for the whole app.
 *
 * Instead of every on-sale product card mounting its own `setInterval`,
 * one provider owns a single interval that only runs while at least one
 * consumer needs it. Consumers read the current timestamp through
 * `useSyncExternalStore`, so only active subscribers re-render on each tick.
 */

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
