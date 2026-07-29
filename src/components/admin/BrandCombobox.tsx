import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, Plus, ChevronDown, X } from 'lucide-react'

interface BrandComboboxProps {
  value: string
  brands: { id: string; name: string }[]
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  className?: string
}

// Simple UUID check — existing brand IDs are UUIDs, new brand names are plain text
function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

export function BrandCombobox({ value, brands, onChange, onBlur, error, className = '' }: BrandComboboxProps) {
  // Resolve display name from the stored ID
  const selectedBrand = useMemo(
    () => (value && isUuid(value) ? brands.find((b) => b.id === value) : null),
    [value, brands]
  )

  const [searchText, setSearchText] = useState(selectedBrand?.name || (value && !isUuid(value) ? value : ''))
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Sync searchText when value changes externally (e.g., form reset / load)
  useEffect(() => {
    if (!isOpen) {
      const match = value && isUuid(value) ? brands.find((b) => b.id === value) : null
      if (match) {
        setSearchText(match.name)
      } else if (value && !isUuid(value)) {
        setSearchText(value)
      } else {
        setSearchText('')
      }
    }
  }, [value, brands, isOpen])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredBrands = useMemo(() => {
    if (!searchText.trim()) return brands.slice(0, 50)
    const q = searchText.toLowerCase()
    return brands
      .filter((b) => b.name.toLowerCase().includes(q))
      .slice(0, 50)
  }, [searchText, brands])

  // Check if the current search text exactly matches an existing brand
  const exactMatch = useMemo(
    () => brands.find((b) => b.name.toLowerCase() === searchText.trim().toLowerCase()),
    [searchText, brands]
  )

  // Determine if the current input represents a "new brand" to be created
  const isNewBrand = searchText.trim().length > 0 && !exactMatch

  const handleSelect = (brandId: string, brandName: string) => {
    setSearchText(brandName)
    onChange(brandId)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleInputChange = (text: string) => {
    setSearchText(text)
    setIsOpen(true)

    // While typing, check if text matches an existing brand
    const match = brands.find((b) => b.name.toLowerCase() === text.trim().toLowerCase())

    if (match) {
      // Exact match — use brand ID
      onChange(match.id)
    } else if (text.trim()) {
      // No match — store as raw text (new brand name)
      onChange(text.trim())
    } else {
      // Empty — clear
      onChange('')
    }
  }

  const handleClear = () => {
    setSearchText('')
    onChange('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    // Delay blur so click on dropdown registers first
    setTimeout(() => {
      setIsOpen(false)
      onBlur?.()
    }, 200)
  }

  const inputBaseClass =
    'w-full rounded-xl border bg-[var(--surface-soft)] px-4 py-2.5 pr-16 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all'

  const borderClass = error
    ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]'
    : 'border-[var(--border)] focus:border-[var(--accent-gold)] focus:shadow-[0_0_0_3px_rgba(232,170,36,0.1)]'

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          placeholder="Search or type a new brand..."
          className={`${inputBaseClass} ${borderClass} ${className}`}
          aria-label="Brand"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        {/* Right-side icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchText && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
              tabIndex={-1}
              aria-label="Clear brand"
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-5 w-5 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            tabIndex={-1}
            aria-label={isOpen ? 'Close suggestions' : 'Open suggestions'}
          >
            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selected brand indicator */}
      {selectedBrand && !isOpen && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          <span className="text-[0.625rem] font-medium text-[var(--text-secondary)]">
            {selectedBrand.name}
          </span>
        </div>
      )}
      {isNewBrand && !isOpen && searchText.trim() && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-gold)]" />
          <span className="text-[0.625rem] font-medium text-[var(--accent-gold)]">
            New brand: "{searchText.trim()}" will be created on save
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-1 text-[0.625rem] font-bold text-[var(--danger)] flex items-center gap-1">
          {error}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden"
        >
          {filteredBrands.length > 0 && (
            <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
              {filteredBrands.map((brand) => {
                const isSelected = value === brand.id
                return (
                  <li
                    key={brand.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(brand.id, brand.name)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--surface-soft)]'
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      isSelected
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-navy-deep'
                        : 'border-[var(--border)]'
                    }`}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span className="flex-1">{brand.name}</span>
                  </li>
                )
              })}
            </ul>
          )}

          {/* New brand option */}
          {isNewBrand && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-2.5 text-sm text-[var(--accent-gold)] bg-[var(--accent-gold)]/5"
            >
              <Plus size={14} />
              <span>Create new brand: <strong>"{searchText.trim()}"</strong></span>
            </div>
          )}

          {/* No results and not creating new */}
          {filteredBrands.length === 0 && !isNewBrand && (
            <div className="px-4 py-3 text-sm text-[var(--text-muted)]">
              {searchText.trim() ? 'No brands found' : 'Start typing to search brands'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
