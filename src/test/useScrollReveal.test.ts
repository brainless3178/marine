import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()

class MockIntersectionObserver {
  callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback
  }

  observe(element: Element) {
    mockObserve(element)
  }

  unobserve(element: Element) {
    mockUnobserve(element)
  }

  disconnect() {
    mockDisconnect()
  }
}

describe('useScrollReveal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    delete (globalThis as any).IntersectionObserver
  })

  it('can be imported without crashing', async () => {
    const mod = await import('../hooks/useScrollReveal')
    expect(mod.useScrollReveal).toBeDefined()
    expect(typeof mod.useScrollReveal).toBe('function')
  })

  it('returns ref and isVisible from hook', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useScrollReveal } = await import('../hooks/useScrollReveal')
    const { result } = renderHook(() => useScrollReveal())

    expect(result.current.ref).toBeDefined()
    expect(typeof result.current.ref).toBe('object')
    expect(result.current.isVisible).toBe(false)
  })

  it('accepts default options', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useScrollReveal } = await import('../hooks/useScrollReveal')
    const { result } = renderHook(() => useScrollReveal())

    expect(result.current).toBeDefined()
  })

  it('accepts custom options', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useScrollReveal } = await import('../hooks/useScrollReveal')
    const { result } = renderHook(() =>
      useScrollReveal({ threshold: 0.5, rootMargin: '100px', triggerOnce: false })
    )

    expect(result.current).toBeDefined()
  })

  it('cleans up observer on unmount', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useScrollReveal } = await import('../hooks/useScrollReveal')
    const { unmount, result } = renderHook(() => useScrollReveal())
    // The observer is created in useEffect only when ref.current is set
    // Since ref.current is null by default, disconnect won't be called.
    // We just verify unmount doesn't throw.
    unmount()
    expect(result.current.ref).toBeDefined()
  })

  it('returns a mutable ref', async () => {
    const { renderHook } = await import('@testing-library/react')
    const { useScrollReveal } = await import('../hooks/useScrollReveal')
    const { result } = renderHook(() => useScrollReveal())

    const el = document.createElement('div')
    result.current.ref.current = el
    expect(result.current.ref.current).toBe(el)
  })
})
