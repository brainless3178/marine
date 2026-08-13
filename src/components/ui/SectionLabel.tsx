interface SectionLabelProps {
  children: React.ReactNode
  /** Optional inline style — lets callers override the label color when it
   *  sits on an always-dark background (e.g. the navy shop hero) where
   *  --accent-gold has poor contrast. */
  style?: React.CSSProperties
}

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <span className="inline-block type-overline text-[var(--accent-gold)] mb-4" style={style}>
      {children}
    </span>
  )
}
