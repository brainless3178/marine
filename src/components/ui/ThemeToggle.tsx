import { Sun, Moon } from 'lucide-react'
import { useStore } from '../../store/useStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useStore()

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--nav-btn-border)] bg-[var(--nav-btn-bg)] text-[var(--nav-text-muted)] transition-colors hover:border-[var(--nav-btn-hover-border)] hover:text-[var(--nav-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
