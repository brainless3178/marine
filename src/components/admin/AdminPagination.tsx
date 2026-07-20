import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AdminPaginationProps {
  page: number
  totalPages: number
  totalItems?: number
  itemLabel?: string
  onPageChange: (page: number) => void
  /** Show info text like "Page 1 of 5 · 42 products" — defaults to true if totalItems provided */
  showInfo?: boolean
  /** Additional class for the container */
  className?: string
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  itemLabel = 'items',
  onPageChange,
  showInfo = true,
  className = '',
}: AdminPaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
    return start + i
  }).filter((n) => n <= totalPages)

  return (
    <div className={`flex items-center justify-between border-t border-[var(--border)] px-4 py-3 ${className}`}>
      {showInfo && (
        <p className="text-xs text-[var(--text-muted)] font-medium">
          Page {page} of {totalPages}
          {totalItems != null && ` · ${totalItems} ${itemLabel}`}
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] disabled:opacity-30 hover:border-[var(--accent-gold)] transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              page === num
                ? 'bg-[var(--accent-gold)] text-navy-deep'
                : 'border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'
            }`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] disabled:opacity-30 hover:border-[var(--accent-gold)] transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
