interface SectionLabelProps {
  children: React.ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span className="inline-block type-overline text-[var(--accent-gold)] mb-4">
      {children}
    </span>
  )
}
