import React from 'react'

interface BadgeProps {
  variant?: 'blue' | 'gold' | 'success' | 'danger' | 'default'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Badge({ variant = 'default', size = 'md', icon, children }: BadgeProps) {
  const variants = {
    blue: 'text-[var(--deep-forest)] border-[rgba(115,186,155,0.45)]',
    gold: 'text-[var(--brick-ember)] border-[rgba(186,45,11,0.3)]',
    success: 'text-success border-[rgba(115,186,155,0.45)]',
    danger: 'text-danger border-[rgba(186,45,11,0.3)]',
    default: 'text-[var(--text-secondary)] border-[var(--border)]',
  }

  const sizes = {
    sm: 'px-[8px] py-[4px] text-xs',
    md: 'px-[12px] py-[6px] text-xs',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono tracking-[0.5px] border ${variants[variant]} ${sizes[size]} bg-surface`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  )
}
