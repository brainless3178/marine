interface ProductPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ProductPagination({ currentPage, totalPages, onPageChange }: ProductPaginationProps) {
  const { t } = useTranslation()

  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce<(number | string)[]>((acc, p, i, arr) => {
      if (i > 0 && (arr[i - 1] as number) < p - 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-2 text-xs font-bold border border-[var(--border)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent-primary)] transition-colors bg-[var(--surface)] text-[var(--text-primary)]"
      >      ← Prev
    </button>
      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`dots-${i}`} className="px-1 text-xs text-[var(--text-muted)]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
              p === currentPage
                ? 'bg-[var(--accent-primary)] text-[var(--btn-blue-text)] border border-[var(--accent-primary)]'
                : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-xs font-bold border border-[var(--border)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent-primary)] transition-colors bg-[var(--surface)] text-[var(--text-primary)]"
      >
      Next →
    </button>
    </div>
  )
}
