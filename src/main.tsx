import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from '@tanstack/react-query'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { initSentry } from './lib/sentry'
import { queryClient } from './lib/queryClient'
import { TickerProvider } from './components/TickerProvider'
initSentry()

import './index.css'
import App from './App.tsx'

import en from './locales/en.json'
import ar from './locales/ar.json'
import es from './locales/es.json'
import { resolveInitialTheme, syncThemeColor } from './lib/theme'

// Apply the saved theme (or the VITE_DEFAULT_THEME env default, light unless
// configured otherwise). Runs after the inline script in index.html, which
// already painted the right theme — this keeps store/classes in sync.
const initialTheme = resolveInitialTheme()
if (initialTheme === 'dark') {
  document.documentElement.classList.remove('light')
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.add('light')
  document.documentElement.classList.remove('dark')
}
localStorage.setItem('alka-theme', initialTheme)
syncThemeColor(initialTheme)

// Detect initial language for RTL support
const browserLang = navigator.language?.startsWith('ar') ? 'ar' : navigator.language?.startsWith('es') ? 'es' : 'en'
if (browserLang !== 'en') {
  document.documentElement.dir = browserLang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = browserLang
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    es: { translation: es },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TickerProvider>
          <App />
        </TickerProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>,
)
