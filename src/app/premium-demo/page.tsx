'use client'

import { PremiumFeatureDemo } from '@/components/subscription'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PremiumDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Premium Features Demo
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Explore all the premium features that make your storytelling experience extraordinary.
            </p>
          </div>
        </div>

        {/* Demo Content */}
        <ErrorBoundary>
          <PremiumFeatureDemo />
        </ErrorBoundary>
      </div>
    </div>
  )
}