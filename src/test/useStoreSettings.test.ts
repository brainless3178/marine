import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock the storefront API module
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

import { storefront } from '../lib/api'

const mockSettings = storefront.settings as ReturnType<typeof vi.fn>

describe('useStoreSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the module to clear cached settings, fetchPromise, and subscribers
    vi.resetModules()
  })

  async function loadHook() {
    const { useStoreSettings } = await import('../hooks/useStoreSettings')
    return useStoreSettings
  }

  it('returns default settings before fetch completes', async () => {
    mockSettings.mockImplementation(() => new Promise(() => {}))
    const useStoreSettings = await loadHook()
    const { result } = renderHook(() => useStoreSettings())

    expect(result.current.whatsappNumber).toBe('918799095041')
    expect(result.current.shippingCost).toBe(25)
    expect(result.current.taxRate).toBe(0.08)
    expect(result.current.rfqEmail).toBe('sales@alkatraders.co')
    expect(result.current.emergencyEmail).toBe('sales@alkatraders.co')
    expect(result.current.phoneNumber).toBe('+918799095041')
  })

  it('fetches settings from API on mount', async () => {
    mockSettings.mockResolvedValue({
      settings: {
        'site.whatsappNumber': '1234567890',
        'site.shippingCost': 50,
        'site.taxRate': 0.1,
        'site.rfqEmail': 'custom@company.com',
        'site.emergencyEmail': 'emergency@company.com',
        'site.phoneNumber': '+1234567890',
      },
    })

    const useStoreSettings = await loadHook()
    const { result } = renderHook(() => useStoreSettings())

    await act(async () => {})

    expect(mockSettings).toHaveBeenCalledTimes(1)
    expect(result.current.whatsappNumber).toBe('1234567890')
    expect(result.current.shippingCost).toBe(50)
    expect(result.current.taxRate).toBe(0.1)
    expect(result.current.rfqEmail).toBe('custom@company.com')
  })

  it('falls back to defaults when API fails', async () => {
    mockSettings.mockRejectedValue(new Error('Network error'))

    const useStoreSettings = await loadHook()
    const { result } = renderHook(() => useStoreSettings())

    await act(async () => {})

    expect(result.current.whatsappNumber).toBe('918799095041')
    expect(result.current.shippingCost).toBe(25)
  })

  it('falls back to defaults for missing settings fields', async () => {
    mockSettings.mockResolvedValue({ settings: {} })

    const useStoreSettings = await loadHook()
    const { result } = renderHook(() => useStoreSettings())

    await act(async () => {})

    expect(result.current.whatsappNumber).toBe('918799095041')
    expect(result.current.shippingCost).toBe(25)
    expect(result.current.taxRate).toBe(0.08)
  })

  it('uses defaults for falsy numeric values (0 is falsy)', async () => {
    mockSettings.mockResolvedValue({
      settings: {
        'site.shippingCost': 0,
        'site.taxRate': 0,
      },
    })

    const useStoreSettings = await loadHook()
    const { result } = renderHook(() => useStoreSettings())

    await act(async () => {})

    // 0 is falsy, so Number(0) || default applies
    expect(result.current.shippingCost).toBe(25)
    expect(result.current.taxRate).toBe(0.08)
  })

  it('returns consistent defaults for multiple hook instances', async () => {
    mockSettings.mockImplementation(() => new Promise(() => {}))

    const useStoreSettings = await loadHook()
    const { result: result1 } = renderHook(() => useStoreSettings())
    const { result: result2 } = renderHook(() => useStoreSettings())

    // Both instances should get the same default settings
    expect(result1.current.whatsappNumber).toBe('918799095041')
    expect(result2.current.whatsappNumber).toBe('918799095041')
    expect(result1.current.shippingCost).toBe(result2.current.shippingCost)
  })

  it('cleans up subscriber on unmount', async () => {
    mockSettings.mockImplementation(() => new Promise(() => {}))

    const useStoreSettings = await loadHook()
    const { unmount } = renderHook(() => useStoreSettings())
    unmount()

    // Should not throw after unmount
  })
})
