'use client'

import { ReactNode } from 'react'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'

interface PayPalProviderProps {
  children: ReactNode
}

const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: 'USD',
  intent: 'capture'
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  )
}

export default PayPalProvider
