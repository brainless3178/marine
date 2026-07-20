import { useState, useEffect } from 'react'

/**
 * Debounce a value by `delay` ms. Returns the debounced value.
 * The input value updates immediately in the caller; the returned
 * value only updates after `delay` ms of inactivity.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
