import { useState, useEffect, useCallback } from 'react'

/**
 * useState that survives hard refresh (F5).
 *
 * Lazy-initializes from localStorage on first render, then writes every
 * change back so a refresh restores the exact UI state — no white flash,
 * no lost form data, no "why is my cart/filter/draft empty again".
 *
 * Usage:
 *   const [draft, setDraft] = usePersistentState<FormData>('alka-rfq-draft', INITIAL)
 *   const [tab, setTab] = usePersistentState('alka-products-tab', 'all')
 *
 * `setValue` accepts both a value and an updater function, mirroring useState.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      // Corrupt JSON or storage blocked (private mode) — fall back to default.
    }
    return initialValue
  })

  // Persist on every change. Writing is cheap for small objects; wrap callers
  // in a debounce if they store something large.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Quota exceeded / private mode — the in-memory state still works.
    }
  }, [key, state])

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => (typeof value === 'function' ? (value as (p: T) => T)(prev) : value))
  }, [])

  return [state, setValue]
}
