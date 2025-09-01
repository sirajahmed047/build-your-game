'use client'

import { useState } from 'react'
import { Crown, CreditCard, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import PayPalProvider from '@/components/providers/PayPalProvider'
import PayPalCheckout from '@/components/payments/PayPalCheckout'
import { usePremiumStatus } from '@/lib/hooks/usePremiumStatus'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'

export default function PremiumDemoPage() {
  const { user } = useAuth()
  const { isActive, daysRemaining, expiresAt, packageType, loading, refreshStatus } = usePremiumStatus()
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handlePaymentSuccess = (details: any) => {
    console.log('Payment successful:', details)
    setPaymentResult(details)
    setPaymentError(null)
    setShowCheckout(false)
    refreshStatus()
  }

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error)
    setPaymentError(error.message || 'Payment failed')
    setPaymentResult(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              PayPal Premium Demo
            </h1>
            <p className="text-xl text-gray-600">
              Test the time-limited premium payment system
            </p>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>User ID:</strong> {user.id}
              </div>
              <div>
                <strong>Email:</strong> {user.email || 'Not provided'}
              </div>
            </div>
          </Card>
        )}

        {/* Premium Status */}
        <Card className={`p-6 mb-8 ${isActive ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-gray-50 to-slate-50'}`}>
          <div className="flex items-center space-x-3 mb-4">
            {isActive ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-gray-400" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              Premium Status: {isActive ? 'ACTIVE' : 'INACTIVE'}
            </h2>
          </div>
          
          {isActive ? (
            <div className="space-y-2">
              <p className="text-green-700">
                <strong>Days Remaining:</strong> {daysRemaining}
              </p>
              <p className="text-green-700">
                <strong>Expires:</strong> {expiresAt?.toLocaleDateString()} at {expiresAt?.toLocaleTimeString()}
              </p>
              <p className="text-green-700">
                <strong>Package Type:</strong> {packageType || 'Unknown'}
              </p>
            </div>
          ) : (
            <p className="text-gray-600">No active premium subscription</p>
          )}
          
          <div className="mt-4">
            <Button
              onClick={refreshStatus}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Refresh Status</span>
            </Button>
          </div>
        </Card>

        {/* Payment Result */}
        {paymentResult && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-green-800">Payment Successful!</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Payment ID:</strong> {paymentResult.paymentId}</p>
              <p><strong>Package:</strong> {paymentResult.packageName}</p>
              <p><strong>Days:</strong> {paymentResult.days}</p>
              <p><strong>Expires:</strong> {new Date(paymentResult.expiresAt).toLocaleString()}</p>
              <p><strong>Message:</strong> {paymentResult.message}</p>
            </div>
          </Card>
        )}

        {/* Payment Error */}
        {paymentError && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <div className="flex items-center space-x-3 mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold text-red-800">Payment Failed</h2>
            </div>
            <p className="text-red-700">{paymentError}</p>
          </Card>
        )}

        {/* Authentication Check */}
        {!user && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <div className="text-center">
              <h2 className="text-xl font-bold text-orange-800 mb-2">Authentication Required</h2>
              <p className="text-orange-700">Please sign in to test the payment system.</p>
            </div>
          </Card>
        )}

        {/* PayPal Checkout */}
        {user && (
          <Card className="p-6 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Payment System</h2>
              <p className="text-gray-600">
                Use PayPal sandbox to test the premium purchase flow
              </p>
            </div>
            
            {!showCheckout ? (
              <div className="text-center">
                <Button
                  onClick={() => setShowCheckout(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Start PayPal Checkout
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">PayPal Checkout</h3>
                  <Button
                    onClick={() => setShowCheckout(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
                
                <PayPalProvider>
                  <PayPalCheckout
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </PayPalProvider>
              </div>
            )}
          </Card>
        )}

        {/* Environment Info */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Environment Information</h2>
          <div className="space-y-2 text-sm font-mono">
            <p><strong>PayPal Client ID:</strong> {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'Not configured'}</p>
            <p><strong>PayPal Environment:</strong> {process.env.PAYPAL_ENVIRONMENT || 'Not configured'}</p>
            <p><strong>Base URL:</strong> {process.env.NEXT_PUBLIC_BASE_URL || 'Not configured'}</p>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Testing Instructions</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-800">1. Environment Setup</h3>
              <p className="text-gray-600">Make sure PayPal environment variables are configured in Netlify.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800">2. PayPal Sandbox</h3>
              <p className="text-gray-600">Use PayPal sandbox accounts to test payments without real money.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800">3. Test Flow</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-1">
                <li>Select a premium package</li>
                <li>Click PayPal button</li>
                <li>Complete payment in PayPal sandbox</li>
                <li>Verify premium status is activated</li>
                <li>Check expiry date calculation</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}