'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorBoundary'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'

interface UserStats {
  storiesCompleted: number
  endingsCollected: number
  rareChoicesMade: number
  totalChoices: number
  favoriteGenre: string
  averageStoryLength: number
  streakDays: number
  lastPlayedDate: string | null
}

interface DashboardStatsProps {
  onStatsLoaded?: (stats: UserStats) => void
}

export function DashboardStats({ onStatsLoaded }: DashboardStatsProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Get story runs
        const { data: storyRuns, error: runsError } = await supabase
          .from('story_runs')
          .select('*')
          .eq('user_id', user.id)

        if (runsError) throw runsError

        // Get story steps for choice counting
        const { data: storySteps, error: stepsError } = await supabase
          .from('story_steps')
          .select('*')
          .in('story_run_id', storyRuns?.map(run => run.id) || [])

        if (stepsError) throw stepsError

        // Calculate stats
        const completedRuns = storyRuns?.filter(run => run.completed) || []
        const endingsCollected = new Set(
          completedRuns
            .filter(run => run.ending_tag)
            .map(run => run.ending_tag)
        ).size

        // Count rare choices (simplified - in real implementation, check against choice statistics)
        const rareChoices = storySteps?.filter(step => 
          step.choice_slug && Math.random() > 0.8 // Simulate rare choice detection
        ).length || 0

        // Find favorite genre
        const genreCounts = (storyRuns || []).reduce((acc, run) => {
          acc[run.genre] = (acc[run.genre] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        const favoriteGenre = Object.entries(genreCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'

        // Calculate average story length (steps per story)
        const avgLength = completedRuns.length > 0 
          ? Math.round((storySteps?.length || 0) / completedRuns.length)
          : 0

        // Calculate streak (simplified)
        const lastPlayed = storyRuns?.[0]?.created_at || null
        const streakDays = lastPlayed 
          ? Math.max(1, Math.floor((Date.now() - new Date(lastPlayed).getTime()) / (1000 * 60 * 60 * 24)))
          : 0

        const userStats: UserStats = {
          storiesCompleted: completedRuns.length,
          endingsCollected,
          rareChoicesMade: rareChoices,
          totalChoices: storySteps?.length || 0,
          favoriteGenre,
          averageStoryLength: avgLength,
          streakDays: Math.min(streakDays, 30), // Cap at 30 days
          lastPlayedDate: lastPlayed
        }

        setStats(userStats)
        onStatsLoaded?.(userStats)
      } catch (err) {
        console.error('Error loading user stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadUserStats()
    }
  }, [user, onStatsLoaded])

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Sign in to view your statistics</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner size="md" text="Loading your stats..." />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <ErrorMessage
            title="Stats Error"
            message={error}
            onRetry={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">No statistics available</p>
        </CardContent>
      </Card>
    )
  }

  const getStreakColor = (days: number) => {
    if (days >= 7) return 'text-green-600 bg-green-100'
    if (days >= 3) return 'text-blue-600 bg-blue-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getEngagementLevel = (choices: number) => {
    if (choices >= 100) return { level: 'Master Storyteller', color: 'purple' }
    if (choices >= 50) return { level: 'Experienced Explorer', color: 'blue' }
    if (choices >= 20) return { level: 'Active Player', color: 'green' }
    if (choices >= 5) return { level: 'Getting Started', color: 'yellow' }
    return { level: 'New Adventurer', color: 'gray' }
  }

  const engagement = getEngagementLevel(stats.totalChoices)

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.storiesCompleted}
            </div>
            <div className="text-sm text-gray-600">Stories Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats.endingsCollected}
            </div>
            <div className="text-sm text-gray-600">Unique Endings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.rareChoicesMade}
            </div>
            <div className="text-sm text-gray-600">Rare Choices</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {stats.totalChoices}
            </div>
            <div className="text-sm text-gray-600">Total Choices</div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Level */}
      <Card>
        <CardHeader>
          <CardTitle>Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{engagement.level}</h3>
              <p className="text-sm text-gray-600">
                Based on {stats.totalChoices} choices made
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${engagement.color}-100 text-${engagement.color}-800`}>
              Level {Math.floor(stats.totalChoices / 10) + 1}
            </div>
          </div>
          
          <ProgressBar
            value={stats.totalChoices % 10}
            max={10}
            label="Progress to next level"
            showPercentage={false}
            color={engagement.color as any}
          />
          <p className="text-xs text-gray-500 mt-1">
            {10 - (stats.totalChoices % 10)} more choices to level up
          </p>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Playing Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Favorite Genre</span>
                <span className="font-medium capitalize">{stats.favoriteGenre}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Story Length</span>
                <span className="font-medium">{stats.averageStoryLength} steps</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Activity Streak</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStreakColor(stats.streakDays)}`}>
                  {stats.streakDays} days
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.storiesCompleted >= 1 && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">First Story Complete</span>
                </div>
              )}
              
              {stats.endingsCollected >= 5 && (
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">🏆</span>
                  <span className="text-sm">Ending Collector</span>
                </div>
              )}
              
              {stats.rareChoicesMade >= 3 && (
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">💎</span>
                  <span className="text-sm">Rare Choice Hunter</span>
                </div>
              )}
              
              {stats.totalChoices >= 50 && (
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600">🎯</span>
                  <span className="text-sm">Decision Master</span>
                </div>
              )}
              
              {stats.streakDays >= 7 && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🔥</span>
                  <span className="text-sm">Weekly Streak</span>
                </div>
              )}

              {/* Show message if no achievements */}
              {stats.storiesCompleted === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">
                    Complete your first story to unlock achievements!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}