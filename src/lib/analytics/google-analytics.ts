/**
 * Google Analytics 4 integration for the Interactive Story Generator
 * Replaces PostHog analytics with GA4 for better cost efficiency and easier setup
 */

// Google Analytics Measurement ID (from environment variable or fallback)
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-8JC314QLY1'

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void
    dataLayer: any[]
  }
}

// Event types for type safety (same as before)
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
  story_length?: string
  challenge?: string
  step_number?: number
  choice_slug?: string
  selected_option?: string
  ending_tag?: string
  ending_rarity?: string
  
  // UI/UX events
  feature_name?: string
  button_text?: string
  page_url?: string
  referrer?: string
  
  // Session data
  device_type?: string
  browser?: string
  os?: string
  country?: string
  
  // Custom properties (GA4 supports custom parameters)
  [key: string]: any
}

/**
 * Track page views with Google Analytics
 */
export function trackPageView(url: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: title,
    page_location: url,
  })
}

/**
 * Track custom events with Google Analytics
 */
export function trackEvent(eventName: AnalyticsEvent, parameters: EventData = {}) {
  if (typeof window === 'undefined' || !window.gtag) return

  // Convert snake_case to Google Analytics format
  const cleanParameters = Object.keys(parameters).reduce((acc, key) => {
    const value = parameters[key]
    if (value !== undefined && value !== null) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)

  window.gtag('event', eventName, {
    ...cleanParameters,
    // Add timestamp for better tracking
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track story-specific events with additional context
 */
export function trackStoryEvent(
  eventName: Extract<AnalyticsEvent, 'story_start' | 'choice_made' | 'story_complete'>,
  storyData: {
    genre: string
    step_number?: number
    choice_slug?: string
    selected_option?: string
    ending_tag?: string
    ending_rarity?: string
  }
) {
  trackEvent(eventName, {
    ...storyData,
    event_category: 'story_interaction',
  })
}

/**
 * Track conversion events (premium features)
 */
export function trackConversion(action: 'premium_attempt' | 'upgrade_click' | 'subscription_start', data: EventData = {}) {
  trackEvent(action === 'premium_attempt' ? 'premium_feature_attempted' : 'upgrade_clicked', {
    ...data,
    event_category: 'conversion',
    value: action === 'subscription_start' ? 1 : undefined, // Track successful conversions
  })
}

/**
 * Set user properties (for signed-in users)
 */
export function setUserProperties(userId: string, properties: {
  subscription_tier?: string
  stories_completed?: number
  personality_type?: string
  signup_date?: string
}) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
    custom_map: properties
  })
}

/**
 * Track user engagement with personality insights
 */
export function trackPersonalityEvent(action: 'profile_viewed' | 'comparison_viewed', data: {
  personality_traits?: string[]
  comparison_type?: string
}) {
  trackEvent(action === 'profile_viewed' ? 'personality_profile_viewed' : 'trait_impact_viewed', {
    ...data,
    event_category: 'personality',
  })
}

/**
 * Track choice statistics engagement
 */
export function trackChoiceStatsEvent(action: 'viewed' | 'toggled', data: {
  choice_slug: string
  rarity_level?: string
  percentage?: number
}) {
  trackEvent(action === 'viewed' ? 'choice_statistics_viewed' : 'choice_statistics_toggled', {
    ...data,
    event_category: 'choice_stats',
  })
}
