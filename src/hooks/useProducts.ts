import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import type { Product } from '../types'

export function useProducts(productSource: Product[] = []) {
  const {
    searchQuery,
    selectedCategories,
    selectedBrands,
    selectedIndustry,
    priceRange,
    showOnSale,
    urgencyFilter,
    sortBy,
  } = useStore()

  const filteredProducts = useMemo(() => {
    let result = [...productSource]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const fuzzyMatch = (text: string): boolean => {
        if (text.includes(query)) return true
        let qi = 0
        for (let i = 0; i < text.length && qi < query.length; i++) {
          if (text[i] === query[qi]) qi++
        }
        return qi === query.length
      }
      result = result.filter(
        (p) =>
          fuzzyMatch(p.name.toLowerCase()) ||
          fuzzyMatch(p.sku.toLowerCase()) ||
          fuzzyMatch(p.brand.toLowerCase()) ||
          fuzzyMatch(p.category.replace(/-/g, ' ').toLowerCase())
      )
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category))
    }

    if (selectedIndustry) {
      result = result.filter((p) => p.industry && p.industry.includes(selectedIndustry))
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => {
        const brandSlug = p.brand.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')
        return selectedBrands.some((b) => brandSlug.includes(b))
      })
    }

    if (priceRange.min > 0 || priceRange.max < 10000) {
      result = result.filter((p) => {
        const effPrice = p.onSale && p.salePrice ? p.salePrice : p.price
        return effPrice >= priceRange.min && effPrice <= priceRange.max
      })
    }

    if (showOnSale) {
      result = result.filter((p) => p.onSale)
    }

    if (urgencyFilter === 'emergency') {
      result = result.filter((p) => p.availability === 'emergency')
    }

    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category))
        break
      case 'price-asc':
        result.sort((a, b) => {
          const pa = a.onSale && a.salePrice ? a.salePrice : a.price
          const pb = b.onSale && b.salePrice ? b.salePrice : b.price
          return pa - pb
        })
        break
      case 'price-desc':
        result.sort((a, b) => {
          const pa = a.onSale && a.salePrice ? a.salePrice : a.price
          const pb = b.onSale && b.salePrice ? b.salePrice : b.price
          return pb - pa
        })
        break
      default:
        break
    }

    return result
  }, [productSource, searchQuery, selectedCategories, selectedBrands, selectedIndustry, priceRange, showOnSale, urgencyFilter, sortBy])

  return {
    products: filteredProducts,
    totalCount: productSource.length,
    filteredCount: filteredProducts.length,
  }
}
