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
      'bg-[var(--brick-ember)] text-[var(--honeydew)] border-[var(--brick-ember)] hover:bg-btn-hover-dark hover:border-btn-hover-dark hover:-translate-y-0.5 rounded-full focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2',
    outline:
      'bg-transparent text-[var(--deep-forest)] border-[var(--border)] hover:bg-[var(--honeydew)] hover:text-[var(--deep-forest)] hover:border-[var(--muted-teal)] hover:-translate-y-0.5 rounded-full',
    danger:
      'bg-danger text-[var(--text-primary)] border-danger hover:bg-danger hover:border-danger hover:-translate-y-0.5',
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
