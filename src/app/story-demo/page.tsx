'use client'

import { StorySession } from '@/components/story/StorySession'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function StoryDemoPage() {
  const handleStoryCompleted = (session: any) => {
    console.log('Story completed:', session)
    // Could show completion modal, save to analytics, etc.
  }

  const handleError = (error: string) => {
    console.error('Story error:', error)
    // Could show error toast, report to error tracking, etc.
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Interactive Story Generator
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Experience personalized narratives that adapt to your choices. 
            Build your personality profile and discover rare story endings.
          </p>
        </div>

        <ErrorBoundary>
          <StorySession 
            onStoryCompleted={handleStoryCompleted}
            onError={handleError}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}