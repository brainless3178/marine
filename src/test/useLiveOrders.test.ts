import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock the admin API module
vi.mock('../lib/api', () => ({
  admin: {
    orders: { list: vi.fn() },
    dashboard: { stats: vi.fn(), alerts: vi.fn(), activity: vi.fn() },
    rfqs: { list: vi.fn() },
    offers: { list: vi.fn() },
    products: { list: vi.fn() },
    customers: { list: vi.fn() },
  },
  storefront: {
    settings: vi.fn(),
  },
}))

import { useLiveOrders } from '../hooks/useLiveOrders'
import { admin } from '../lib/api'

const mockOrdersList = admin.orders.list as ReturnType<typeof vi.fn>

describe('useLiveOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in loading state', () => {
    mockOrdersList.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useLiveOrders())
    expect(result.current.loading).toBe(true)
    expect(result.current.orders).toEqual([])
  })

  it('fetches orders on mount and sets loading to false', async () => {
    mockOrdersList.mockResolvedValue({ orders: [{ id: 'o1', status: 'paid' }, { id: 'o2', status: 'pending' }] })

    const { result } = renderHook(() => useLiveOrders())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.orders).toHaveLength(2)
    expect(mockOrdersList).toHaveBeenCalledWith({ limit: '20', sort: 'newest' })
  })

  it('handles empty orders response', async () => {
    mockOrdersList.mockResolvedValue({})

    const { result } = renderHook(() => useLiveOrders())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.orders).toEqual([])
  })

  it('handles fetch error gracefully', async () => {
    mockOrdersList.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLiveOrders())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.orders).toEqual([])
  })

  it('sets up polling interval', async () => {
    mockOrdersList.mockResolvedValue({ orders: [{ id: 'o1' }] })

    renderHook(() => useLiveOrders(5000))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mockOrdersList).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(mockOrdersList).toHaveBeenCalledTimes(2)
  })

  it('refresh function fetches orders immediately', async () => {
    mockOrdersList.mockResolvedValue({ orders: [{ id: 'o1' }] })

    const { result } = renderHook(() => useLiveOrders())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.orders).toHaveLength(1)

    mockOrdersList.mockResolvedValue({ orders: [{ id: 'o1' }, { id: 'o2' }, { id: 'o3' }] })

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.orders).toHaveLength(3)
  })

  it('cleans up interval on unmount', async () => {
    mockOrdersList.mockResolvedValue({ orders: [] })

    const { unmount } = renderHook(() => useLiveOrders(5000))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    unmount()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    // Only called once (initial), not again after unmount
    expect(mockOrdersList).toHaveBeenCalledTimes(1)
  })

  it('uses default interval of 30 seconds', async () => {
    mockOrdersList.mockResolvedValue({ orders: [] })

    renderHook(() => useLiveOrders())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mockOrdersList).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29000)
    })

    expect(mockOrdersList).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(mockOrdersList).toHaveBeenCalledTimes(2)
  })
})
