import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

export type SubscriptionTier = 'free' | 'premium'

export interface SubscriptionStatus {
  tier: SubscriptionTier
  isActive: boolean
  expiresAt?: Date | null
  daysRemaining?: number
  features: SubscriptionFeatures
}

export interface SubscriptionFeatures {
  dailyStoryLimit: number
  extendedStoryLength: boolean
  premiumGenres: string[]
  advancedAnalytics: boolean
  prioritySupport: boolean
}

export interface UsageLimits {
  storiesUsedToday: number
  dailyLimit: number
  remainingStories: number
  resetTime: Date
}

const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    dailyStoryLimit: 10,
    extendedStoryLength: false,
    premiumGenres: [],
    advancedAnalytics: false,
    prioritySupport: false
  },
  premium: {
    dailyStoryLimit: 100,
    extendedStoryLength: true,
    premiumGenres: ['horror', 'romance', 'thriller'],
    advancedAnalytics: true,
    prioritySupport: true
  }
}

/**
 * Check if user has active time-limited premium
 */
async function checkTimeLimitedPremium(userId: string): Promise<{
  isActive: boolean
  expiresAt: Date | null
  daysRemaining: number
}> {
  try {
    // Get the latest completed purchase
    const { data: purchases, error } = await supabase
      .from('premium_purchases')
      .select('expires_at, created_at')
      .eq('user_id', userId)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !purchases || purchases.length === 0) {
      return { isActive: false, expiresAt: null, daysRemaining: 0 }
    }

    const purchase = purchases[0]
    const expiresAt = new Date(purchase.expires_at)
    
    const now = new Date()
    const isActive = expiresAt > now
    const daysRemaining = isActive 
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return { isActive, expiresAt: isActive ? expiresAt : null, daysRemaining }
  } catch (error) {
    console.error('Error checking time-limited premium:', error)
    return { isActive: false, expiresAt: null, daysRemaining: 0 }
  }
}

/**
 * Get user's current subscription status (updated for time-limited premium)
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const premiumStatus = await checkTimeLimitedPremium(userId)
  
  const tier: SubscriptionTier = premiumStatus.isActive ? 'premium' : 'free'
  
  return {
    tier,
    isActive: premiumStatus.isActive,
    expiresAt: premiumStatus.expiresAt,
    daysRemaining: premiumStatus.daysRemaining,
    features: SUBSCRIPTION_FEATURES[tier]
  }
}

/**
 * Check if user can access premium content
 */
export async function canAccessPremiumContent(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.tier === 'premium' && status.isActive
}

/**
 * Check if user can use extended story length
 */
export async function canUseExtendedLength(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.features.extendedStoryLength
}

/**
 * Check if user can access premium genres
 */
export async function canAccessGenre(userId: string, genre: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  const premiumGenres = status.features.premiumGenres
  
  // Core genres are always available
  const coreGenres = ['fantasy', 'mystery', 'sci-fi']
  if (coreGenres.includes(genre)) {
    return true
  }
  
  // Premium genres require subscription
  return premiumGenres.includes(genre)
}

/**
 * Get current usage limits for user
 */
export async function getUsageLimits(userId: string): Promise<UsageLimits> {
  try {
    const status = await getSubscriptionStatus(userId)
    const today = new Date().toISOString().split('T')[0]
    
    // Count stories created today
    const { data: storyRuns, error } = await supabase
      .from('story_runs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)

    if (error) {
      console.error('Error fetching usage limits:', error)
      return {
        storiesUsedToday: 0,
        dailyLimit: status.features.dailyStoryLimit,
        remainingStories: status.features.dailyStoryLimit,
        resetTime: getNextResetTime()
      }
    }

    const storiesUsedToday = storyRuns?.length || 0
    const remainingStories = Math.max(0, status.features.dailyStoryLimit - storiesUsedToday)

    return {
      storiesUsedToday,
      dailyLimit: status.features.dailyStoryLimit,
      remainingStories,
      resetTime: getNextResetTime()
    }
  } catch (error) {
    console.error('Usage limits check failed:', error)
    return {
      storiesUsedToday: 0,
      dailyLimit: 10,
      remainingStories: 10,
      resetTime: getNextResetTime()
    }
  }
}

/**
 * Check if user has reached their daily limit
 */
export async function hasReachedDailyLimit(userId: string): Promise<boolean> {
  const limits = await getUsageLimits(userId)
  return limits.remainingStories <= 0
}

/**
 * Upgrade user to premium tier
 */
export async function upgradeToPremium(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        subscription_tier: 'premium',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error upgrading to premium:', error)
      throw new Error('Failed to upgrade subscription')
    }

    // Track conversion event
    await trackConversionEvent(userId, 'upgrade', 'free', 'premium')
  } catch (error) {
    console.error('Premium upgrade failed:', error)
    throw error
  }
}

/**
 * Downgrade user to free tier
 */
export async function downgradeToFree(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        subscription_tier: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error downgrading to free:', error)
      throw new Error('Failed to downgrade subscription')
    }

    // Track conversion event
    await trackConversionEvent(userId, 'downgrade', 'premium', 'free')
  } catch (error) {
    console.error('Free downgrade failed:', error)
    throw error
  }
}

/**
 * Track conversion events for analytics
 * Note: Conversion events table not implemented yet, logging for now
 */
async function trackConversionEvent(
  userId: string, 
  eventType: string, 
  fromTier: string, 
  toTier: string,
  revenueAmount?: number
): Promise<void> {
  try {
    // Log conversion event for now - can be replaced with actual table later
    console.log('Conversion event:', {
      userId,
      eventType,
      fromTier,
      toTier,
      revenueAmount,
      timestamp: new Date().toISOString()
    })
    
    // TODO: Implement conversion_events table and uncomment below
    // const { error } = await supabase
    //   .from('conversion_events')
    //   .insert({
    //     user_id: userId,
    //     event_type: eventType,
    //     from_tier: fromTier,
    //     to_tier: toTier,
    //     revenue_amount: revenueAmount || null
    //   })
    //
    // if (error) {
    //   console.error('Error tracking conversion event:', error)
    // }
  } catch (error) {
    console.error('Conversion tracking failed:', error)
    // Don't throw - this is non-critical
  }
}

/**
 * Get next reset time (midnight UTC)
 */
function getNextResetTime(): Date {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow
}

/**
 * Format time until reset
 */
export function formatTimeUntilReset(resetTime: Date): string {
  const now = new Date()
  const diff = resetTime.getTime() - now.getTime()
  
  if (diff <= 0) return 'Now'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Get premium features list for display
 */
export function getPremiumFeaturesList(): string[] {
  return [
    'Extended story length (up to 45 minutes)',
    'Premium genres: Horror, Romance, Thriller',
    'Advanced personality analytics',
    'Priority customer support',
    'Higher daily story limits (100 vs 10)',
    'Early access to new features'
  ]
}