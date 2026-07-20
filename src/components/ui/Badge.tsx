import React from 'react'

interface BadgeProps {
  variant?: 'blue' | 'gold' | 'success' | 'danger' | 'default'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Badge({ variant = 'default', size = 'md', icon, children }: BadgeProps) {
  const variants = {
    blue: 'text-[var(--deep-forest)] border-[var(--teal-glow)]',
    gold: 'text-[var(--brick-ember)] border-[var(--brick-border)]',
    success: 'text-success border-[var(--teal-glow)]',
    danger: 'text-danger border-[var(--brick-border)]',
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
