import { Sun, Moon } from 'lucide-react'
import { useStore } from '../../store/useStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useStore()

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
