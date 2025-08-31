import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { 
  trackEvent, 
  trackPageView, 
  trackStoryEvent, 
  trackConversion, 
  setUserProperties,
  type AnalyticsEvent,
  type EventData 
} from './google-analytics'

// Re-export types for easier importing
export type { AnalyticsEvent, EventData } from './google-analytics'

class AnalyticsClient {
  private sessionId: string
  private userId: string | null = null
  private isInitialized = false

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.initializeUser()
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return uuidv4()
    
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = uuidv4()
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  private async initializeUser() {
    if (this.isInitialized) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      this.userId = user?.id || null
      this.isInitialized = true
      
      // Set user properties in Google Analytics if user is signed in
      if (this.userId) {
        // Get user profile data for GA
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier, total_choices, created_at')
          .eq('id', this.userId)
          .single()

        if (profile) {
          setUserProperties(this.userId, {
            subscription_tier: profile.subscription_tier || undefined,
            stories_completed: Math.floor((profile.total_choices || 0) / 5), // Estimate
            signup_date: profile.created_at || undefined
          })
        }
      }
      
      // Track session start
      this.track('session_start', {
        session_id: this.sessionId,
        user_type: this.userId ? 'authenticated' : 'anonymous',
        ...this.getDeviceInfo()
      })
    } catch (error) {
      console.warn('Analytics initialization failed:', error)
      this.isInitialized = true
    }
  }

  private getDeviceInfo() {
    if (typeof window === 'undefined') {
      return {
        device_type: 'unknown',
        browser: 'unknown',
        os: 'unknown',
        country: 'unknown'
      }
    }

    const userAgent = navigator.userAgent
    
    // Simple device detection
    const device_type = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop'
    
    // Simple browser detection
    let browser = 'unknown'
    if (userAgent.includes('Chrome')) browser = 'chrome'
    else if (userAgent.includes('Firefox')) browser = 'firefox'
    else if (userAgent.includes('Safari')) browser = 'safari'
    else if (userAgent.includes('Edge')) browser = 'edge'
    
    // Simple OS detection
    let os = 'unknown'
    if (userAgent.includes('Windows')) os = 'windows'
    else if (userAgent.includes('Mac')) os = 'macos'
    else if (userAgent.includes('Linux')) os = 'linux'
    else if (userAgent.includes('Android')) os = 'android'
    else if (userAgent.includes('iOS')) os = 'ios'

    return {
      device_type,
      browser,
      os,
      country: 'unknown' // Could integrate with IP geolocation service
    }
  }

  async track(eventType: AnalyticsEvent, eventData: EventData = {}) {
    if (!this.isInitialized) {
      await this.initializeUser()
    }

    try {
      // Use Google Analytics tracking
      trackEvent(eventType, {
        ...eventData,
        session_id: this.sessionId,
        user_id: this.userId,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined
      })
    } catch (error) {
      console.warn('Failed to track analytics event:', error)
    }
  }

  // Convenience methods for common events
  async trackStoryStart(genre: string, length: string, challenge: string) {
    trackStoryEvent('story_start', { genre, step_number: 1 })
  }

  async trackChoiceMade(choiceSlug: string, selectedOption: string, stepNumber: number, genre: string) {
    trackStoryEvent('choice_made', { 
      genre,
      choice_slug: choiceSlug, 
      selected_option: selectedOption, 
      step_number: stepNumber
    })
  }

  async trackStoryComplete(endingTag: string, endingRarity: string, genre: string) {
    trackStoryEvent('story_complete', { 
      genre,
      ending_tag: endingTag, 
      ending_rarity: endingRarity 
    })
  }

  async trackFeatureUsage(featureName: string, additionalData: EventData = {}) {
    await this.track('choice_statistics_viewed', { feature_name: featureName, ...additionalData })
  }

  async trackPremiumFeatureAttempt(featureName: string) {
    trackConversion('premium_attempt', { feature_name: featureName })
  }

  async trackUpgradeClick(buttonText: string, pageUrl?: string) {
    trackConversion('upgrade_click', { button_text: buttonText, page_url: pageUrl })
  }

  async trackPageView(pageUrl?: string) {
    const url = pageUrl || (typeof window !== 'undefined' ? window.location.href : undefined)
    if (url) {
      trackPageView(url)
    }
  }

  // Session management
  async endSession() {
    try {
      await this.track('session_end', {
        session_id: this.sessionId,
        session_duration: Date.now() - parseInt(sessionStorage.getItem('session_start_time') || '0')
      })
    } catch (error) {
      console.warn('Failed to end analytics session:', error)
    }
  }

  // Update user context when auth state changes
  updateUser(userId: string | null) {
    this.userId = userId
    
    // Update Google Analytics user properties
    if (userId) {
      setUserProperties(userId, {})
    }
  }

  // Get current session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsClient()

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackStoryStart: analytics.trackStoryStart.bind(analytics),
    trackChoiceMade: analytics.trackChoiceMade.bind(analytics),
    trackStoryComplete: analytics.trackStoryComplete.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackPremiumFeatureAttempt: analytics.trackPremiumFeatureAttempt.bind(analytics),
    trackUpgradeClick: analytics.trackUpgradeClick.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    getSessionInfo: analytics.getSessionInfo.bind(analytics)
  }
}