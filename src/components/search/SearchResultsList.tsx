import type { SearchResult } from './SearchResultItem'
import { SearchResultItem } from './SearchResultItem'

interface SearchResultsListProps {
  results: SearchResult[]
  activeIndex: number
  onSelect: (result: SearchResult) => void
  maxHeight?: string
  /** Function that returns a translated label for a result type (e.g. t('search.products')) */
  getTypeLabel?: (type: SearchResult['type']) => string
}

/**
 * Scrollable list of search results with keyboard navigation support.
 * Used by both CommandSearch overlay and the Search page.
 */
export function SearchResultsList({
  results,
  activeIndex,
  onSelect,
  maxHeight = '400px',
  getTypeLabel,
}: SearchResultsListProps) {
  if (results.length === 0) return null

  return (
    <div className="overflow-y-auto p-2" style={{ maxHeight }}>
      {results.map((result, i) => (
        <SearchResultItem
          key={`${result.id}-${i}`}
          result={result}
          isActive={i === activeIndex}
          onClick={() => onSelect(result)}
          typeLabel={getTypeLabel?.(result.type)}
        />
      ))}
    </div>
  )
}
