import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountUp } from '../hooks/useCountUp'

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      setTimeout(cb, 16)
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns initial count as 0', () => {
    const { result } = renderHook(() => useCountUp({ end: 100, enabled: false }))

    expect(result.current.count).toBe('0')
    expect(result.current.isAnimating).toBe(false)
  })

  it('starts animation when enabled is true', async () => {
    const { result } = renderHook(() => useCountUp({ end: 100, enabled: true, duration: 100 }))

    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(result.current.isAnimating).toBe(true)
  })

  it('counts up to target value', async () => {
    const { result } = renderHook(() => useCountUp({ end: 100, enabled: true, duration: 100 }))

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.count).toBe('100')
  })

  it('formats numbers greater than 999 with locale separator', async () => {
    const { result } = renderHook(() => useCountUp({ end: 1500, enabled: true, duration: 100 }))

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Should contain locale formatting (1,500 or 1.500 depending on locale)
    expect(result.current.count).toMatch(/1[,.]500/)
  })

  it('adds suffix to count', async () => {
    const { result } = renderHook(() => 
      useCountUp({ end: 100, enabled: true, duration: 100, suffix: '+' })
    )

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.count).toBe('100+')
  })

  it('does not animate when enabled is false', () => {
    const { result } = renderHook(() => useCountUp({ end: 100, enabled: false }))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.count).toBe('0')
    expect(result.current.isAnimating).toBe(false)
  })

  it('handles zero end value', async () => {
    const { result } = renderHook(() => useCountUp({ end: 0, enabled: true, duration: 100 }))

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.count).toBe('0')
  })

  it('formats small numbers without locale separator', async () => {
    const { result } = renderHook(() => useCountUp({ end: 50, enabled: true, duration: 100 }))

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.count).toBe('50')
  })

  it('cleans up animation frame on unmount', () => {
    const { unmount } = renderHook(() => useCountUp({ end: 100, enabled: true }))

    unmount()

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()
  })
})
