import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { type ReactNode, useState, useEffect } from 'react'

/**
 * Wraps the app with PayPalScriptProvider.
 * Fetches the client ID from the backend so the SDK is initialized with
 * the correct sandbox / live credentials.
 */
export function PayPalProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/storefront/payments/client-id')
      .then((r) => {
        if (!r.ok) throw new Error('not configured')
        return r.json()
      })
      .then((data) => {
        const id = data.clientId
        if (!id || id.includes('YOUR_') || id === 'sandbox') {
          setClientId('test')
          return
        }
        setClientId(id)
      })
      .catch(() => {
        // Fallback to PayPal's mock 'test' client ID if backend is down
        setClientId('test')
      })
  }, [])

  // If PayPal isn't configured or errored, render children without the provider
  // so the rest of the app still works.
  if (!clientId) {
    return <>{children}</>
  }

  // Prevent double-loading the SDK if another provider instance exists
  if (typeof window !== 'undefined' && (window as any).__paypal_sdk_loaded) {
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
