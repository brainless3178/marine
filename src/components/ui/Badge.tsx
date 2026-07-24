import React from 'react'

interface BadgeProps {
  variant?: 'blue' | 'gold' | 'success' | 'danger' | 'default'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Badge({ variant = 'default', size = 'md', icon, children }: BadgeProps) {
  const variants = {
    blue: 'text-[var(--accent-primary)] border-[var(--info-border)] bg-[var(--info-subtle)]',
    gold: 'text-[var(--accent-gold)] border-[var(--warning-border)] bg-[var(--warning-subtle)]',
    success: 'text-[var(--success)] border-[var(--success-border)] bg-[var(--badge-published-bg)]',
    danger: 'text-[var(--danger)] border-[var(--danger-border)] bg-[var(--danger-subtle)]',
    default: 'text-[var(--text-secondary)] border-[var(--border)]',
  }

  const sizes = {
    sm: 'px-[8px] py-[4px] text-xs',
    md: 'px-[12px] py-[6px] text-xs',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono tracking-[0.5px] border ${variants[variant]} ${sizes[size]} ${variant === 'default' ? 'bg-[var(--surface)]' : ''}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  )
}
