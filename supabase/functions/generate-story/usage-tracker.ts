import { TokenUsage } from './types.ts'

/**
 * Log token usage for monitoring and billing
 */
export async function logTokenUsage(
  supabase: any,
  usage: TokenUsage
): Promise<void> {
  try {
    const { error } = await supabase
      .from('token_usage_logs')
      .insert({
        user_id: usage.userId,
        session_id: usage.sessionId,
        genre: usage.genre,
        tokens_used: usage.tokensUsed,
        request_type: usage.requestType,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Token usage logging error:', error)
      // Don't throw - logging failure shouldn't break the main flow
    }
  } catch (error) {
    console.error('Token usage logging exception:', error)
  }
}

/**
 * Get usage statistics for monitoring
 */
export async function getUsageStats(
  supabase: any,
  timeframe: 'hour' | 'day' | 'week' = 'day'
): Promise<any> {
  try {
    const now = new Date()
    let startTime: Date
    
    switch (timeframe) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default: // day
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
    
    const { data, error } = await supabase
      .from('token_usage_logs')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Usage stats error:', error)
      return null
    }
    
    // Aggregate statistics
    const totalTokens = data.reduce((sum: number, log: any) => sum + log.tokens_used, 0)
    const totalRequests = data.length
    const averageTokensPerRequest = totalRequests > 0 ? totalTokens / totalRequests : 0
    
    const genreBreakdown = data.reduce((acc: any, log: any) => {
      acc[log.genre] = (acc[log.genre] || 0) + log.tokens_used
      return acc
    }, {})
    
    return {
      timeframe,
      totalTokens,
      totalRequests,
      averageTokensPerRequest,
      genreBreakdown,
      startTime: startTime.toISOString(),
      endTime: now.toISOString()
    }
  } catch (error) {
    console.error('Usage stats exception:', error)
    return null
  }
}

/**
 * Check if user is approaching their token limits
 */
export async function checkTokenLimits(
  supabase: any,
  userId: string,
  isGuest: boolean
): Promise<{ withinLimits: boolean; tokensUsedToday: number; dailyLimit: number }> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startOfDay = `${today}T00:00:00Z`
    const endOfDay = `${today}T23:59:59Z`
    
    // Get today's usage
    const { data: todayUsage } = await supabase
      .from('token_usage_logs')
      .select('tokens_used')
      .eq(userId ? 'user_id' : 'session_id', userId || 'guest')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
    
    const tokensUsedToday = todayUsage?.reduce((sum: number, log: any) => sum + log.tokens_used, 0) || 0
    
    // Set daily token limits
    const dailyLimit = isGuest ? 5000 : 20000 // Adjust based on your needs
    
    return {
      withinLimits: tokensUsedToday < dailyLimit,
      tokensUsedToday,
      dailyLimit
    }
  } catch (error) {
    console.error('Token limit check error:', error)
    return { withinLimits: true, tokensUsedToday: 0, dailyLimit: 20000 }
  }
}

/**
 * Estimate token cost for monitoring
 */
export function estimateTokenCost(tokensUsed: number, model: string = 'gpt-4'): number {
  // Rough cost estimates (update with current OpenAI pricing)
  const costPerToken = {
    'gpt-4': 0.00003, // $0.03 per 1K tokens
    'gpt-3.5-turbo': 0.000002 // $0.002 per 1K tokens
  }
  
  return tokensUsed * (costPerToken[model as keyof typeof costPerToken] || costPerToken['gpt-4'])
}

/**
 * Log cost information for business monitoring
 */
export async function logCostMetrics(
  supabase: any,
  usage: TokenUsage & { estimatedCost: number }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('cost_tracking')
      .insert({
        user_id: usage.userId,
        session_id: usage.sessionId,
        tokens_used: usage.tokensUsed,
        estimated_cost: usage.estimatedCost,
        request_type: usage.requestType,
        genre: usage.genre,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Cost tracking error:', error)
    }
  } catch (error) {
    console.error('Cost tracking exception:', error)
  }
}