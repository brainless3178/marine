import { describe, it, expect, vi, beforeEach } from 'vitest'
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

import { useAdminDashboard } from '../hooks/useAdminDashboard'
import { admin } from '../lib/api'

const mockStats = admin.dashboard.stats as ReturnType<typeof vi.fn>
const mockAlerts = admin.dashboard.alerts as ReturnType<typeof vi.fn>
const mockActivity = admin.dashboard.activity as ReturnType<typeof vi.fn>

describe('useAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockStats.mockImplementation(() => new Promise(() => {}))
    mockAlerts.mockImplementation(() => new Promise(() => {}))
    mockActivity.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useAdminDashboard())
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('provides default stats even before API responds', () => {
    mockStats.mockImplementation(() => new Promise(() => {}))
    mockAlerts.mockImplementation(() => new Promise(() => {}))
    mockActivity.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useAdminDashboard())
    expect(result.current.stats.totalProducts).toBe(0)
    expect(result.current.stats.lowStockProducts).toEqual([])
    expect(result.current.stats.categoryBreakdown).toEqual([])
  })

  it('fetches and processes stats on mount', async () => {
    mockStats.mockResolvedValue({
      totalProducts: 255,
      inStockProducts: 200,
      outOfStockProducts: 55,
      emergencyProducts: 12,
      saleProducts: 30,
      newArrivals: 8,
      totalBrands: 25,
      totalCategories: 15,
      totalIndustries: 6,
      totalStockUnits: 1500,
      lowStockProducts: [
        { id: 'p1', name: 'Low Stock Item', sku: 'LS-001', brand: 'ABB', category: 'Marine', stockCount: 2, availability: 'in-stock', images: [{ url: '/img.jpg' }] },
      ],
      missingImageProducts: [
        { id: 'p2', name: 'No Image', sku: 'NI-001', brand: 'Siemens', category: 'Hydraulic', stockCount: 10, availability: 'in-stock', images: [] },
      ],
      categoryBreakdown: [
        { id: 'c1', name: 'Marine', count: 100 },
        { id: 'c2', name: 'Hydraulic', count: 80 },
      ],
      brandBreakdown: [
        { name: 'ABB', count: 50 },
        { name: 'Siemens', count: 30 },
      ],
      conditionBreakdown: [
        { condition: 'used', count: 150 },
        { condition: 'new', count: 100 },
        { condition: 'refurbished', count: 5 },
      ],
    })
    mockAlerts.mockResolvedValue({
      lowStockProducts: [{ id: 'p1' }],
      overdueRfqs: [{ id: 'r1' }],
      outOfStockCount: 55,
    })
    mockActivity.mockResolvedValue({
      logs: [{ id: 'a1', action: 'product.create', entityType: 'product', entityName: 'Test', actorEmail: 'admin@test.com', createdAt: '2024-01-01' }],
    })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.stats.totalProducts).toBe(255)
    expect(result.current.stats.inStockProducts).toBe(200)
    expect(result.current.stats.outOfStockProducts).toBe(55)
    expect(result.current.stats.emergencyProducts).toBe(12)
    expect(result.current.stats.saleProducts).toBe(30)
    expect(result.current.stats.newArrivals).toBe(8)
    expect(result.current.stats.totalBrands).toBe(25)
    expect(result.current.stats.totalCategories).toBe(15)
    expect(result.current.stats.totalIndustries).toBe(6)
    expect(result.current.stats.totalStockUnits).toBe(1500)
  })

  it('processes lowStockProducts with nested brand/category objects', async () => {
    mockStats.mockResolvedValue({
      totalProducts: 1,
      lowStockProducts: [
        {
          id: 'p1', name: 'Item', sku: 'SKU-1', stockCount: 1, availability: 'in-stock',
          brand: 'ABB',
          category: 'Marine',
          images: [{ url: '/img.jpg' }],
        },
      ],
      missingImageProducts: [],
      categoryBreakdown: [],
      brandBreakdown: [],
      conditionBreakdown: [],
    })
    mockAlerts.mockResolvedValue({ lowStockProducts: [], overdueRfqs: [], outOfStockCount: 0 })
    mockActivity.mockResolvedValue({ logs: [] })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.stats.lowStockProducts).toHaveLength(1)
    expect(result.current.stats.lowStockProducts[0].brand).toBe('ABB')
    expect(result.current.stats.lowStockProducts[0].category).toBe('Marine')
    expect(result.current.stats.lowStockProducts[0].hasImage).toBe(true)
  })

  it('processes alerts correctly', async () => {
    mockStats.mockResolvedValue({
      totalProducts: 0,
      lowStockProducts: [],
      missingImageProducts: [],
      categoryBreakdown: [],
      brandBreakdown: [],
      conditionBreakdown: [],
    })
    mockAlerts.mockResolvedValue({
      lowStockProducts: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      overdueRfqs: [{ id: 'r1' }],
      outOfStockCount: 10,
    })
    mockActivity.mockResolvedValue({ logs: [] })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.alerts).toHaveLength(3)
    expect(result.current.alerts[0]).toEqual({ type: 'warning', message: '3 products are low on stock', entityType: 'product' })
    expect(result.current.alerts[1]).toEqual({ type: 'danger', message: '1 RFQs have exceeded response SLA', entityType: 'rfq' })
    expect(result.current.alerts[2]).toEqual({ type: 'danger', message: '10 products are out of stock', entityType: 'product' })
  })

  it('processes activity logs', async () => {
    mockStats.mockResolvedValue({
      totalProducts: 0,
      lowStockProducts: [],
      missingImageProducts: [],
      categoryBreakdown: [],
      brandBreakdown: [],
      conditionBreakdown: [],
    })
    mockAlerts.mockResolvedValue({ lowStockProducts: [], overdueRfqs: [], outOfStockCount: 0 })
    mockActivity.mockResolvedValue({
      logs: [
        { id: 'a1', action: 'product.create', entityType: 'product', entityName: 'GPS', actorEmail: 'admin@test.com', createdAt: '2024-01-01' },
        { id: 'a2', action: 'order.update', entityType: 'order', entityName: 'Order #1', actorEmail: 'staff@test.com', createdAt: '2024-01-02' },
      ],
    })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.activity).toHaveLength(2)
    expect(result.current.activity[0].action).toBe('product.create')
    expect(result.current.activity[0].actorEmail).toBe('admin@test.com')
    expect(result.current.activity[1].entityName).toBe('Order #1')
  })

  it('sorts categoryBreakdown by count descending', async () => {
    mockStats.mockResolvedValue({
      totalProducts: 100,
      lowStockProducts: [],
      missingImageProducts: [],
      categoryBreakdown: [
        { id: 'c1', name: 'Small', count: 10 },
        { id: 'c2', name: 'Large', count: 50 },
        { id: 'c3', name: 'Medium', count: 30 },
      ],
      brandBreakdown: [],
      conditionBreakdown: [],
    })
    mockAlerts.mockResolvedValue({ lowStockProducts: [], overdueRfqs: [], outOfStockCount: 0 })
    mockActivity.mockResolvedValue({ logs: [] })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.stats.categoryBreakdown[0].name).toBe('Large')
    expect(result.current.stats.categoryBreakdown[1].name).toBe('Medium')
    expect(result.current.stats.categoryBreakdown[2].name).toBe('Small')
  })

  it('calculates percentage correctly in breakdowns', async () => {
    mockStats.mockResolvedValue({
      totalProducts: 200,
      lowStockProducts: [],
      missingImageProducts: [],
      categoryBreakdown: [
        { id: 'c1', name: 'A', count: 50 },
      ],
      brandBreakdown: [],
      conditionBreakdown: [],
    })
    mockAlerts.mockResolvedValue({ lowStockProducts: [], overdueRfqs: [], outOfStockCount: 0 })
    mockActivity.mockResolvedValue({ logs: [] })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.stats.categoryBreakdown[0].percentage).toBe(25)
  })

  it('limits brandBreakdown to top 15', async () => {
    const brands = Array.from({ length: 20 }, (_, i) => ({ name: `Brand ${i}`, count: 20 - i }))
    mockStats.mockResolvedValue({
      totalProducts: 100,
      lowStockProducts: [],
      missingImageProducts: [],
      categoryBreakdown: [],
      brandBreakdown: brands,
      conditionBreakdown: [],
    })
    mockAlerts.mockResolvedValue({ lowStockProducts: [], overdueRfqs: [], outOfStockCount: 0 })
    mockActivity.mockResolvedValue({ logs: [] })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.stats.brandBreakdown).toHaveLength(15)
  })

  it('handles stats API failure gracefully', async () => {
    mockStats.mockRejectedValue(new Error('Stats API down'))
    mockAlerts.mockResolvedValue({ lowStockProducts: [], overdueRfqs: [], outOfStockCount: 0 })
    mockActivity.mockResolvedValue({ logs: [] })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.stats.totalProducts).toBe(0)
    expect(result.current.stats.lowStockProducts).toEqual([])
  })

  it('sets error on top-level exception', async () => {
    mockStats.mockImplementation(() => { throw new Error('Fatal error') })
    mockAlerts.mockImplementation(() => { throw new Error('Fatal error') })
    mockActivity.mockImplementation(() => { throw new Error('Fatal error') })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Fatal error')
    expect(result.current.stats.totalProducts).toBe(0)
  })

  it('handles alerts with no overdueRfqs or outOfStock', async () => {
    mockStats.mockResolvedValue({
      totalProducts: 0,
      lowStockProducts: [],
      missingImageProducts: [],
      categoryBreakdown: [],
      brandBreakdown: [],
      conditionBreakdown: [],
    })
    mockAlerts.mockResolvedValue({ lowStockProducts: [], overdueRfqs: [], outOfStockCount: 0 })
    mockActivity.mockResolvedValue({ logs: [] })

    const { result } = renderHook(() => useAdminDashboard())

    await act(async () => {})

    expect(result.current.alerts).toEqual([])
  })
})
