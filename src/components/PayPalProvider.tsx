import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { type ReactNode, useState, useEffect } from 'react'
import { storefront } from '../lib/api/storefront'

/**
 * Wraps the app with PayPalScriptProvider.
 * Fetches the client ID from the backend (through API_BASE, so it works from
 * any host) and initializes the SDK with the real sandbox / live credentials.
 *
 * No demo fallbacks: if the backend can't be reached or PayPal isn't
 * configured, the SDK is simply not loaded and PayPal buttons render as
 * unavailable — the rest of the app keeps working.
 */
export function PayPalProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    storefront.payments
      .clientId()
      .then((data) => {
        if (cancelled) return
        const id = data.clientId
        // A placeholder or sandbox value means PayPal isn't configured on the
        // backend yet — render without PayPal rather than with a fake ID.
        if (!id || id.includes('YOUR_') || id === 'sandbox' || id === 'test') {
          setClientId(null)
          return
        }
        setClientId(id)
      })
      .catch(() => {
        // Backend unreachable → no PayPal. Never fall back to a demo ID.
        if (!cancelled) setClientId(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // If PayPal isn't configured or errored, render children without the provider
  // so the rest of the app still works.
  if (!clientId) {
    return <>{children}</>
  }

  // Prevent double-loading the SDK if another provider instance exists
  if (typeof window !== 'undefined' && (window as unknown as Record<string, boolean>).__paypal_sdk_loaded) {
    return <>{children}</>
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: 'USD',
        intent: 'capture',
        'enable-funding': 'venmo,card',
        components: 'buttons',
      }}
    >
      {children}
    </PayPalScriptProvider>
  )
}
