import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

// Event types for type safety
export type AnalyticsEvent = 
  | 'story_start'
  | 'choice_made'
  | 'story_complete'
  | 'story_step_viewed'
  | 'choice_statistics_viewed'
  | 'choice_statistics_toggled'
  | 'choice_with_traits_selected'
  | 'trait_impact_viewed'
  | 'endings_gallery_viewed'
  | 'personality_profile_viewed'
  | 'premium_feature_attempted'
  | 'upgrade_clicked'
  | 'page_view'
  | 'session_start'
  | 'session_end'

export interface EventData {
  // Story-related events
  genre?: string
  storyLength?: string
  challenge?: string
  stepNumber?: number
  choiceSlug?: string
  selectedOption?: string
  endingTag?: string
  endingRarity?: string
  
  // UI/UX events
  featureName?: string
  buttonText?: string
  pageUrl?: string
  referrer?: string
  
  // Session data
  deviceType?: string
  browser?: string
  os?: string
  country?: string
  
  // Custom properties
  [key: string]: any
}

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
      
      // Start session tracking
      await this.startSession()
    } catch (error) {
      console.warn('Analytics initialization failed:', error)
      this.isInitialized = true
    }
  }

  private async startSession() {
    if (typeof window === 'undefined') return

    const deviceInfo = this.getDeviceInfo()
    
    try {
      await supabase.rpc('start_user_session', {
        p_user_id: this.userId,
        p_session_id: this.sessionId,
        p_device_type: deviceInfo.deviceType,
        p_browser: deviceInfo.browser,
        p_os: deviceInfo.os,
        p_country: deviceInfo.country,
        p_referrer: document.referrer || null
      })
    } catch (error) {
      console.warn('Failed to start analytics session:', error)
    }
  }

  private getDeviceInfo() {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'unknown',
        browser: 'unknown',
        os: 'unknown',
        country: 'unknown'
      }
    }

    const userAgent = navigator.userAgent
    
    // Simple device detection
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop'
    
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
      deviceType,
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
      await supabase.rpc('track_user_event', {
        p_user_id: this.userId,
        p_session_id: this.sessionId,
        p_event_type: eventType,
        p_event_data: eventData,
        p_page_url: typeof window !== 'undefined' ? window.location.href : null,
        p_user_agent: typeof window !== 'undefined' ? navigator.userAgent : null
      })
    } catch (error) {
      console.warn('Failed to track analytics event:', error)
    }
  }

  // Convenience methods for common events
  async trackStoryStart(genre: string, length: string, challenge: string) {
    await this.track('story_start', { genre, storyLength: length, challenge })
  }

  async trackChoiceMade(choiceSlug: string, selectedOption: string, stepNumber: number, genre: string) {
    await this.track('choice_made', { 
      choiceSlug, 
      selectedOption, 
      stepNumber, 
      genre 
    })
  }

  async trackStoryComplete(endingTag: string, endingRarity: string, genre: string) {
    await this.track('story_complete', { endingTag, endingRarity, genre })
  }

  async trackFeatureUsage(featureName: string, additionalData: EventData = {}) {
    await this.track('choice_statistics_viewed', { featureName, ...additionalData })
  }

  async trackPremiumFeatureAttempt(featureName: string) {
    await this.track('premium_feature_attempted', { featureName })
  }

  async trackUpgradeClick(buttonText: string, pageUrl?: string) {
    await this.track('upgrade_clicked', { buttonText, pageUrl })
  }

  async trackPageView(pageUrl?: string) {
    await this.track('page_view', { 
      pageUrl: pageUrl || (typeof window !== 'undefined' ? window.location.href : undefined)
    })
  }

  // Session management
  async endSession() {
    try {
      await supabase.rpc('end_user_session', {
        p_session_id: this.sessionId
      })
    } catch (error) {
      console.warn('Failed to end analytics session:', error)
    }
  }

  // Update user context when auth state changes
  updateUser(userId: string | null) {
    this.userId = userId
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