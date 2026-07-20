import { renderHook, act, waitFor } from '@testing-library/react'
import { useApi, useMutation } from '../hooks/useApi'

describe('useApi', () => {
  const fetcher = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with loading state', async () => {
    fetcher.mockImplementation(() => new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useApi(fetcher))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches data successfully', async () => {
    fetcher.mockResolvedValue({ id: 1, name: 'Test' })
    const { result } = renderHook(() => useApi(fetcher))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ id: 1, name: 'Test' })
    expect(result.current.error).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('handles fetch errors', async () => {
    fetcher.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useApi(fetcher))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Network error')
  })

  it('handles generic errors without message', async () => {
    fetcher.mockRejectedValue({})
    const { result } = renderHook(() => useApi(fetcher))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Unknown error')
  })

  it('refetches data when refetch is called', async () => {
    fetcher.mockResolvedValueOnce('initial')
    const { result } = renderHook(() => useApi(fetcher))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBe('initial')

    fetcher.mockResolvedValueOnce('updated')

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toBe('updated')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not update state after unmount', async () => {
    const slowFetcher = () => new Promise<string>((resolve) => {
      setTimeout(() => resolve('data'), 1000)
    })

    const { unmount } = renderHook(() => useApi(slowFetcher))

    unmount()

    // Should not throw when trying to update
    await new Promise((r) => setTimeout(r, 1500))
  })
})

describe('useMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with idle state', () => {
    const mutator = vi.fn()
    const { result } = renderHook(() => useMutation(mutator))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('executes mutation successfully', async () => {
    const mutator = vi.fn().mockResolvedValue({ id: 1 })
    const { result } = renderHook(() => useMutation(mutator))

    await act(async () => {
      await result.current.execute({ name: 'test' })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual({ id: 1 })
    expect(result.current.error).toBeNull()
    expect(mutator).toHaveBeenCalledWith({ name: 'test' })
  })

  it('handles mutation errors', async () => {
    const mutator = vi.fn().mockRejectedValue(new Error('Validation failed'))
    const { result } = renderHook(() => useMutation(mutator))

    await act(async () => {
      try {
        await result.current.execute({ name: 'test' })
      } catch {
        // Expected
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Validation failed')
  })

  it('returns data from execute', async () => {
    const mutator = vi.fn().mockResolvedValue('result')
    const { result } = renderHook(() => useMutation(mutator))

    let returnValue: any
    await act(async () => {
      returnValue = await result.current.execute({})
    })

    expect(returnValue).toBe('result')
  })

  it('resets state when reset is called', async () => {
    const mutator = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useMutation(mutator))

    await act(async () => {
      await result.current.execute({})
    })

    expect(result.current.data).toBe('data')

    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets loading to true during mutation', async () => {
    let resolveMutation: (value: any) => void
    const mutator = vi.fn().mockImplementation(() =>
      new Promise((resolve) => {
        resolveMutation = resolve
      })
    )
    const { result } = renderHook(() => useMutation(mutator))

    act(() => {
      result.current.execute({})
    })

    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolveMutation!('done')
    })

    expect(result.current.loading).toBe(false)
  })
})
