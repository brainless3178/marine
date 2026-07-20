import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { initSentry } from './lib/sentry'
initSentry()

import './index.css'
import './admin.css'
import App from './App.tsx'

import en from './locales/en.json'
import ar from './locales/ar.json'
import es from './locales/es.json'

document.documentElement.classList.add('light')

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
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
