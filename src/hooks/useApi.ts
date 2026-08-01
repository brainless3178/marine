import { useState, useEffect, useCallback, useRef } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Generic data-fetching hook with loading/error states.
 * Wraps the API client with React-friendly state management.
 *
 * IMPORTANT: The fetcher function must be stable (wrapped in useCallback)
 * or the deps array should include all values the fetcher depends on.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })
  const mountedRef = useRef(true)
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher }, [fetcher])

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await fetcherRef.current()
      if (mountedRef.current) {
        setState({ data, loading: false, error: null })
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: err.message || 'Unknown error' })
      }
    }
    // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mountedRef.current = true
    execute()
    return () => { mountedRef.current = false }
  }, [execute])

  return { ...state, refetch: execute }
}

/**
 * Mutation hook for POST/PUT/PATCH/DELETE operations.
 * Returns a trigger function and loading/error state.
 * The mutator is captured once at creation time via useRef.
 */
export function useMutation<TInput, TOutput>(
  mutator: (input: TInput) => Promise<TOutput>,
) {
  const [state, setState] = useState<UseApiState<TOutput>>({
    data: null,
    loading: false,
    error: null,
  })
  const mutatorRef = useRef(mutator)
  useEffect(() => { mutatorRef.current = mutator }, [mutator])

  // Stable execute that always reads the latest mutator via ref
  const execute = useCallback(async (input: TInput) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await mutatorRef.current(input)
      setState({ data, loading: false, error: null })
      return data
    } catch (err: any) {
      const error = err.message || 'Unknown error'
      setState({ data: null, loading: false, error })
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return { ...state, execute, reset }
}
