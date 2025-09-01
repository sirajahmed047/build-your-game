'use client'

import { useState } from 'react'
import { Crown, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import PayPalProvider from '@/components/providers/PayPalProvider'
import PayPalCheckout from '@/components/payments/PayPalCheckout'
import { usePremiumStatus } from '@/lib/hooks/usePremiumStatus'

export default function PremiumPage() {
  const { isActive, expiresAt, daysRemaining, loading, refreshStatus } = usePremiumStatus()
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const handlePaymentSuccess = (details: any) => {
    console.log('Payment successful:', details)
    setPurchaseSuccess(true)
    setPurchaseError(null)
    refreshStatus() // Refresh premium status
  }

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error)
    setPurchaseError(error.message || 'Payment failed. Please try again.')
    setPurchaseSuccess(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading premium status...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
              <Crown className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Unlock Premium Features
          </h1>
          <p className="text-xl text-gray-600">
            One-time payment • Time-limited access • No recurring charges
          </p>
        </div>

        {/* Current Status */}
        {isActive && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-green-800">Premium Active!</h2>
            </div>
            <div className="text-center space-y-2">
              <p className="text-green-700">
                Your premium access expires in <strong>{daysRemaining} days</strong>
              </p>
              <p className="text-sm text-green-600">
                Expires on {expiresAt?.toLocaleDateString()}
              </p>
            </div>
          </Card>
        )}

        {/* Purchase Success */}
        {purchaseSuccess && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-green-800">Payment Successful!</h2>
            </div>
            <p className="text-center text-green-700">
              Your premium features have been activated. Enjoy unlimited storytelling!
            </p>
          </Card>
        )}

        {/* Purchase Error */}
        {purchaseError && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold text-red-800">Payment Failed</h2>
            </div>
            <p className="text-center text-red-700">{purchaseError}</p>
          </Card>
        )}

        {/* Premium Features */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What You Get with Premium
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Extended Stories</h3>
                  <p className="text-gray-600">Immersive 45-minute narratives with deeper character development</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Premium Genres</h3>
                  <p className="text-gray-600">Access to Horror, Romance, and Thriller story genres</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Advanced Analytics</h3>
                  <p className="text-gray-600">Detailed personality insights and decision-making patterns</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Unlimited Stories</h3>
                  <p className="text-gray-600">No daily limits - create as many stories as you want</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Rare Endings</h3>
                  <p className="text-gray-600">Unlock ultra-rare story endings and collect them all</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Priority Support</h3>
                  <p className="text-gray-600">Get faster responses to questions and issues</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* PayPal Checkout */}
        <PayPalProvider>
          <PayPalCheckout
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </PayPalProvider>

        {/* FAQ */}
        <Card className="p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How does time-limited premium work?</h3>
              <p className="text-gray-600">
                You pay once and get premium access for a specific number of days (30, 60, or 120). 
                After that period, your account returns to the free tier. No recurring charges!
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I extend my premium access?</h3>
              <p className="text-gray-600">
                Yes! You can purchase additional time at any point, and it will be added to your current premium period.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens to my stories when premium expires?</h3>
              <p className="text-gray-600">
                All your stories, endings, and progress are saved permanently. You just won&apos;t be able to create new premium content until you renew.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is this secure?</h3>
              <p className="text-gray-600">
                Yes! All payments are processed securely through PayPal. We never store your payment information.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
