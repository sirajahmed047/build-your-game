import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SaveReplayService } from '../story/save-replay'
import { supabase } from '../supabase/client'
import type { 
  SavePoint, 
  ReplayTemplate, 
  ReplayOptions
} from '../story/save-replay'
import type { StorySession } from '../../types/story'
import type { StoryRun } from '../../types/story'

export interface UseSaveReplayOptions {
  onProgressSaved?: (savePoint: SavePoint) => void
  onProgressRestored?: (session: StorySession) => void
  onReplayStarted?: (session: StorySession) => void
  onError?: (error: Error) => void
}

export function useSaveReplay(options: UseSaveReplayOptions = {}) {
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

  // Get save points for current story
  const { 
    data: savePoints, 
    isLoading: isLoadingSavePoints,
    refetch: refetchSavePoints
  } = useQuery({
    queryKey: ['savePoints', currentStoryRunId],
    queryFn: () => currentStoryRunId ? SaveReplayService.getSavePoints(currentStoryRunId) : [],
    enabled: !!currentStoryRunId,
    staleTime: 30000
  })

  // Get story history
  const { 
    data: storyHistory, 
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['storyHistory', user?.id],
    queryFn: () => SaveReplayService.getStoryHistory(user?.id, undefined),
    enabled: !!user?.id,
    staleTime: 60000
  })

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (params: {
      storyRunId: string
      stepNumber: number
      gameState: any
      personalityTraits: any
      storyText: string
      availableChoices: any[]
      description?: string
    }) => {
      return SaveReplayService.saveProgress(
        params.storyRunId,
        params.stepNumber,
        params.gameState,
        params.personalityTraits,
        params.storyText,
        params.availableChoices,
        params.description
      )
    },
    onSuccess: (savePoint) => {
      // Update cache
      queryClient.setQueryData(['savePoints', savePoint.storyRunId], (old: SavePoint[] = []) => {
        const filtered = old.filter(sp => sp.stepNumber !== savePoint.stepNumber)
        return [...filtered, savePoint].sort((a, b) => a.stepNumber - b.stepNumber)
      })
      
      options.onProgressSaved?.(savePoint)
    },
    onError: (error) => {
      console.error('Error saving progress:', error)
      options.onError?.(error as Error)
    }
  })

  // Restore progress mutation
  const restoreProgressMutation = useMutation({
    mutationFn: async (params: { storyRunId: string; stepNumber?: number }) => {
      const session = await SaveReplayService.restoreProgress(params.storyRunId, params.stepNumber)
      if (!session) {
        throw new Error('Failed to restore progress')
      }
      return session
    },
    onSuccess: (session) => {
      setCurrentStoryRunId(session.storyRun.id)
      options.onProgressRestored?.(session)
    },
    onError: (error) => {
      console.error('Error restoring progress:', error)
      options.onError?.(error as Error)
    }
  })

  // Start replay mutation
  const startReplayMutation = useMutation({
    mutationFn: async (params: {
      template: ReplayTemplate
      options?: ReplayOptions
      sessionId?: string
    }) => {
      return SaveReplayService.startReplay(
        params.template,
        user?.id,
        params.sessionId,
        params.options
      )
    },
    onSuccess: (session) => {
      setCurrentStoryRunId(session.storyRun.id)
      // Refresh history to include new replay
      refetchHistory()
      options.onReplayStarted?.(session)
    },
    onError: (error) => {
      console.error('Error starting replay:', error)
      options.onError?.(error as Error)
    }
  })

  // Quick restart mutation
  const quickRestartMutation = useMutation({
    mutationFn: async (params: { storyRunId: string; sessionId?: string }) => {
      return SaveReplayService.quickRestart(
        params.storyRunId,
        user?.id,
        params.sessionId
      )
    },
    onSuccess: (session) => {
      setCurrentStoryRunId(session.storyRun.id)
      refetchHistory()
      options.onReplayStarted?.(session)
    },
    onError: (error) => {
      console.error('Error quick restarting:', error)
      options.onError?.(error as Error)
    }
  })

  // Get replay options for a story
  const getReplayOptions = useCallback(async (storyRunId: string) => {
    try {
      return await SaveReplayService.getReplayOptions(storyRunId)
    } catch (error) {
      console.error('Error getting replay options:', error)
      options.onError?.(error as Error)
      return { canReplay: false, suggestedStartPoints: [] }
    }
  }, [options])

  // Auto-save progress when story state changes
  const autoSaveProgress = useCallback((
    storyRunId: string,
    stepNumber: number,
    gameState: any,
    personalityTraits: any,
    storyText: string,
    availableChoices: any[],
    description?: string
  ) => {
    if (!saveProgressMutation.isPending) {
      saveProgressMutation.mutate({
        storyRunId,
        stepNumber,
        gameState,
        personalityTraits,
        storyText,
        availableChoices,
        description
      })
    }
  }, [saveProgressMutation])

  // Manual save progress
  const saveProgress = useCallback((
    storyRunId: string,
    stepNumber: number,
    gameState: any,
    personalityTraits: any,
    storyText: string,
    availableChoices: any[],
    description?: string
  ) => {
    saveProgressMutation.mutate({
      storyRunId,
      stepNumber,
      gameState,
      personalityTraits,
      storyText,
      availableChoices,
      description
    })
  }, [saveProgressMutation])

  // Restore progress from save point
  const restoreProgress = useCallback((storyRunId: string, stepNumber?: number) => {
    restoreProgressMutation.mutate({ storyRunId, stepNumber })
  }, [restoreProgressMutation])

  // Start replay from template
  const startReplay = useCallback((
    template: ReplayTemplate,
    replayOptions?: ReplayOptions,
    sessionId?: string
  ) => {
    startReplayMutation.mutate({
      template,
      options: replayOptions,
      sessionId
    })
  }, [startReplayMutation])

  // Quick restart story
  const quickRestart = useCallback((storyRunId: string, sessionId?: string) => {
    quickRestartMutation.mutate({ storyRunId, sessionId })
  }, [quickRestartMutation])

  // Set current story for save point tracking
  const setCurrentStory = useCallback((storyRunId: string | null) => {
    setCurrentStoryRunId(storyRunId)
  }, [])

  // Check if browser storage is available for save points
  const hasBrowserStorage = useCallback(() => {
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      return true
    } catch {
      return false
    }
  }, [])

  // Auto-restore progress on page load
  useEffect(() => {
    const restoreFromStorage = () => {
      if (!hasBrowserStorage()) return

      try {
        const lastStoryId = localStorage.getItem('lastActiveStory')
        if (lastStoryId && !currentStoryRunId) {
          // Check if this story still exists and is not completed
          SaveReplayService.restoreProgress(lastStoryId)
            .then(session => {
              if (session && !session.isCompleted) {
                setCurrentStoryRunId(lastStoryId)
                options.onProgressRestored?.(session)
              }
            })
            .catch(error => {
              console.warn('Failed to auto-restore progress:', error)
              localStorage.removeItem('lastActiveStory')
            })
        }
      } catch (error) {
        console.warn('Failed to restore from storage:', error)
      }
    }

    restoreFromStorage()
  }, [currentStoryRunId, options, hasBrowserStorage])

  // Store current story ID for auto-restore
  useEffect(() => {
    if (currentStoryRunId && hasBrowserStorage()) {
      localStorage.setItem('lastActiveStory', currentStoryRunId)
    }
  }, [currentStoryRunId, hasBrowserStorage])

  return {
    // Current state
    currentStoryRunId,
    savePoints: savePoints || [],
    storyHistory: storyHistory || [],
    
    // Actions
    setCurrentStory,
    saveProgress,
    autoSaveProgress,
    restoreProgress,
    startReplay,
    quickRestart,
    getReplayOptions,
    
    // Loading states
    isLoadingSavePoints,
    isLoadingHistory,
    isSavingProgress: saveProgressMutation.isPending,
    isRestoringProgress: restoreProgressMutation.isPending,
    isStartingReplay: startReplayMutation.isPending,
    isQuickRestarting: quickRestartMutation.isPending,
    
    // Utilities
    hasBrowserStorage: hasBrowserStorage(),
    canAutoSave: !saveProgressMutation.isPending,
    
    // Refresh functions
    refetchSavePoints,
    refetchHistory
  }
}

/**
 * Hook for getting replay options for a specific story
 */
export function useReplayOptions(storyRunId: string | null) {
  return useQuery({
    queryKey: ['replayOptions', storyRunId],
    queryFn: () => storyRunId ? SaveReplayService.getReplayOptions(storyRunId) : null,
    enabled: !!storyRunId,
    staleTime: 300000 // 5 minutes
  })
}

/**
 * Hook for managing story history without mutations
 */
export function useStoryHistory(userId?: string) {
  return useQuery({
    queryKey: ['storyHistory', userId],
    queryFn: () => SaveReplayService.getStoryHistory(userId),
    enabled: !!userId,
    staleTime: 60000 // 1 minute
  })
}