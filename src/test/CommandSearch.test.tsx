import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { CommandSearch } from '../components/sections/CommandSearch'
import { useStore } from '../store/useStore'

// Mock the store — CommandSearch calls useStore() directly (no selector), returning full state
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'search.placeholder': 'Search products, brands, categories...',
        'search.products': 'Products',
        'search.pages': 'Pages',
        'search.categories': 'Categories',
        'search.recent': 'Recent',
        'search.noResults': 'No results found',
      }
      return translations[key] || key
    },
  }),
}))

// Mock the api calls
vi.mock('../lib/api', () => ({
  storefront: {
    products: { list: vi.fn().mockResolvedValue({ products: [] }) },
    categories: { list: vi.fn().mockResolvedValue({ categories: [] }) },
  },
}))

function renderCommandSearch() {
  return render(
    <BrowserRouter>
      <CommandSearch />
    </BrowserRouter>
  )
}

describe('CommandSearch', () => {
  const baseStore = {
    commandOpen: true,
    setCommandOpen: vi.fn(),
    recentSearches: [],
    addRecentSearch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // CommandSearch calls useStore() without selector — must return full state object
    vi.mocked(useStore).mockReturnValue(baseStore)
  })

  it('does not render when commandOpen is false', () => {
    vi.mocked(useStore).mockReturnValue({ ...baseStore, commandOpen: false })
    const { container } = renderCommandSearch()
    expect(container.innerHTML).toBe('')
  })

  it('renders search input when commandOpen is true', () => {
    renderCommandSearch()
    expect(screen.getByPlaceholderText('Search products, brands, categories...')).toBeInTheDocument()
  })

  it('renders search dialog when open', () => {
    renderCommandSearch()
    expect(screen.getByPlaceholderText('Search products, brands, categories...')).toBeInTheDocument()
  })

  it('shows recent searches when query is empty', () => {
    vi.mocked(useStore).mockReturnValue({ ...baseStore, recentSearches: ['hydraulic pump', 'valve'] })
    renderCommandSearch()
    expect(screen.getByText('hydraulic pump')).toBeInTheDocument()
    expect(screen.getByText('valve')).toBeInTheDocument()
  })
})
