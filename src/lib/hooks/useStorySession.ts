import { useState, useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { StoryFlowService } from '../story/story-flow'
import { generateSessionId } from '../ai/story-generation'
import { supabase } from '../supabase/client'
import type { 
  StorySession, 
  StoryProgressionResult, 
  ChoiceSelectionResult,
  StoryGenerationRequest,
  Choice 
} from '../../types/story'

export interface UseStorySessionOptions {
  onStoryProgression?: (result: StoryProgressionResult) => void
  onChoiceSelected?: (result: ChoiceSelectionResult) => void
  onError?: (error: Error) => void
  onStoryCompleted?: (session: StorySession) => void
}

export function useStorySession(options: UseStorySessionOptions = {}) {
  const [sessionId] = useState(() => generateSessionId())
  const [currentStoryRunId, setCurrentStoryRunId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    }
  })

  // Load current story session
  const { 
    data: currentSession, 
    isLoading: isLoadingSession,
    error: sessionError,
    refetch: refetchSession
  } = useQuery({
    queryKey: ['storySession', currentStoryRunId],
    queryFn: () => currentStoryRunId ? StoryFlowService.loadStorySession(currentStoryRunId) : null,
    enabled: !!currentStoryRunId,
    staleTime: 30000 // 30 seconds
  })

  // Create new story session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (request: Omit<StoryGenerationRequest, 'sessionId' | 'userId'>) => {
      if (!user?.id) {
        throw new Error('Authentication required to create story sessions')
      }
      
      const fullRequest: StoryGenerationRequest = {
        ...request,
        sessionId,
        userId: user.id
      }
      return StoryFlowService.createStorySession(fullRequest)
    },
    onSuccess: (session) => {
      setCurrentStoryRunId(session.storyRun.id)
      queryClient.setQueryData(['storySession', session.storyRun.id], session)
    },
    onError: (error) => {
      console.error('Error creating story session:', error)
      options.onError?.(error as Error)
    }
  })

  // Select choice mutation
  const selectChoiceMutation = useMutation({
    mutationFn: async ({ choiceId, choiceSlug }: { choiceId: string; choiceSlug: string }) => {
      if (!currentSession?.currentStep) {
        throw new Error('No active story step')
      }
      
      return StoryFlowService.selectChoice(
        currentSession.storyRun.id,
        currentSession.currentStep.id,
        choiceId,
        choiceSlug
      )
    },
    onSuccess: (result) => {
      // Refetch the session to get updated state
      refetchSession()
      
      options.onChoiceSelected?.(result)
      
      if (result.progressionResult) {
        options.onStoryProgression?.(result.progressionResult)
        
        if (result.progressionResult.isEnding) {
          options.onStoryCompleted?.(result.progressionResult.session)
        }
      }
    },
    onError: (error) => {
      console.error('Error selecting choice:', error)
      options.onError?.(error as Error)
    }
  })

  // Start a new story
  const startNewStory = useCallback((request: Omit<StoryGenerationRequest, 'sessionId' | 'userId'>) => {
    if (!user?.id) {
      options.onError?.(new Error('Authentication required to start a story'))
      return
    }
    setCurrentStoryRunId(null) // Clear current session
    createSessionMutation.mutate(request)
  }, [createSessionMutation, user?.id, options])

  // Select a choice in the current story
  const selectChoice = useCallback((choiceId: string, choiceSlug: string) => {
    if (!currentSession) {
      throw new Error('No active story session')
    }
    selectChoiceMutation.mutate({ choiceId, choiceSlug })
  }, [currentSession, selectChoiceMutation])

  // Load an existing story session
  const loadStorySession = useCallback((storyRunId: string) => {
    setCurrentStoryRunId(storyRunId)
  }, [])

  // Reset current session
  const resetSession = useCallback(() => {
    setCurrentStoryRunId(null)
    queryClient.removeQueries({ queryKey: ['storySession'] })
  }, [queryClient])

  // Get story history for current user
  const { data: storyHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['storyHistory', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { StoryRunQueries } = await import('../supabase/queries')
      return StoryRunQueries.getByUserId(user.id)
    },
    enabled: !!user?.id
  })

  // Computed values
  const isActive = !!currentSession && !currentSession.isCompleted
  const canMakeChoice = isActive && currentSession?.currentStep && !selectChoiceMutation.isPending
  const isProcessing = createSessionMutation.isPending || selectChoiceMutation.isPending
  const hasError = !!sessionError || !!createSessionMutation.error || !!selectChoiceMutation.error

  const currentError = sessionError || createSessionMutation.error || selectChoiceMutation.error

  return {
    // Session state
    currentSession,
    isActive,
    isCompleted: currentSession?.isCompleted || false,
    sessionId,
    
    // Actions
    startNewStory,
    selectChoice,
    loadStorySession,
    resetSession,
    
    // Choice handling
    canMakeChoice,
    availableChoices: (currentSession?.currentStep?.choices as Choice[]) || [],
    
    // Story progression
    currentStep: currentSession?.currentStep,
    gameState: currentSession?.gameState,
    personalityTraits: currentSession?.personalityTraits,
    storyText: currentSession?.currentStep?.story_text,
    
    // History
    storyHistory,
    isLoadingHistory,
    
    // Loading states
    isLoadingSession,
    isProcessing,
    isCreatingSession: createSessionMutation.isPending,
    isSelectingChoice: selectChoiceMutation.isPending,
    
    // Error handling
    hasError,
    error: currentError,
    
    // Utilities
    refetchSession,
    getCurrentStoryRunId: () => currentStoryRunId
  }
}

/**
 * Hook for managing story session state without mutations
 * Useful for read-only components
 */
export function useStorySessionState(storyRunId: string | null) {
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['storySession', storyRunId],
    queryFn: () => storyRunId ? StoryFlowService.loadStorySession(storyRunId) : null,
    enabled: !!storyRunId,
    staleTime: 30000
  })

  return {
    session,
    isLoading,
    error,
    isActive: !!session && !session.isCompleted,
    currentStep: session?.currentStep,
    gameState: session?.gameState,
    personalityTraits: session?.personalityTraits
  }
}

/**
 * Hook for personality trait tracking across sessions
 */
export function usePersonalityTracking(userId?: string) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { UserProfileQueries } = await import('../supabase/queries')
      return UserProfileQueries.getById(userId)
    },
    enabled: !!userId
  })

  const personalityTraits = useMemo(() => {
    const { safeGetPersonalityTraits } = require('../utils/type-safety')
    return safeGetPersonalityTraits(profile?.personality_traits)
  }, [profile?.personality_traits])

  const totalChoices = profile?.total_choices || 0

  return {
    personalityTraits,
    totalChoices,
    isLoading,
    hasProfile: !!profile
  }
}