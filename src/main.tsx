import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from '@tanstack/react-query'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { initSentry } from './lib/sentry'
import { queryClient } from './lib/queryClient'
initSentry()

import './index.css'
import App from './App.tsx'

import en from './locales/en.json'
import ar from './locales/ar.json'
import es from './locales/es.json'

// Detect initial theme preference
const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
const storedTheme = localStorage.getItem('alka-theme')
if (storedTheme === 'dark' || (!storedTheme && !prefersLight)) {
  document.documentElement.classList.remove('light')
  document.documentElement.classList.add('dark')
  localStorage.setItem('alka-theme', 'dark')
} else {
  document.documentElement.classList.add('light')
  localStorage.setItem('alka-theme', 'light')
}

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
        <App />
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>,
)
