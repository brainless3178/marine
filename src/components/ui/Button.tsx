import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  shimmer?: boolean
  icon?: React.ReactNode
  href?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  shimmer = false,
  icon,
  href,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center gap-2 font-semibold border transition-all duration-300 relative overflow-hidden'

  const variants = {
    primary:
      'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] hover:border-[var(--accent-primary-hover)] hover:-translate-y-0.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2',
    outline:
      'bg-transparent text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:-translate-y-0.5 rounded-xl',
    danger:
      'bg-danger text-[var(--btn-danger-text)] border-danger hover:bg-danger hover:border-danger hover:-translate-y-0.5',
    ghost:
      'bg-transparent text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]',
  }

  const sizes = {
    sm: 'px-[18px] py-[10px] text-xs',
    md: 'px-[28px] py-[14px] text-sm',
    lg: 'px-[36px] py-[16px] text-base',
  }

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${shimmer ? 'shimmer-btn' : ''} ${className}`

  const content = (
    <>
      {icon && <span>{icon}</span>}
      {children}
    </>
  )

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  )
}
