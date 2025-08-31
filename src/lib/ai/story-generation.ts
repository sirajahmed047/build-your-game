import { supabase } from '../supabase/client'
import type { StoryGenerationRequest, StoryResponse } from '../../types/story'

export interface StoryGenerationResult {
  story: StoryResponse
  tokensUsed: number
  remainingRequests: number
}

export interface StoryGenerationError {
  error: string
  message?: string
  resetTime?: number
  remainingRequests?: number
}

/**
 * Generate a new story using the AI service
 */
export async function generateStory(
  request: StoryGenerationRequest
): Promise<StoryGenerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: request
    })

    if (error) {
      throw new Error(`Story generation failed: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data received from story generation service')
    }

    // Check if response contains an error
    if (data.error) {
      const errorData = data as StoryGenerationError
      throw new StoryGenerationServiceError(
        errorData.error,
        errorData.resetTime,
        errorData.remainingRequests
      )
    }

    return {
      story: data as StoryResponse,
      tokensUsed: 0, // Will be populated from headers if available
      remainingRequests: 0 // Will be populated from headers if available
    }
  } catch (error) {
    if (error instanceof StoryGenerationServiceError) {
      throw error
    }
    
    console.error('Story generation error:', error)
    throw new Error('Failed to generate story. Please try again.')
  }
}

/**
 * Continue an existing story with a new choice
 */
export async function continueStory(
  request: StoryGenerationRequest & {
    storyRunId: string
    currentStep: number
    gameState: any
    previousChoice: string
  }
): Promise<StoryGenerationResult> {
  return generateStory(request)
}

/**
 * Get user's current rate limit status
 */
export async function getRateLimitStatus(): Promise<{
  requestsToday: number
  dailyLimit: number
  remainingRequests: number
  isPremium: boolean
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const identifier = user?.id || 'guest'

    try {
      // Type-safe RPC call with explicit typing
      const { data, error } = await supabase
        .rpc('get_rate_limit_status' as any, { user_identifier: identifier } as any)

      if (error) {
        console.error('Rate limit status error:', error)
        return {
          requestsToday: 0,
          dailyLimit: 10,
          remainingRequests: 10,
          isPremium: false
        }
      }

      const result = (Array.isArray(data) && (data as any[]).length > 0) ? (data as any[])[0] : {}
      return {
        requestsToday: result.requests_today || 0,
        dailyLimit: result.daily_limit || 10,
        remainingRequests: result.remaining_requests || 10,
        isPremium: result.is_premium || false
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return {
        requestsToday: 0,
        dailyLimit: 10,
        remainingRequests: 10,
        isPremium: false
      }
    }
  } catch (error) {
    console.error('Rate limit status error:', error)
    return {
      requestsToday: 0,
      dailyLimit: 10,
      remainingRequests: 10,
      isPremium: false
    }
  }
}

/**
 * Custom error class for story generation service errors
 */
export class StoryGenerationServiceError extends Error {
  constructor(
    message: string,
    public resetTime?: number,
    public remainingRequests?: number
  ) {
    super(message)
    this.name = 'StoryGenerationServiceError'
  }

  get isRateLimited(): boolean {
    return this.message.includes('Rate limit exceeded')
  }

  get resetTimeFormatted(): string | null {
    if (!this.resetTime) return null
    return new Date(this.resetTime).toLocaleTimeString()
  }
}

/**
 * Validate story generation request
 */
export function validateStoryRequest(request: StoryGenerationRequest): string[] {
  const errors: string[] = []

  if (!request.genre || !['fantasy', 'mystery', 'sci-fi'].includes(request.genre)) {
    errors.push('Invalid genre. Must be fantasy, mystery, or sci-fi.')
  }

  if (!request.length || !['quick', 'standard'].includes(request.length)) {
    errors.push('Invalid length. Must be quick or standard.')
  }

  if (!request.challenge || !['casual', 'challenging'].includes(request.challenge)) {
    errors.push('Invalid challenge level. Must be casual or challenging.')
  }

  if (!request.sessionId || request.sessionId.length < 10) {
    errors.push('Invalid session ID.')
  }

  return errors
}

/**
 * Generate a unique session ID for guest users
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}