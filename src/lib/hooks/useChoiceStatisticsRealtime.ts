'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ChoiceStatsQueries } from '@/lib/supabase/queries'
import type { Database } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ChoiceStatistic = Database['public']['Views']['choice_statistics_cached']['Row']

interface UseChoiceStatisticsRealtimeOptions {
  choiceSlug?: string
  genre?: string
  enabled?: boolean
  pollInterval?: number // Fallback polling interval in ms (default: 5 minutes)
}

export function useChoiceStatisticsRealtime({
  choiceSlug,
  genre,
  enabled = true,
  pollInterval = 300000 // 5 minutes fallback polling - much less aggressive
}: UseChoiceStatisticsRealtimeOptions = {}) {
  const [statistics, setStatistics] = useState<ChoiceStatistic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const loadStatisticsRef = useRef<(() => Promise<void>) | null>(null)

  // Load initial statistics - memoized to prevent unnecessary re-subscriptions
  const loadStatistics = useCallback(async () => {
    if (!choiceSlug || !genre) {
      setStatistics([])
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const stats = await ChoiceStatsQueries.getChoiceStatistics(choiceSlug, genre)
      setStatistics(stats)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error loading choice statistics:', err)
      setError('Failed to load statistics')
    } finally {
      setIsLoading(false)
    }
  }, [choiceSlug, genre])

  // Keep ref updated with latest loadStatistics function
  useEffect(() => {
    loadStatisticsRef.current = loadStatistics
  }, [loadStatistics])

  // Setup realtime subscription
  useEffect(() => {
    if (!enabled || !choiceSlug || !genre) {
      return
    }

    // Clean up existing subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Create new channel for choice aggregates changes
    const channel = supabase
      .channel(`choice_stats_${choiceSlug}_${genre}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'choice_aggregates',
          filter: `choice_slug=eq.${choiceSlug},genre=eq.${genre}`
        },
        (payload) => {
          console.log('Choice aggregates updated:', payload)
          // Reload statistics when aggregates change - use ref to avoid dependency issues
          if (loadStatisticsRef.current) {
            loadStatisticsRef.current()
          }
        }
      )

    channelRef.current = channel
    
    channel.subscribe((status) => {
      console.log('Realtime subscription status:', status)
      setIsRealtimeConnected(status === 'SUBSCRIBED')
    })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
      setIsRealtimeConnected(false)
    }
  }, [enabled, choiceSlug, genre])

  // Setup fallback polling when realtime is not connected
  useEffect(() => {
    if (!enabled || !choiceSlug || !genre) {
      return
    }

    // Clear existing poll
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    // Only poll if realtime is not connected
    if (!isRealtimeConnected && pollInterval > 0) {
      pollIntervalRef.current = setInterval(() => {
        // Use ref to avoid dependency on loadStatistics
        if (loadStatisticsRef.current) {
          loadStatisticsRef.current()
        }
      }, pollInterval)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [enabled, choiceSlug, genre, isRealtimeConnected, pollInterval])

  // Load initial data
  useEffect(() => {
    if (enabled) {
      loadStatistics()
    }
  }, [enabled, loadStatistics])

  // Manual refresh function - memoized to prevent unnecessary re-renders
  const refresh = useCallback(async () => {
    setIsLoading(true)
    await loadStatistics()
  }, [loadStatistics])

  // Get statistics for a specific option - memoized for performance
  const getOptionStatistics = useCallback((optionId: string) => {
    return statistics.find(stat => stat.option_id === optionId)
  }, [statistics])

  // Calculate rarity based on percentage
  const calculateRarity = useCallback((percentage: number) => {
    if (percentage < 5) return 'ultra-rare'
    if (percentage < 15) return 'rare'
    if (percentage < 35) return 'uncommon'
    return 'common'
  }, [])

  // Check if a choice is rare - memoized for performance
  const isRareChoice = useCallback((optionId: string) => {
    const stat = statistics.find(s => s.option_id === optionId)
    if (!stat) return false
    const percentage = stat.percentage || 0
    const rarity = calculateRarity(percentage)
    return ['rare', 'ultra-rare'].includes(rarity)
  }, [statistics, calculateRarity])

  // Get rarity distribution - memoized for performance
  const getRarityDistribution = useCallback(() => {
    const distribution = {
      'ultra-rare': 0,
      'rare': 0,
      'uncommon': 0,
      'common': 0
    }

    statistics.forEach(stat => {
      const percentage = stat.percentage || 0
      const rarity = calculateRarity(percentage)
      distribution[rarity as keyof typeof distribution]++
    })

    return distribution
  }, [statistics, calculateRarity])

  return {
    statistics,
    isLoading,
    error,
    lastUpdated,
    isRealtimeConnected,
    refresh,
    getOptionStatistics,
    isRareChoice,
    getRarityDistribution,
    // Connection status helpers
    connectionStatus: isRealtimeConnected ? 'realtime' : 'polling',
    isConnected: isRealtimeConnected || pollInterval > 0
  }
}