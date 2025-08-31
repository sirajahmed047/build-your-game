import { supabase } from '@/lib/supabase/client'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export interface AnalyticsFilters {
  startDate?: Date
  endDate?: Date
  userId?: string
  sessionId?: string
  eventType?: string
  genre?: string
}

export interface UserEngagementMetrics {
  totalEvents: number
  uniqueSessions: number
  avgEventsPerSession: number
  totalTimeSpent: number
  storiesStarted: number
  storiesCompleted: number
  choicesMade: number
  featuresUsed: string[]
  lastActivity: Date
}

export interface ConversionFunnelData {
  step: string
  users: number
  conversionRate: number
}

// Get user engagement metrics
export async function getUserEngagementMetrics(
  userId: string,
  filters: AnalyticsFilters = {}
): Promise<UserEngagementMetrics | null> {
  try {
    const startDate = filters.startDate || subDays(new Date(), 30)
    const endDate = filters.endDate || new Date()

    // Get user story runs as events
    const { data: events, error: eventsError } = await supabase
      .from('story_runs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (eventsError) throw eventsError

    // Get user story steps as session data
    const { data: sessions, error: sessionsError } = await supabase
      .from('story_steps')
      .select('*, story_runs!inner(*)')
      .eq('story_runs.user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())

    if (sessionsError) throw sessionsError

    // Get feature usage from story genres as proxy
    const { data: features, error: featuresError } = await supabase
      .from('story_runs')
      .select('genre')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (featuresError) throw featuresError

    // Calculate metrics
    const totalEvents = events?.length || 0
    const uniqueSessions = new Set(events?.map(e => e.session_id)).size
    const avgEventsPerSession = uniqueSessions > 0 ? totalEvents / uniqueSessions : 0
    const totalTimeSpent = 0 // Not tracking time yet
    const storiesStarted = events?.length || 0
    const storiesCompleted = events?.filter(e => e.completed).length || 0
    const choicesMade = sessions?.length || 0
    const featuresUsed = Array.from(new Set(features?.map(f => f.genre) || []))
    const lastActivity = events?.length > 0
      ? new Date(Math.max(...events.map(e => new Date(e.created_at || '').getTime())))
      : new Date()

    return {
      totalEvents,
      uniqueSessions,
      avgEventsPerSession: Math.round(avgEventsPerSession * 100) / 100,
      totalTimeSpent,
      storiesStarted,
      storiesCompleted,
      choicesMade,
      featuresUsed,
      lastActivity
    }
  } catch (error) {
    console.error('Failed to get user engagement metrics:', error)
    return null
  }
}

// Get conversion funnel data
export async function getConversionFunnelData(
  filters: AnalyticsFilters = {}
): Promise<ConversionFunnelData[]> {
  try {
    const startDate = filters.startDate || subDays(new Date(), 30)
    const endDate = filters.endDate || new Date()

    // Get all story runs in the date range
    const { data: events, error } = await supabase
      .from('story_runs')
      .select('genre, user_id, session_id, completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    // Calculate funnel steps
    const uniqueUsers = new Set(
      events?.map(e => e.user_id || e.session_id).filter(Boolean)
    )
    const totalUsers = uniqueUsers.size

    const storyStartUsers = new Set(
      events?.map(e => e.user_id || e.session_id)
        .filter(Boolean)
    ).size

    const choiceMadeUsers = new Set(
      events?.map(e => e.user_id || e.session_id)
        .filter(Boolean)
    ).size

    const storyCompleteUsers = new Set(
      events?.filter(e => e.completed)
        .map(e => e.user_id || e.session_id)
        .filter(Boolean)
    ).size

    const featureViewUsers = new Set(
      events?.map(e => e.user_id || e.session_id)
        .filter(Boolean)
    ).size

    const upgradeClickUsers = 0 // Not tracking upgrades yet

    return [
      {
        step: 'Visited Site',
        users: totalUsers,
        conversionRate: 100
      },
      {
        step: 'Started Story',
        users: storyStartUsers,
        conversionRate: totalUsers > 0 ? (storyStartUsers / totalUsers) * 100 : 0
      },
      {
        step: 'Made Choice',
        users: choiceMadeUsers,
        conversionRate: totalUsers > 0 ? (choiceMadeUsers / totalUsers) * 100 : 0
      },
      {
        step: 'Completed Story',
        users: storyCompleteUsers,
        conversionRate: totalUsers > 0 ? (storyCompleteUsers / totalUsers) * 100 : 0
      },
      {
        step: 'Viewed Features',
        users: featureViewUsers,
        conversionRate: totalUsers > 0 ? (featureViewUsers / totalUsers) * 100 : 0
      },
      {
        step: 'Clicked Upgrade',
        users: upgradeClickUsers,
        conversionRate: totalUsers > 0 ? (upgradeClickUsers / totalUsers) * 100 : 0
      }
    ]
  } catch (error) {
    console.error('Failed to get conversion funnel data:', error)
    return []
  }
}

// Get retention metrics
export async function getRetentionMetrics(cohortDate: Date): Promise<number[]> {
  try {
    // Return empty retention data for now - not implemented yet
    const data: any[] = []
    const error = null

    if (error) throw error

    // Return retention rates for first 30 days
    const retentionRates = new Array(31).fill(0)
    data?.forEach(row => {
      if (row.period_number <= 30) {
        retentionRates[row.period_number] = row.retention_rate
      }
    })

    return retentionRates
  } catch (error) {
    console.error('Failed to get retention metrics:', error)
    return new Array(31).fill(0)
  }
}

// Get popular choices analytics
export async function getPopularChoicesAnalytics(
  genre?: string,
  limit: number = 10
): Promise<Array<{
  choice_slug: string | null
  total_impressions: number | null
  total_selections: number | null
  avg_selection_rate: number | null
  rarity_level: string | null
}>> {
  try {
    let query = supabase
      .from('choice_statistics_cached')
      .select('*')
      .order('selections', { ascending: false })
      .limit(limit)

    if (genre) {
      query = query.eq('genre', genre)
    }

    const { data, error } = await query

    if (error) throw error

    return data?.map(row => ({
      choice_slug: row.choice_slug,
      total_impressions: row.impressions,
      total_selections: row.selections,
      avg_selection_rate: row.percentage,
      rarity_level: (row.percentage || 0) < 5 ? 'ultra-rare' : (row.percentage || 0) < 15 ? 'rare' : (row.percentage || 0) < 35 ? 'uncommon' : 'common'
    })) || []
  } catch (error) {
    console.error('Failed to get popular choices analytics:', error)
    return []
  }
}

// Get user journey analytics
export async function getUserJourneyAnalytics(
  userId: string,
  limit: number = 50
): Promise<Array<{
  timestamp: Date
  event_type: string
  event_data: any
  page_url?: string
}>> {
  try {
    const { data, error } = await supabase
      .from('story_runs')
      .select('created_at, genre, completed')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data?.map(row => ({
      timestamp: new Date(row.created_at || ''),
      event_type: row.completed ? 'story_complete' : 'story_start',
      event_data: { genre: row.genre, completed: row.completed },
      page_url: undefined
    })) || []
  } catch (error) {
    console.error('Failed to get user journey analytics:', error)
    return []
  }
}

// Trigger manual metrics calculation
export async function triggerMetricsCalculation(date?: Date): Promise<boolean> {
  try {
    const targetDate = date || subDays(new Date(), 1)

    // Daily metrics calculation not implemented yet
    const error = null

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to trigger metrics calculation:', error)
    return false
  }
}