'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Crown, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Simulate verification process
    const timer = setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your premium activation...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Premium!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. You now have access to all premium features!
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/story-demo')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Crown className="w-5 h-5 mr-2" />
            Start Premium Story
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full"
          >
            View Dashboard
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          You can access all premium features immediately. Check your dashboard for premium status details.
        </p>
      </Card>
    </div>
  )
}
