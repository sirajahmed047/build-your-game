import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { analytics } from '@/lib/analytics/client'

// Hook for automatic page view tracking
export function usePageTracking() {
  const router = useRouter()
  const previousPath = useRef<string>('')

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (previousPath.current !== url) {
        analytics.trackPageView(url)
        previousPath.current = url
      }
    }

    // Track initial page view
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (previousPath.current !== currentPath) {
        analytics.trackPageView(currentPath)
        previousPath.current = currentPath
      }
    }

    // Note: Next.js 13+ app router doesn't have router events
    // We'll track page views manually in components
  }, [router])
}

// Hook for story engagement tracking
export function useStoryTracking() {
  const trackStoryStart = (genre: string, length: string, challenge: string) => {
    analytics.trackStoryStart(genre, length, challenge)
  }

  const trackChoiceMade = (
    choiceSlug: string, 
    selectedOption: string, 
    stepNumber: number, 
    genre: string
  ) => {
    analytics.trackChoiceMade(choiceSlug, selectedOption, stepNumber, genre)
  }

  const trackStoryComplete = (
    endingTag: string, 
    endingRarity: string, 
    genre: string
  ) => {
    analytics.trackStoryComplete(endingTag, endingRarity, genre)
  }

  const trackChoiceStatisticsViewed = (choiceSlug: string, genre: string) => {
    analytics.trackFeatureUsage('choice_statistics_viewed', { 
      choiceSlug, 
      genre 
    })
  }

  return {
    trackStoryStart,
    trackChoiceMade,
    trackStoryComplete,
    trackChoiceStatisticsViewed
  }
}

// Hook for feature usage tracking
export function useFeatureTracking() {
  const trackFeatureUsage = (featureName: string, additionalData?: Record<string, any>) => {
    analytics.trackFeatureUsage(featureName, additionalData)
  }

  const trackEndingsGalleryViewed = (endingCount?: number) => {
    analytics.trackFeatureUsage('endings_gallery_viewed', { endingCount })
  }

  const trackPersonalityProfileViewed = (traits?: Record<string, number>) => {
    analytics.trackFeatureUsage('personality_profile_viewed', { traits })
  }

  const trackPremiumFeatureAttempt = (featureName: string) => {
    analytics.trackPremiumFeatureAttempt(featureName)
  }

  const trackUpgradeClick = (buttonText: string, context?: string) => {
    analytics.trackUpgradeClick(buttonText, context)
  }

  return {
    trackFeatureUsage,
    trackEndingsGalleryViewed,
    trackPersonalityProfileViewed,
    trackPremiumFeatureAttempt,
    trackUpgradeClick
  }
}

// Hook for session management
export function useSessionTracking() {
  const sessionStarted = useRef(false)

  useEffect(() => {
    if (!sessionStarted.current && typeof window !== 'undefined') {
      // Session is automatically started in analytics client
      sessionStarted.current = true

      // Track session end on page unload
      const handleBeforeUnload = () => {
        analytics.endSession()
      }

      window.addEventListener('beforeunload', handleBeforeUnload)
      
      // Also track session end on visibility change (when user switches tabs/apps)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          analytics.endSession()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  return {
    endSession: analytics.endSession.bind(analytics),
    getSessionInfo: analytics.getSessionInfo.bind(analytics)
  }
}

// Hook for conversion tracking
export function useConversionTracking() {
  const trackConversion = async (
    eventType: 'trial_start' | 'upgrade' | 'downgrade' | 'churn',
    fromTier?: string,
    toTier?: string,
    revenueAmount?: number
  ) => {
    try {
      const sessionInfo = analytics.getSessionInfo()
      
      if (sessionInfo.userId) {
        // This would typically be handled server-side
        // For now, we'll track it as a regular event
        await analytics.track('upgrade_clicked', {
          conversionType: eventType,
          fromTier,
          toTier,
          revenueAmount
        })
      }
    } catch (error) {
      console.warn('Failed to track conversion:', error)
    }
  }

  return {
    trackConversion
  }
}

// Combined hook for all analytics functionality
export function useAnalytics() {
  const storyTracking = useStoryTracking()
  const featureTracking = useFeatureTracking()
  const sessionTracking = useSessionTracking()
  const conversionTracking = useConversionTracking()

  return {
    ...storyTracking,
    ...featureTracking,
    ...sessionTracking,
    ...conversionTracking,
    track: analytics.track.bind(analytics)
  }
}