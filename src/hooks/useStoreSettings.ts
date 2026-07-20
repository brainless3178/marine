import { useState, useEffect } from 'react'
import { storefront } from '../lib/api'

interface StoreSettings {
  whatsappNumber: string
  shippingCost: number
  taxRate: number
  rfqEmail: string
  emergencyEmail: string
  phoneNumber: string
}

const DEFAULTS: StoreSettings = {
  whatsappNumber: '919726900547',
  shippingCost: 25,
  taxRate: 0.08,
  rfqEmail: 'rfq@alkatraders.com',
  emergencyEmail: 'emergency@alkatraders.com',
  phoneNumber: '+919726900547',
}

let cachedSettings: StoreSettings = { ...DEFAULTS }
let fetchPromise: Promise<StoreSettings> | null = null

// Track settings subscribers so we can notify them on retry
let subscribers: Array<(s: StoreSettings) => void> = []

function notifySubscribers(settings: StoreSettings) {
  subscribers.forEach(fn => fn(settings))
}

async function fetchSettingsAndNotify(): Promise<StoreSettings> {
  if (fetchPromise) return fetchPromise
  fetchPromise = storefront.settings()
    .then((res) => {
      const s = res.settings || {}
      cachedSettings = {
        whatsappNumber: String(s['site.whatsappNumber'] || DEFAULTS.whatsappNumber),
        shippingCost: Number(s['site.shippingCost']) || DEFAULTS.shippingCost,
        taxRate: Number(s['site.taxRate']) || DEFAULTS.taxRate,
        rfqEmail: String(s['site.rfqEmail'] || DEFAULTS.rfqEmail),
        emergencyEmail: String(s['site.emergencyEmail'] || DEFAULTS.emergencyEmail),
        phoneNumber: String(s['site.phoneNumber'] || DEFAULTS.phoneNumber),
      }
      notifySubscribers(cachedSettings)
      return cachedSettings
    })
    .catch(() => {
      fetchPromise = null
      return DEFAULTS
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(cachedSettings)

  useEffect(() => {
    subscribers.push(setSettings)
    fetchSettingsAndNotify()
    return () => {
      subscribers = subscribers.filter(fn => fn !== setSettings)
    }
  }, [])

  return settings
}
