import { getStaticImageUrl } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  textClassName?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

export function Logo({ className = '', size = 'md', showText = false, textClassName = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={getStaticImageUrl('alka-traders-logo')}
        alt="Alka Traders Logo"
        className={`${sizeClasses[size]} shrink-0 rounded-xl object-cover shadow-sm`}
      />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`font-display font-bold tracking-tight text-[var(--text-primary)] ${textClassName || 'text-xl'}`}>
            Alka Traders
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[2px] text-[var(--text-muted)]">
            Marine & Industrial Equipment
          </span>
        </span>
      )}
    </div>
  )
}
