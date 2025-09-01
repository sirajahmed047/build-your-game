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
    <div className="min-h-screen bg-gradient-sunset relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-sage-200/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-ocean-200/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-warm-200/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative container mx-auto py-8 px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient-primary mb-6">
            Interactive Story Generator
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Experience personalized narratives that adapt to your choices. 
            Build your personality profile and discover rare story endings.
          </p>
        </div>

        <div className="animate-slide-up">
          <ErrorBoundary>
            <StorySession 
              onStoryCompleted={handleStoryCompleted}
              onError={handleError}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}