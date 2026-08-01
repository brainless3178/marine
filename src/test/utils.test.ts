import { describe, it, expect } from 'vitest'
import { getImageFallbackUrl, applyImageFallback } from '../lib/utils'

// Test any utility functions that might exist
// Since the project may not have a dedicated utils file, we test inline utilities

describe('String utilities', () => {
  it('slugifies product names correctly', () => {
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    expect(slugify('Marine GPS Navigator')).toBe('marine-gps-navigator')
    expect(slugify('Hydraulic Pump HP-200')).toBe('hydraulic-pump-hp-200')
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    expect(slugify('Special@Characters!')).toBe('special-characters')
    expect(slugify('')).toBe('')
  })

  it('truncates text correctly', () => {
    const truncate = (text: string, maxLength: number) =>
      text.length > maxLength ? text.slice(0, maxLength) + '...' : text

    expect(truncate('Hello World', 5)).toBe('Hello...')
    expect(truncate('Hi', 10)).toBe('Hi')
    expect(truncate('Exact', 5)).toBe('Exact')
    expect(truncate('', 5)).toBe('')
  })

  it('capitalizes first letter', () => {
    const capitalize = (text: string) =>
      text.charAt(0).toUpperCase() + text.slice(1)

    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('marine')).toBe('Marine')
    expect(capitalize('')).toBe('')
    expect(capitalize('a')).toBe('A')
  })
})

describe('Number utilities', () => {
  it('formats large numbers with abbreviations', () => {
    const formatNumber = (num: number): string => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toString()
    }

    expect(formatNumber(500)).toBe('500')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(1500000)).toBe('1.5M')
  })

  it('clamps numbers between min and max', () => {
    const clamp = (num: number, min: number, max: number) =>
      Math.min(Math.max(num, min), max)

    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('calculates percentage correctly', () => {
    const percentage = (part: number, total: number) =>
      total === 0 ? 0 : Math.round((part / total) * 100)

    expect(percentage(25, 100)).toBe(25)
    expect(percentage(1, 3)).toBe(33)
    expect(percentage(0, 100)).toBe(0)
    expect(percentage(100, 0)).toBe(0)
  })
})

describe('Array utilities', () => {
  it('removes duplicates from array', () => {
    const unique = <T>(arr: T[]): T[] => [...new Set(arr)]

    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
    expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b'])
    expect(unique([])).toEqual([])
  })

  it('chunks array into groups', () => {
    const chunk = <T>(arr: T[], size: number): T[][] => {
      const chunks: T[][] = []
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size))
      }
      return chunks
    }

    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]])
    expect(chunk([], 2)).toEqual([])
  })

  it('sorts array of objects by key', () => {
    const sortBy = <T>(arr: T[], key: keyof T, desc = false): T[] =>
      [...arr].sort((a, b) => {
        const aVal = a[key]
        const bVal = b[key]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return desc ? -comparison : comparison
      })

    const items = [{ name: 'Banana' }, { name: 'Apple' }, { name: 'Cherry' }]
    const sorted = sortBy(items, 'name')
    expect(sorted.map(i => i.name)).toEqual(['Apple', 'Banana', 'Cherry'])

    const descSorted = sortBy(items, 'name', true)
    expect(descSorted.map(i => i.name)).toEqual(['Cherry', 'Banana', 'Apple'])
  })
})

describe('Date utilities', () => {
  it('formats date to readable string', () => {
    const formatDate = (date: Date): string =>
      date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

    const date = new Date('2024-01-15')
    const formatted = formatDate(date)
    expect(formatted).toContain('Jan')
    expect(formatted).toContain('15')
    expect(formatted).toContain('2024')
  })

  it('checks if date is recent (within days)', () => {
    const isRecent = (date: Date, days: number): boolean => {
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const daysMs = days * 24 * 60 * 60 * 1000
      return diff <= daysMs
    }

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)

    expect(isRecent(now, 7)).toBe(true)
    expect(isRecent(yesterday, 7)).toBe(true)
    expect(isRecent(lastWeek, 7)).toBe(false)
  })
})

describe('Email validation', () => {
  it('validates email format', () => {
    const isValidEmail = (email: string): boolean => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return regex.test(email)
    }

    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('name.last@domain.co')).toBe(true)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('@no.com')).toBe(false)
    expect(isValidEmail('no@.com')).toBe(false)
    expect(isValidEmail('no@com')).toBe(false)
  })
})

describe('URL utilities', () => {
  it('builds query string from object', () => {
    const buildQueryString = (params: Record<string, string | number | boolean>): string => {
      const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      if (entries.length === 0) return ''
      return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    }

    expect(buildQueryString({ page: 1, search: 'test' })).toBe('?page=1&search=test')
    expect(buildQueryString({ page: 1, search: '' })).toBe('?page=1')
    expect(buildQueryString({})).toBe('')
  })

  it('parses query string to object', () => {
    const parseQueryString = (qs: string): Record<string, string> => {
      const params = new URLSearchParams(qs)
      const result: Record<string, string> = {}
      params.forEach((value, key) => {
        result[key] = value
      })
      return result
    }

    expect(parseQueryString('?page=1&search=test')).toEqual({ page: '1', search: 'test' })
    expect(parseQueryString('')).toEqual({})
  })
})

describe('Image fallback helpers', () => {
  describe('getImageFallbackUrl', () => {
    it('maps a Cloudinary product URL to the local deployed copy', () => {
      expect(getImageFallbackUrl('https://res.cloudinary.com/y7up4zti/image/upload/v1/alka/products/product-106'))
        .toBe('/images/products/product-106.jpg')
    })

    it('preserves the category suffix for products 001-100', () => {
      expect(getImageFallbackUrl('https://res.cloudinary.com/y7up4zti/image/upload/v1/alka/products/product-001_electrical'))
        .toBe('/images/products/product-001_electrical.jpg')
    })

    it('handles versioned Cloudinary URLs', () => {
      expect(getImageFallbackUrl('https://res.cloudinary.com/y7up4zti/image/upload/v1785148282/alka/products/product-220'))
        .toBe('/images/products/product-220.jpg')
    })

    it('falls back to the generic placeholder for non-product URLs', () => {
      expect(getImageFallbackUrl('https://res.cloudinary.com/y7up4zti/image/upload/v1/alka/categories/marine'))
        .toBe('/images/placeholder.jpg')
      expect(getImageFallbackUrl('/uploads/some-file.png'))
        .toBe('/images/placeholder.jpg')
      expect(getImageFallbackUrl('https://example.com/other.png'))
        .toBe('/images/placeholder.jpg')
    })
  })

  describe('applyImageFallback', () => {
    it('swaps a failed Cloudinary product src to the local copy', () => {
      const img = document.createElement('img')
      img.src = 'https://res.cloudinary.com/y7up4zti/image/upload/v1/alka/products/product-106'
      applyImageFallback(img)
      expect(img.src).toContain('/images/products/product-106.jpg')
    })

    it('swaps a failed local product src to the placeholder', () => {
      const img = document.createElement('img')
      img.src = '/images/products/product-106.jpg'
      applyImageFallback(img)
      expect(img.src).toContain('/images/placeholder.jpg')
    })

    it('stops the chain after the placeholder fails', () => {
      const img = document.createElement('img')
      img.src = '/images/placeholder.jpg'
      applyImageFallback(img)
      expect(img.onerror).toBeNull()
    })

    it('leaves non-product images untouched', () => {
      const img = document.createElement('img')
      img.src = 'https://res.cloudinary.com/y7up4zti/image/upload/v1/alka/brands/logo'
      img.onerror = () => { /* caller handler */ }
      applyImageFallback(img)
      expect(img.getAttribute('src')).toBe('https://res.cloudinary.com/y7up4zti/image/upload/v1/alka/brands/logo')
      expect(img.onerror).not.toBeNull()
    })
  })
})
