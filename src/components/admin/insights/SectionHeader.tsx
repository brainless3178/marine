import { ChevronDown } from 'lucide-react'

export function SectionHeader({ title, collapsed, onToggle }: { title: string; collapsed?: boolean; onToggle?: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="mb-4 w-full flex items-center gap-2 group cursor-pointer select-none"
    >
      <div className="w-1 h-5 rounded-full bg-[var(--accent-gold)] group-hover:h-6 transition-all" />
      <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</h2>
      {onToggle && (
        <ChevronDown
          size={14}
          className={`ml-auto text-[var(--text-muted)] group-hover:text-[var(--accent-gold)] transition-all ${collapsed ? '-rotate-90' : 'rotate-0'}`}
        />
      )}
    </button>
  )
}
