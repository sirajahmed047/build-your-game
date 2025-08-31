'use client'

import { useState, useEffect } from 'react'
import { ChoiceStatsQueries } from '@/lib/supabase/queries'
import type { Database } from '@/types/database'

type ChoiceStatistic = Database['public']['Views']['choice_statistics_cached']['Row']

interface ChoiceStatisticsProps {
  choiceSlug: string
  genre: string
  selectedOptionId?: string
  onStatisticsLoaded?: (stats: ChoiceStatistic[]) => void
}

export function ChoiceStatistics({ 
  choiceSlug, 
  genre, 
  selectedOptionId,
  onStatisticsLoaded 
}: ChoiceStatisticsProps) {
  const [statistics, setStatistics] = useState<ChoiceStatistic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const stats = await ChoiceStatsQueries.getChoiceStatistics(choiceSlug, genre)
        setStatistics(stats)
        onStatisticsLoaded?.(stats)
      } catch (err) {
        console.error('Error loading choice statistics:', err)
        setError('Failed to load statistics')
      } finally {
        setIsLoading(false)
      }
    }

    if (choiceSlug && genre) {
      loadStatistics()
    }
  }, [choiceSlug, genre, onStatisticsLoaded])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'ultra-rare':
        return 'text-purple-600 bg-purple-100'
      case 'rare':
        return 'text-yellow-600 bg-yellow-100'
      case 'uncommon':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'ultra-rare':
        return '💎'
      case 'rare':
        return '⭐'
      case 'uncommon':
        return '🔸'
      default:
        return '⚪'
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-gray-500">
        Statistics unavailable
      </div>
    )
  }

  if (statistics.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Be the first to make this choice!
      </div>
    )
  }

  // Find the selected option's statistics
  const selectedStats = selectedOptionId 
    ? statistics.find(stat => stat.option_id === selectedOptionId)
    : null

  return (
    <div className="space-y-2">
      {selectedStats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getRarityIcon(selectedStats.rarity_level || 'common')}</span>
              <span className="text-sm font-medium text-blue-800">
                Your Choice
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-800">
                {(selectedStats.percentage || 0).toFixed(1)}%
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getRarityColor(selectedStats.rarity_level || 'common')}`}>
                {selectedStats.rarity_level || 'common'}
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm text-blue-700">
            {(selectedStats.percentage || 0) < 10 
              ? `Only ${(selectedStats.percentage || 0).toFixed(1)}% of players made this choice!`
              : (selectedStats.percentage || 0) < 25
              ? `${(selectedStats.percentage || 0).toFixed(1)}% of players chose this path`
              : (selectedStats.percentage || 0) < 50
              ? `${(selectedStats.percentage || 0).toFixed(1)}% of players made this choice`
              : `Most players (${(selectedStats.percentage || 0).toFixed(1)}%) chose this option`
            }
          </div>
        </div>
      )}

      {!selectedOptionId && (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Global Choice Distribution:
          </div>
          {statistics
            .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
            .map((stat) => (
              <div key={stat.option_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                    {stat.option_id}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${getRarityColor(stat.rarity_level || 'common')}`}>
                    {stat.rarity_level || 'common'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stat.percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-gray-600 w-12 text-right">
                    {(stat.percentage || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}