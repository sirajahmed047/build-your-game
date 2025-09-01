'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ChoiceStatsQueries } from '@/lib/supabase/queries'
import type { Database } from '@/types/database'
import type { Choice } from '@/types/story'

type ChoiceStatistic = Database['public']['Views']['choice_statistics_cached']['Row']

interface UseChoiceStatisticsOptions {
  choiceSlug?: string
  genre?: string
  choices?: Choice[]
  onStatisticsLoaded?: (stats: ChoiceStatistic[]) => void
}

interface ChoiceStatisticsState {
  statistics: ChoiceStatistic[]
  isLoading: boolean
  error: string | null
  hasTrackedImpressions: boolean
}

export function useChoiceStatistics({
  choiceSlug,
  genre,
  choices = [],
  onStatisticsLoaded
}: UseChoiceStatisticsOptions = {}) {
  const [state, setState] = useState<ChoiceStatisticsState>({
    statistics: [],
    isLoading: false,
    error: null,
    hasTrackedImpressions: false
  })

  // Track which choices have had impressions recorded to prevent double-counting
  const impressionsTracked = useRef<Set<string>>(new Set())
  const selectionsTracked = useRef<Set<string>>(new Set())

  // Memoize the onStatisticsLoaded callback to prevent unnecessary re-renders
  const memoizedOnStatisticsLoaded = useCallback(
    (stats: ChoiceStatistic[]) => {
      onStatisticsLoaded?.(stats)
    },
    [onStatisticsLoaded]
  )

  // Generate a unique key for tracking impressions/selections
  const getTrackingKey = useCallback((slug: string, optionId: string, genre: string) => {
    return `${slug}:${optionId}:${genre}`
  }, [])

  // Track impressions when choices are displayed
  const trackImpressions = useCallback(async (choices: Choice[], genre: string, choiceSlug: string) => {
    if (!choices.length || !genre || !choiceSlug) return

    try {
      const trackingPromises = choices.map(async (choice) => {
        const trackingKey = getTrackingKey(choiceSlug, choice.id, genre)
        
        // Backfill guard: only track if not already tracked in this session
        if (!impressionsTracked.current.has(trackingKey)) {
          await ChoiceStatsQueries.incrementImpressions(choiceSlug, choice.id, genre)
          impressionsTracked.current.add(trackingKey)
        }
      })

      await Promise.all(trackingPromises)
      
      setState(prev => ({ ...prev, hasTrackedImpressions: true }))
    } catch (error) {
      console.error('Error tracking impressions:', error)
      // Don't update error state as this is non-critical
    }
  }, [getTrackingKey])

  // Track selection when a choice is made
  const trackSelection = useCallback(async (choiceSlug: string, optionId: string, genre: string) => {
    if (!choiceSlug || !optionId || !genre) return

    try {
      const trackingKey = getTrackingKey(choiceSlug, optionId, genre)
      
      // Backfill guard: only track if not already tracked in this session
      if (!selectionsTracked.current.has(trackingKey)) {
        await ChoiceStatsQueries.incrementSelections(choiceSlug, optionId, genre)
        selectionsTracked.current.add(trackingKey)
      }
    } catch (error) {
      console.error('Error tracking selection:', error)
      // Don't throw as this is non-critical for user experience
    }
  }, [getTrackingKey])

  // Load statistics for display
  const loadStatistics = useCallback(async (choiceSlug: string, genre: string) => {
    if (!choiceSlug || !genre) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const stats = await ChoiceStatsQueries.getChoiceStatistics(choiceSlug, genre)
      setState(prev => ({ 
        ...prev, 
        statistics: stats, 
        isLoading: false 
      }))
      memoizedOnStatisticsLoaded(stats)
    } catch (error) {
      console.error('Error loading statistics:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load statistics', 
        isLoading: false 
      }))
    }
  }, [memoizedOnStatisticsLoaded])

  // Auto-track impressions when choices are provided
  useEffect(() => {
    if (choices.length > 0 && genre && choiceSlug && !state.hasTrackedImpressions) {
      trackImpressions(choices, genre, choiceSlug)
    }
  }, [choices, genre, choiceSlug, state.hasTrackedImpressions, trackImpressions])

  // Auto-load statistics when parameters change
  useEffect(() => {
    if (choiceSlug && genre) {
      loadStatistics(choiceSlug, genre)
    }
  }, [choiceSlug, genre, loadStatistics])

  // Periodic refresh for updated statistics (fallback when realtime is not available)
  useEffect(() => {
    if (!choiceSlug || !genre) return

    const refreshInterval = setInterval(() => {
      // Use current ref to avoid dependency issues
      if (loadStatisticsRef.current) {
        loadStatisticsRef.current(choiceSlug, genre)
      }
    }, 300000) // Refresh every 5 minutes instead of 1 minute to reduce load

    return () => clearInterval(refreshInterval)
  }, [choiceSlug, genre])

  // Keep ref updated with latest loadStatistics function
  const loadStatisticsRef = useRef(loadStatistics)
  useEffect(() => {
    loadStatisticsRef.current = loadStatistics
  }, [loadStatistics])

  // Clear tracking when parameters change to prevent stale data
  useEffect(() => {
    // Clear tracking sets when choiceSlug or genre changes
    impressionsTracked.current.clear()
    selectionsTracked.current.clear()
    
    // Reset tracking state
    setState(prev => ({ ...prev, hasTrackedImpressions: false }))
  }, [choiceSlug, genre])

  // Cleanup on unmount
  useEffect(() => {
    const impressionsRef = impressionsTracked.current
    const selectionsRef = selectionsTracked.current
    
    return () => {
      impressionsRef.clear()
      selectionsRef.clear()
    }
  }, [])

  // Memoize helper functions to prevent unnecessary re-renders
  const getOptionStatistics = useCallback((optionId: string) => 
    state.statistics.find(stat => stat.option_id === optionId),
    [state.statistics]
  )

  const isRareChoice = useCallback((optionId: string) => {
    const stat = state.statistics.find(s => s.option_id === optionId)
    if (!stat) return false
    const percentage = stat.percentage || 0
    const rarity = percentage < 5 ? 'ultra-rare' : percentage < 15 ? 'rare' : percentage < 35 ? 'uncommon' : 'common'
    return ['rare', 'ultra-rare'].includes(rarity)
  }, [state.statistics])

  // Memoize the wrapper functions to maintain stable references
  const trackImpressionsWrapper = useCallback(
    (choices: Choice[], genre: string, choiceSlug: string) => 
      trackImpressions(choices, genre, choiceSlug),
    [trackImpressions]
  )

  const loadStatisticsWrapper = useCallback(
    (choiceSlug: string, genre: string) => 
      loadStatistics(choiceSlug, genre),
    [loadStatistics]
  )

  return useMemo(() => ({
    statistics: state.statistics,
    isLoading: state.isLoading,
    error: state.error,
    hasTrackedImpressions: state.hasTrackedImpressions,
    trackSelection,
    trackImpressions: trackImpressionsWrapper,
    loadStatistics: loadStatisticsWrapper,
    getOptionStatistics,
    isRareChoice
  }), [
    state.statistics,
    state.isLoading,
    state.error,
    state.hasTrackedImpressions,
    trackSelection,
    trackImpressionsWrapper,
    loadStatisticsWrapper,
    getOptionStatistics,
    isRareChoice
  ])
}