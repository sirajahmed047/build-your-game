import { RateLimitResult } from './types.ts'

/**
 * Enforce rate limits for story generation
 */
export async function enforceRateLimit(
  supabase: any,
  identifier: string, // userId or sessionId
  isGuest: boolean
): Promise<RateLimitResult> {
  const now = new Date()
  const today = now.toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Get premium status and adjust limits accordingly
  let dailyLimit = 3 // Default for guests
  
  if (!isGuest) {
    const { isPremium, dailyLimit: userLimit } = await checkPremiumLimits(supabase, identifier)
    dailyLimit = userLimit
  }
  
  try {
    // Get or create rate limit record for today
    const { data: rateLimitRecord, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('date', today)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Rate limit check error:', error)
      // On error, allow the request but log it
      return { allowed: true, remainingRequests: dailyLimit }
    }
    
    if (!rateLimitRecord) {
      // First request today - create new record
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          date: today,
          requests_count: 1,
          is_guest: isGuest
        })
      
      if (insertError) {
        console.error('Rate limit insert error:', insertError)
        // On error, allow the request
        return { allowed: true, remainingRequests: dailyLimit - 1 }
      }
      
      return { allowed: true, remainingRequests: dailyLimit - 1 }
    }
    
    // Check if limit exceeded
    if (rateLimitRecord.requests_count >= dailyLimit) {
      const resetTime = new Date(today + 'T23:59:59Z').getTime()
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime
      }
    }
    
    // Increment counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ 
        requests_count: rateLimitRecord.requests_count + 1,
        updated_at: now.toISOString()
      })
      .eq('identifier', identifier)
      .eq('date', today)
    
    if (updateError) {
      console.error('Rate limit update error:', updateError)
      // On error, allow the request but don't increment
      return { allowed: true, remainingRequests: dailyLimit - rateLimitRecord.requests_count }
    }
    
    return {
      allowed: true,
      remainingRequests: dailyLimit - rateLimitRecord.requests_count - 1
    }
    
  } catch (error) {
    console.error('Rate limiting error:', error)
    // On any error, allow the request to avoid blocking users
    return { allowed: true, remainingRequests: dailyLimit }
  }
}

/**
 * Check premium status and adjust limits accordingly
 */
export async function checkPremiumLimits(
  supabase: any,
  userId: string
): Promise<{ isPremium: boolean; dailyLimit: number }> {
  if (!userId) {
    return { isPremium: false, dailyLimit: 3 } // Guest limits
  }
  
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()
    
    const isPremium = profile?.subscription_tier === 'premium'
    const dailyLimit = isPremium ? 100 : 10 // Premium gets much higher limits
    
    return { isPremium, dailyLimit }
  } catch (error) {
    console.error('Premium check error:', error)
    return { isPremium: false, dailyLimit: 10 } // Default to free tier
  }
}

/**
 * Check if user can access premium features
 */
export async function checkPremiumFeatureAccess(
  supabase: any,
  userId: string,
  feature: 'extended_length' | 'premium_genre'
): Promise<boolean> {
  if (!userId) return false
  
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()
    
    return profile?.subscription_tier === 'premium'
  } catch (error) {
    console.error('Premium feature access check error:', error)
    return false
  }
}

/**
 * Validate story generation request against user's subscription
 */
export async function validateStoryRequest(
  supabase: any,
  userId: string,
  genre: string,
  length: string
): Promise<{ allowed: boolean; reason?: string }> {
  const premiumGenres = ['horror', 'romance', 'thriller']
  const extendedLengths = ['extended']
  
  // Check if premium genre is requested
  if (premiumGenres.includes(genre)) {
    const hasAccess = await checkPremiumFeatureAccess(supabase, userId, 'premium_genre')
    if (!hasAccess) {
      return { allowed: false, reason: 'premium_genre_required' }
    }
  }
  
  // Check if extended length is requested
  if (extendedLengths.includes(length)) {
    const hasAccess = await checkPremiumFeatureAccess(supabase, userId, 'extended_length')
    if (!hasAccess) {
      return { allowed: false, reason: 'extended_length_premium' }
    }
  }
  
  return { allowed: true }
}

/**
 * Global rate limiting to prevent abuse
 */
export async function checkGlobalRateLimit(supabase: any): Promise<boolean> {
  try {
    const now = new Date()
    const currentHour = now.toISOString().substring(0, 13) // YYYY-MM-DDTHH
    
    // Check global requests in current hour
    const { data: globalStats } = await supabase
      .from('global_rate_limits')
      .select('requests_count')
      .eq('hour', currentHour)
      .single()
    
    const globalHourlyLimit = 1000 // Adjust based on your OpenAI quota
    
    if (globalStats && globalStats.requests_count >= globalHourlyLimit) {
      return false // Global limit exceeded
    }
    
    // Increment global counter
    await supabase
      .from('global_rate_limits')
      .upsert({
        hour: currentHour,
        requests_count: (globalStats?.requests_count || 0) + 1,
        updated_at: now.toISOString()
      })
    
    return true
  } catch (error) {
    console.error('Global rate limit error:', error)
    return true // On error, allow the request
  }
}