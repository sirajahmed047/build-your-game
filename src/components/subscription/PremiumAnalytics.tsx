'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, Crown, Lock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'

interface PremiumAnalyticsProps {
  onUpgradeClick?: () => void
}

interface AdvancedAnalytics {
  personalityEvolution: {
    date: string
    traits: Record<string, number>
  }[]
  choicePatterns: {
    category: string
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }[]
  rarityStats: {
    commonChoices: number
    uncommonChoices: number
    rareChoices: number
    ultraRareChoices: number
  }
  comparisonMetrics: {
    trait: string
    userValue: number
    globalAverage: number
    percentile: number
  }[]
}

export function PremiumAnalytics({ onUpgradeClick }: PremiumAnalyticsProps) {
  const { user } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription()
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAdvancedAnalytics = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // First get user's story runs
      const { data: userStoryRuns } = await supabase
        .from('story_runs')
        .select('id')
        .eq('user_id', user.id)

      if (!userStoryRuns || userStoryRuns.length === 0) {
        setAnalytics(processAnalyticsData([], []))
        return
      }

      const storyRunIds = userStoryRuns.map(run => run.id)

      // Load personality evolution over time
      const { data: storySteps } = await supabase
        .from('story_steps')
        .select('created_at, traits_snapshot')
        .in('story_run_id', storyRunIds)
        .not('traits_snapshot', 'is', null)
        .order('created_at', { ascending: true })
        .limit(50)

      // Load choice rarity statistics
      const { data: choiceStats } = await supabase
        .from('story_steps')
        .select('choice_slug, selected_choice_id')
        .in('story_run_id', storyRunIds)
        .not('choice_slug', 'is', null)
        .not('selected_choice_id', 'is', null)

      // Process the data
      const processedAnalytics = processAnalyticsData(storySteps || [], choiceStats || [])
      setAnalytics(processedAnalytics)
    } catch (error) {
      console.error('Error loading advanced analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user && isPremium) {
      loadAdvancedAnalytics()
    } else {
      setLoading(false)
    }
  }, [user, isPremium, loadAdvancedAnalytics])

  const processAnalyticsData = (storySteps: any[], choiceStats: any[]): AdvancedAnalytics => {
    // Process personality evolution
    const personalityEvolution = storySteps
      .filter(step => step.traits_snapshot)
      .slice(-10) // Last 10 data points
      .map(step => ({
        date: new Date(step.created_at).toLocaleDateString(),
        traits: step.traits_snapshot as Record<string, number>
      }))

    // Process choice patterns (mock data for MVP)
    const choicePatterns = [
      { category: 'Risk Taking', percentage: 67, trend: 'up' as const },
      { category: 'Empathetic Choices', percentage: 45, trend: 'stable' as const },
      { category: 'Leadership Decisions', percentage: 78, trend: 'up' as const },
      { category: 'Creative Solutions', percentage: 34, trend: 'down' as const }
    ]

    // Process rarity stats (mock data for MVP)
    const rarityStats = {
      commonChoices: choiceStats.length * 0.6,
      uncommonChoices: choiceStats.length * 0.25,
      rareChoices: choiceStats.length * 0.12,
      ultraRareChoices: choiceStats.length * 0.03
    }

    // Process comparison metrics (mock data for MVP)
    const comparisonMetrics = [
      { trait: 'Risk Taking', userValue: 67, globalAverage: 45, percentile: 78 },
      { trait: 'Empathy', userValue: 45, globalAverage: 52, percentile: 34 },
      { trait: 'Leadership', userValue: 78, globalAverage: 48, percentile: 89 },
      { trait: 'Creativity', userValue: 34, globalAverage: 51, percentile: 23 }
    ]

    return {
      personalityEvolution,
      choicePatterns,
      rarityStats,
      comparisonMetrics
    }
  }

  if (subscriptionLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  if (!isPremium) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Advanced Analytics
          </h3>
          
          <p className="text-gray-600 mb-6">
            Unlock detailed personality insights, choice pattern analysis, and comparative metrics with Premium.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <BarChart3 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="font-medium text-gray-900">Personality Evolution</div>
              <div className="text-gray-600">Track changes over time</div>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="font-medium text-gray-900">Choice Patterns</div>
              <div className="text-gray-600">Analyze decision trends</div>
            </div>
          </div>

          <Button
            onClick={onUpgradeClick}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
          <p>No analytics data available yet.</p>
          <p className="text-sm">Complete more stories to see insights.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Premium Analytics</h2>
            <p className="text-sm text-gray-600">Advanced insights into your story choices</p>
          </div>
        </div>
      </Card>

      {/* Choice Patterns */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
          Choice Patterns
        </h3>
        <div className="space-y-4">
          {analytics.choicePatterns.map((pattern, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{pattern.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{pattern.percentage}%</span>
                    <div className={`w-2 h-2 rounded-full ${
                      pattern.trend === 'up' ? 'bg-green-500' :
                      pattern.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pattern.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rarity Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 text-yellow-500 mr-2" />
          Choice Rarity Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(analytics.rarityStats.commonChoices)}
            </div>
            <div className="text-sm text-green-700">Common Choices</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(analytics.rarityStats.uncommonChoices)}
            </div>
            <div className="text-sm text-blue-700">Uncommon Choices</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(analytics.rarityStats.rareChoices)}
            </div>
            <div className="text-sm text-purple-700">Rare Choices</div>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">
              {Math.round(analytics.rarityStats.ultraRareChoices)}
            </div>
            <div className="text-sm text-pink-700">Ultra-Rare Choices</div>
          </div>
        </div>
      </Card>

      {/* Comparison Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 text-indigo-500 mr-2" />
          Global Comparison
        </h3>
        <div className="space-y-4">
          {analytics.comparisonMetrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{metric.trait}</span>
                <span className="text-sm text-gray-600">
                  {metric.percentile}th percentile
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">You: {metric.userValue}</span>
                    <span className="text-gray-600">Global: {metric.globalAverage}</span>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${(metric.userValue / 100) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 w-1 h-2 bg-gray-500 rounded-full"
                      style={{ left: `${(metric.globalAverage / 100) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default PremiumAnalytics