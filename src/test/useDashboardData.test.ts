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

import { useDashboardData } from '../hooks/useDashboardData'
import { admin } from '../lib/api'

const mockStats = admin.dashboard.stats as ReturnType<typeof vi.fn>
const mockAlerts = admin.dashboard.alerts as ReturnType<typeof vi.fn>
const mockActivity = admin.dashboard.activity as ReturnType<typeof vi.fn>
const mockOrdersList = admin.orders.list as ReturnType<typeof vi.fn>
const mockRfqsList = admin.rfqs.list as ReturnType<typeof vi.fn>
const mockOffersList = admin.offers.list as ReturnType<typeof vi.fn>
const mockProductsList = admin.products.list as ReturnType<typeof vi.fn>
const mockCustomersList = admin.customers.list as ReturnType<typeof vi.fn>

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockStats.mockImplementation(() => new Promise(() => {}))
    mockAlerts.mockImplementation(() => new Promise(() => {}))
    mockActivity.mockImplementation(() => new Promise(() => {}))
    mockOrdersList.mockImplementation(() => new Promise(() => {}))
    mockRfqsList.mockImplementation(() => new Promise(() => {}))
    mockOffersList.mockImplementation(() => new Promise(() => {}))
    mockProductsList.mockImplementation(() => new Promise(() => {}))
    mockCustomersList.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useDashboardData())
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('fetches all dashboard data on mount', async () => {
    mockStats.mockResolvedValue({ totalProducts: 100, inStockProducts: 80 })
    mockAlerts.mockResolvedValue({ alerts: [{ type: 'warning', message: 'Low stock' }] })
    mockActivity.mockResolvedValue({ logs: [{ id: 'a1', action: 'product.create' }] })
    mockOrdersList.mockResolvedValue({ orders: [{ id: 'o1' }] })
    mockRfqsList.mockResolvedValue({ rfqs: [{ id: 'r1' }] })
    mockOffersList.mockResolvedValue({ offers: [{ id: 'off1' }] })
    mockProductsList.mockResolvedValue({ products: [{ id: 'p1' }] })
    mockCustomersList.mockResolvedValue({ customers: [{ id: 'c1' }] })

    const { result } = renderHook(() => useDashboardData())

    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.stats).toEqual({ totalProducts: 100, inStockProducts: 80 })
    expect(result.current.alerts).toEqual([{ type: 'warning', message: 'Low stock' }])
    expect(result.current.activity).toEqual([{ id: 'a1', action: 'product.create' }])
    expect(result.current.orders).toEqual([{ id: 'o1' }])
    expect(result.current.rfqs).toEqual([{ id: 'r1' }])
    expect(result.current.offers).toEqual([{ id: 'off1' }])
    expect(result.current.products).toEqual([{ id: 'p1' }])
    expect(result.current.customers).toEqual([{ id: 'c1' }])
  })

  it('handles partial failures gracefully with Promise.allSettled', async () => {
    mockStats.mockResolvedValue({ totalProducts: 50 })
    mockAlerts.mockRejectedValue(new Error('alerts failed'))
    mockActivity.mockResolvedValue([])
    mockOrdersList.mockRejectedValue(new Error('orders failed'))
    mockRfqsList.mockResolvedValue({ rfqs: [] })
    mockOffersList.mockResolvedValue({ offers: [] })
    mockProductsList.mockResolvedValue({ products: [] })
    mockCustomersList.mockResolvedValue({ customers: [] })

    const { result } = renderHook(() => useDashboardData())

    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull() // No top-level error
    expect(result.current.stats).toEqual({ totalProducts: 50 })
    expect(result.current.alerts).toEqual([])
    expect(result.current.orders).toEqual([])
  })

  it('handles rejected promises from all endpoints', async () => {
    // Promise.allSettled handles rejections without throwing
    // The hook sets empty defaults for each rejected endpoint
    mockStats.mockRejectedValue(new Error('Stats failed'))
    mockAlerts.mockRejectedValue(new Error('Alerts failed'))
    mockActivity.mockRejectedValue(new Error('Activity failed'))
    mockOrdersList.mockRejectedValue(new Error('Orders failed'))
    mockRfqsList.mockRejectedValue(new Error('Rfqs failed'))
    mockOffersList.mockRejectedValue(new Error('Offers failed'))
    mockProductsList.mockRejectedValue(new Error('Products failed'))
    mockCustomersList.mockRejectedValue(new Error('Customers failed'))

    const { result } = renderHook(() => useDashboardData())

    await act(async () => {})

    expect(result.current.loading).toBe(false)
    // No top-level error because Promise.allSettled handles rejections
    expect(result.current.error).toBeNull()
    // All data should be empty/default
    expect(result.current.stats).toBeNull()
    expect(result.current.orders).toEqual([])
    expect(result.current.rfqs).toEqual([])
  })

  it('refresh function reloads all data', async () => {
    mockStats.mockResolvedValue({ totalProducts: 10 })
    mockAlerts.mockResolvedValue({ alerts: [] })
    mockActivity.mockResolvedValue({ logs: [] })
    mockOrdersList.mockResolvedValue({ orders: [] })
    mockRfqsList.mockResolvedValue({ rfqs: [] })
    mockOffersList.mockResolvedValue({ offers: [] })
    mockProductsList.mockResolvedValue({ products: [] })
    mockCustomersList.mockResolvedValue({ customers: [] })

    const { result } = renderHook(() => useDashboardData())

    await act(async () => {})

    expect(result.current.stats.totalProducts).toBe(10)

    mockStats.mockResolvedValue({ totalProducts: 25 })

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.stats.totalProducts).toBe(25)
  })

  it('extracts alerts from nested response', async () => {
    mockStats.mockResolvedValue({ totalProducts: 0, lowStockProducts: [], missingImageProducts: [], categoryBreakdown: [], brandBreakdown: [], conditionBreakdown: [] })
    // The hook reads (value as any)?.alerts || [], so the response must have an alerts array
    mockAlerts.mockResolvedValue({
      alerts: [
        { type: 'warning', message: '2 products are low on stock', entityType: 'product' },
        { type: 'danger', message: '1 RFQs have exceeded response SLA', entityType: 'rfq' },
        { type: 'danger', message: '5 products are out of stock', entityType: 'product' },
      ],
    })
    mockActivity.mockResolvedValue({ logs: [] })
    mockOrdersList.mockResolvedValue({ orders: [] })
    mockRfqsList.mockResolvedValue({ rfqs: [] })
    mockOffersList.mockResolvedValue({ offers: [] })
    mockProductsList.mockResolvedValue({ products: [] })
    mockCustomersList.mockResolvedValue({ customers: [] })

    const { result } = renderHook(() => useDashboardData())

    await act(async () => {})

    expect(result.current.alerts).toHaveLength(3)
    expect(result.current.alerts[0].type).toBe('warning')
    expect(result.current.alerts[0].message).toContain('2 products')
    expect(result.current.alerts[1].type).toBe('danger')
    expect(result.current.alerts[1].message).toContain('1 RFQs')
    expect(result.current.alerts[2].type).toBe('danger')
    expect(result.current.alerts[2].message).toContain('5 products')
  })

  it('handles activity with logs key', async () => {
    mockStats.mockResolvedValue({ totalProducts: 0 })
    mockAlerts.mockResolvedValue({ alerts: [] })
    mockActivity.mockResolvedValue({ logs: [{ id: 'a1', action: 'login' }, { id: 'a2', action: 'create' }] })
    mockOrdersList.mockResolvedValue({ orders: [] })
    mockRfqsList.mockResolvedValue({ rfqs: [] })
    mockOffersList.mockResolvedValue({ offers: [] })
    mockProductsList.mockResolvedValue({ products: [] })
    mockCustomersList.mockResolvedValue({ customers: [] })

    const { result } = renderHook(() => useDashboardData())

    await act(async () => {})

    expect(result.current.activity).toHaveLength(2)
  })

  it('handles activity as direct array (no logs key)', async () => {
    mockStats.mockResolvedValue({ totalProducts: 0 })
    mockAlerts.mockResolvedValue({ alerts: [] })
    mockActivity.mockResolvedValue([{ id: 'a1', action: 'login' }])
    mockOrdersList.mockResolvedValue({ orders: [] })
    mockRfqsList.mockResolvedValue({ rfqs: [] })
    mockOffersList.mockResolvedValue({ offers: [] })
    mockProductsList.mockResolvedValue({ products: [] })
    mockCustomersList.mockResolvedValue({ customers: [] })

    const { result } = renderHook(() => useDashboardData())

    await act(async () => {})

    expect(result.current.activity).toHaveLength(1)
  })
})
