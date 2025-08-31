import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { 
  generateStory, 
  continueStory, 
  getRateLimitStatus,
  StoryGenerationServiceError 
} from '../ai/story-generation'
import { generateSessionId } from '../ai/story-generation'
import type { StoryGenerationRequest, StoryResponse } from '../../types/story'

export interface UseStoryGenerationOptions {
  onSuccess?: (story: StoryResponse) => void
  onError?: (error: Error) => void
}

export function useStoryGeneration(options: UseStoryGenerationOptions = {}) {
  const [sessionId] = useState(() => generateSessionId())

  // Generate new story mutation
  const generateStoryMutation = useMutation({
    mutationFn: generateStory,
    onSuccess: (result) => {
      options.onSuccess?.(result.story)
    },
    onError: (error) => {
      options.onError?.(error as Error)
    }
  })

  // Continue existing story mutation
  const continueStoryMutation = useMutation({
    mutationFn: continueStory,
    onSuccess: (result) => {
      options.onSuccess?.(result.story)
    },
    onError: (error) => {
      options.onError?.(error as Error)
    }
  })

  // Rate limit status query
  const rateLimitQuery = useQuery({
    queryKey: ['rateLimitStatus'],
    queryFn: getRateLimitStatus,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000 // Consider stale after 30 seconds
  })

  const startNewStory = useCallback((request: Omit<StoryGenerationRequest, 'sessionId'>) => {
    return generateStoryMutation.mutate({
      ...request,
      sessionId
    })
  }, [generateStoryMutation, sessionId])

  const continueCurrentStory = useCallback((
    request: Omit<StoryGenerationRequest, 'sessionId'> & {
      storyRunId: string
      currentStep: number
      gameState: any
      previousChoice: string
    }
  ) => {
    return continueStoryMutation.mutate({
      ...request,
      sessionId
    })
  }, [continueStoryMutation, sessionId])

  const refreshRateLimit = useCallback(() => {
    rateLimitQuery.refetch()
  }, [rateLimitQuery])

  return {
    // Story generation
    startNewStory,
    continueCurrentStory,
    isGenerating: generateStoryMutation.isPending || continueStoryMutation.isPending,
    generationError: generateStoryMutation.error || continueStoryMutation.error,
    
    // Rate limiting
    rateLimitStatus: rateLimitQuery.data,
    isRateLimitLoading: rateLimitQuery.isLoading,
    rateLimitError: rateLimitQuery.error,
    refreshRateLimit,
    
    // Session
    sessionId,
    
    // Utilities
    isRateLimited: (error: Error) => error instanceof StoryGenerationServiceError && error.isRateLimited,
    getRateLimitResetTime: (error: Error) => {
      if (error instanceof StoryGenerationServiceError) {
        return error.resetTimeFormatted
      }
      return null
    }
  }
}

export function useRateLimitStatus() {
  return useQuery({
    queryKey: ['rateLimitStatus'],
    queryFn: getRateLimitStatus,
    refetchInterval: 60000,
    staleTime: 30000
  })
}