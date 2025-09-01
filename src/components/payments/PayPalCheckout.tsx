'use client'

import { useState } from 'react'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { Crown, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/auth/AuthProvider'

interface PremiumPackage {
  id: string
  price: number
  days: number
  name: string
  description: string
  popular?: boolean
  features: string[]
}

interface PayPalCheckoutProps {
  onSuccess?: (details: any) => void
  onError?: (error: any) => void
}

const PREMIUM_PACKAGES: PremiumPackage[] = [
  {
    id: 'starter_30',
    price: 3.00,
    days: 30,
    name: 'Starter',
    description: 'Perfect for trying premium features',
    features: ['Extended stories', '2 exclusive genres', 'Advanced personality insights']
  },
  {
    id: 'popular_60',
    price: 5.00,
    days: 60,
    name: 'Popular',
    description: 'Best value for regular users',
    popular: true,
    features: ['All premium stories', 'All genres', 'Rare ending previews', 'Choice statistics']
  },
  {
    id: 'value_120',
    price: 8.00,
    days: 120,
    name: 'Best Value',
    description: 'Maximum savings for avid storytellers',
    features: ['Everything + Ultra-rare endings', 'Personality deep-dive', 'Story creation tools']
  }
]

export function PayPalCheckout({ onSuccess, onError }: PayPalCheckoutProps) {
  const { user } = useAuth()
  const [selectedPackage, setSelectedPackage] = useState<PremiumPackage | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paypalScriptReducer] = usePayPalScriptReducer()

  const handlePackageSelect = (pkg: PremiumPackage) => {
    setSelectedPackage(pkg)
  }

  const createOrder = async () => {
    if (!selectedPackage || !user) {
      throw new Error('Package or user not selected')
    }

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageType: selectedPackage.id,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const data = await response.json()
      return data.orderId

    } catch (error) {
      console.error('Create order error:', error)
      throw error
    }
  }

  const onApprove = async (data: any) => {
    if (!selectedPackage || !user) return

    try {
      setProcessing(true)
      
      const response = await fetch('/api/payments/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderID,
          packageType: selectedPackage.id,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to capture payment')
      }

      const result = await response.json()
      
      if (onSuccess) {
        onSuccess({
          ...result,
          packageName: selectedPackage.name,
          days: selectedPackage.days
        })
      }

    } catch (error) {
      console.error('Payment capture error:', error)
      if (onError) {
        onError(error)
      }
    } finally {
      setProcessing(false)
    }
  }

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">Please sign in to purchase premium access.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Package Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PREMIUM_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={`p-6 cursor-pointer transition-all relative ${
              selectedPackage?.id === pkg.id
                ? 'ring-2 ring-purple-500 border-purple-200'
                : 'hover:border-purple-200'
            } ${pkg.popular ? 'border-purple-300' : ''}`}
            onClick={() => handlePackageSelect(pkg)}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-4">
              <div className="flex justify-center mb-2">
                <div className={`p-3 rounded-full ${
                  pkg.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-500'
                }`}>
                  {pkg.id === 'starter_30' && <Clock className="w-6 h-6 text-white" />}
                  {pkg.id === 'popular_60' && <Crown className="w-6 h-6 text-white" />}
                  {pkg.id === 'value_120' && <Zap className="w-6 h-6 text-white" />}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
              <p className="text-gray-600 text-sm">{pkg.description}</p>
            </div>

            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-gray-900">${pkg.price}</div>
              <div className="text-sm text-gray-600">{pkg.days} days</div>
              <div className="text-xs text-green-600">${(pkg.price / pkg.days).toFixed(3)}/day</div>
            </div>

            <ul className="space-y-2 mb-4">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {selectedPackage?.id === pkg.id && (
              <div className="text-center">
                <div className="w-4 h-4 bg-purple-500 rounded-full mx-auto"></div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* PayPal Payment */}
      {selectedPackage && (
        <Card className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Complete Your Purchase
            </h3>
            <p className="text-gray-600">
              {selectedPackage.name} Package - ${selectedPackage.price} for {selectedPackage.days} days
            </p>
          </div>

          {processing && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Processing payment...</span>
              </div>
            </div>
          )}

          <div className={processing ? 'opacity-50 pointer-events-none' : ''}>
            <PayPalButtons
              style={{
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal'
              }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={(error) => {
                console.error('PayPal error:', error)
                if (onError) onError(error)
              }}
              disabled={processing}
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Secure payment powered by PayPal • Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default PayPalCheckout
