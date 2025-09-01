'use client'

import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full">
            <XCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/premium')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          If you experienced any issues, please contact our support team.
        </p>
      </Card>
    </div>
  )
}
