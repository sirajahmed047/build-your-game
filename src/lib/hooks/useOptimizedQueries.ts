'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StoryRunQueries, StoryStepQueries, UserProfileQueries, ChoiceStatsQueries } from '@/lib/supabase/queries'
import type { StoryRun, StoryStep } from '@/types/story'
import type { Database } from '@/types/database'

// Query key factories for consistent caching
export const queryKeys = {
  // Story runs
  storyRuns: ['storyRuns'] as const,
  storyRun: (id: string) => ['storyRuns', id] as const,
  userStoryRuns: (userId: string) => ['storyRuns', 'user', userId] as const,
  sessionStoryRuns: (sessionId: string) => ['storyRuns', 'session', sessionId] as const,
  
  // Story steps
  storySteps: ['storySteps'] as const,
  storyStep: (id: string) => ['storySteps', id] as const,
  storyRunSteps: (storyRunId: string) => ['storySteps', 'run', storyRunId] as const,
  latestStep: (storyRunId: string) => ['storySteps', 'latest', storyRunId] as const,
  
  // User profiles
  userProfiles: ['userProfiles'] as const,
  userProfile: (userId: string) => ['userProfiles', userId] as const,
  globalPersonalityAverages: ['userProfiles', 'globalAverages'] as const,
  
  // Choice statistics
  choiceStats: ['choiceStats'] as const,
  choiceStatistics: (choiceSlug: string, genre: string) => ['choiceStats', choiceSlug, genre] as const,
  allChoiceStatistics: (genre?: string) => ['choiceStats', 'all', genre] as const,
  cronJobHealth: ['choiceStats', 'cronHealth'] as const,
} as const

// Optimized story run hooks
export function useStoryRun(id: string) {
  return useQuery({
    queryKey: queryKeys.storyRun(id),
    queryFn: () => StoryRunQueries.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - story runs don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUserStoryRuns(userId: string) {
  return useQuery({
    queryKey: queryKeys.userStoryRuns(userId),
    queryFn: () => StoryRunQueries.getByUserId(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute - user's story list can change
    gcTime: 3 * 60 * 1000, // 3 minutes
  })
}

export function useSessionStoryRuns(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessionStoryRuns(sessionId),
    queryFn: () => StoryRunQueries.getBySessionId(sessionId),
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Optimized story step hooks
export function useStoryRunSteps(storyRunId: string) {
  return useQuery({
    queryKey: queryKeys.storyRunSteps(storyRunId),
    queryFn: () => StoryStepQueries.getByStoryRunId(storyRunId),
    enabled: !!storyRunId,
    staleTime: 30 * 1000, // 30 seconds - steps can change during active story
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useLatestStoryStep(storyRunId: string) {
  return useQuery({
    queryKey: queryKeys.latestStep(storyRunId),
    queryFn: () => StoryStepQueries.getLatestStep(storyRunId),
    enabled: !!storyRunId,
    staleTime: 10 * 1000, // 10 seconds - latest step changes frequently
    gcTime: 1 * 60 * 1000, // 1 minute
  })
}

// Optimized user profile hooks
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: () => UserProfileQueries.getOrCreate(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profiles don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useGlobalPersonalityAverages() {
  return useQuery({
    queryKey: queryKeys.globalPersonalityAverages,
    queryFn: () => UserProfileQueries.getGlobalPersonalityAverages(),
    staleTime: 30 * 60 * 1000, // 30 minutes - global averages change slowly
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false, // Don't refetch on focus for global data
  })
}

// Optimized choice statistics hooks
export function useChoiceStatistics(choiceSlug: string, genre: string) {
  return useQuery({
    queryKey: queryKeys.choiceStatistics(choiceSlug, genre),
    queryFn: () => ChoiceStatsQueries.getChoiceStatistics(choiceSlug, genre),
    enabled: !!choiceSlug && !!genre,
    staleTime: 2 * 60 * 1000, // 2 minutes - stats update every 5 minutes via cron
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes for live updates
  })
}

export function useAllChoiceStatistics(genre?: string) {
  return useQuery({
    queryKey: queryKeys.allChoiceStatistics(genre),
    queryFn: () => ChoiceStatsQueries.getAllChoiceStatistics(genre),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

export function useCronJobHealth() {
  return useQuery({
    queryKey: queryKeys.cronJobHealth,
    queryFn: () => ChoiceStatsQueries.getCronJobHealth(),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes
  })
}

// Optimized mutations with cache updates
export function useCreateStoryRun() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: StoryRunQueries.create,
    onSuccess: (newStoryRun) => {
      if (newStoryRun) {
        // Update the specific story run cache
        queryClient.setQueryData(queryKeys.storyRun(newStoryRun.id), newStoryRun)
        
        // Invalidate user's story runs list to include the new run
        if (newStoryRun.user_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.userStoryRuns(newStoryRun.user_id) })
        }
        if (newStoryRun.session_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.sessionStoryRuns(newStoryRun.session_id) })
        }
      }
    },
  })
}

export function useUpdateStoryRun() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof StoryRunQueries.update>[1] }) =>
      StoryRunQueries.update(id, data),
    onSuccess: (updatedStoryRun) => {
      if (updatedStoryRun) {
        // Update the specific story run cache
        queryClient.setQueryData(queryKeys.storyRun(updatedStoryRun.id), updatedStoryRun)
        
        // Update in user's story runs list
        if (updatedStoryRun.user_id) {
          queryClient.setQueryData(
            queryKeys.userStoryRuns(updatedStoryRun.user_id),
            (oldData: StoryRun[] | undefined) => {
              if (!oldData) return [updatedStoryRun]
              return oldData.map(run => run.id === updatedStoryRun.id ? updatedStoryRun : run)
            }
          )
        }
        
        // Update in session's story runs list
        if (updatedStoryRun.session_id) {
          queryClient.setQueryData(
            queryKeys.sessionStoryRuns(updatedStoryRun.session_id),
            (oldData: StoryRun[] | undefined) => {
              if (!oldData) return [updatedStoryRun]
              return oldData.map(run => run.id === updatedStoryRun.id ? updatedStoryRun : run)
            }
          )
        }
      }
    },
  })
}

export function useCreateStoryStep() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: StoryStepQueries.create,
    onSuccess: (newStep) => {
      if (newStep && newStep.story_run_id) {
        // Update the specific story step cache
        queryClient.setQueryData(queryKeys.storyStep(newStep.id), newStep)
        
        // Update the story run's steps list
        queryClient.setQueryData(
          queryKeys.storyRunSteps(newStep.story_run_id),
          (oldData: StoryStep[] | undefined) => {
            if (!oldData) return [newStep]
            return [...oldData, newStep].sort((a, b) => a.step_number - b.step_number)
          }
        )
        
        // Update the latest step cache
        queryClient.setQueryData(queryKeys.latestStep(newStep.story_run_id), newStep)
      }
    },
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Parameters<typeof UserProfileQueries.update>[1] }) =>
      UserProfileQueries.update(userId, data),
    onSuccess: (updatedProfile, { userId }) => {
      if (updatedProfile) {
        // Update the specific user profile cache
        queryClient.setQueryData(queryKeys.userProfile(userId), updatedProfile)
        
        // If personality traits were updated, invalidate global averages
        if ('personality_traits' in updatedProfile) {
          queryClient.invalidateQueries({ queryKey: queryKeys.globalPersonalityAverages })
        }
      }
    },
  })
}

// Utility function to prefetch related data
export function usePrefetchStoryData() {
  const queryClient = useQueryClient()
  
  const prefetchStoryRun = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.storyRun(id),
      queryFn: () => StoryRunQueries.getById(id),
      staleTime: 2 * 60 * 1000,
    })
  }
  
  const prefetchStorySteps = (storyRunId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.storyRunSteps(storyRunId),
      queryFn: () => StoryStepQueries.getByStoryRunId(storyRunId),
      staleTime: 30 * 1000,
    })
  }
  
  const prefetchUserProfile = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.userProfile(userId),
      queryFn: () => UserProfileQueries.getOrCreate(userId),
      staleTime: 5 * 60 * 1000,
    })
  }
  
  return {
    prefetchStoryRun,
    prefetchStorySteps,
    prefetchUserProfile,
  }
}

// Cache invalidation utilities
export function useCacheInvalidation() {
  const queryClient = useQueryClient()
  
  const invalidateUserData = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.userStoryRuns(userId) })
  }
  
  const invalidateStoryData = (storyRunId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.storyRun(storyRunId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.storyRunSteps(storyRunId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.latestStep(storyRunId) })
  }
  
  const invalidateChoiceStats = (choiceSlug?: string, genre?: string) => {
    if (choiceSlug && genre) {
      queryClient.invalidateQueries({ queryKey: queryKeys.choiceStatistics(choiceSlug, genre) })
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.allChoiceStatistics() })
  }
  
  return {
    invalidateUserData,
    invalidateStoryData,
    invalidateChoiceStats,
  }
}