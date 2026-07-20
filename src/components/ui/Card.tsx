import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', hover = true, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-secondary-bg border border-[var(--border)] border-l-[3px] border-l-transparent p-6 transition-all duration-300 relative ${
        hover ? 'hover:border-l-accent-blue hover:-translate-y-1' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
