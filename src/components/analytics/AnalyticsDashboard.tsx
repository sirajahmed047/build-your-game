'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface DailyMetrics {
  date: string
  total_users: number | null
  new_users: number | null
  returning_users: number | null
  guest_users: number | null
  total_sessions: number | null
  total_story_starts: number | null
  total_story_completions: number | null
  total_choices_made: number | null
  avg_session_duration_seconds: number | null
  bounce_rate: number | null
  conversion_rate: number | null
}

interface RetentionData {
  cohort_date: string
  period_number: number
  users_count: number | null
  retention_rate: number | null
}

interface EngagementMetrics {
  totalEvents: number
  uniqueUsers: number
  avgEventsPerUser: number
  topEvents: Array<{ event_type: string; count: number }>
  topFeatures: Array<{ feature_name: string; usage_count: number }>
}

export function AnalyticsDashboard() {
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  const [retentionData, setRetentionData] = useState<RetentionData[]>([])
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(7) // Last 7 days

  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadDailyMetrics(),
        loadRetentionData(),
        loadEngagementMetrics()
      ])
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDailyMetrics = async () => {
    const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Failed to load daily metrics:', error)
      return
    }

    setDailyMetrics(data || [])
  }

  const loadRetentionData = async () => {
    const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('retention_cohorts')
      .select('*')
      .gte('cohort_date', startDate)
      .lte('period_number', 7) // First week retention
      .order('cohort_date', { ascending: true })

    if (error) {
      console.error('Failed to load retention data:', error)
      return
    }

    setRetentionData(data || [])
  }

  const loadEngagementMetrics = async () => {
    const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd')
    
    // Get event counts
    const { data: eventData, error: eventError } = await supabase
      .from('user_events')
      .select('event_type, user_id, session_id')
      .gte('created_at', startDate)

    if (eventError) {
      console.error('Failed to load event data:', eventError)
      return
    }

    // Get feature usage
    const { data: featureData, error: featureError } = await supabase
      .from('feature_usage')
      .select('feature_name, usage_count')
      .gte('first_used_at', startDate)

    if (featureError) {
      console.error('Failed to load feature data:', featureError)
      return
    }

    // Process the data
    const totalEvents = eventData?.length || 0
    const uniqueUsers = new Set(
      eventData?.map(e => e.user_id || e.session_id).filter(Boolean)
    ).size
    const avgEventsPerUser = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0

    // Top events
    const eventCounts = eventData?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topEvents = Object.entries(eventCounts)
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top features
    const featureCounts = featureData?.reduce((acc, feature) => {
      acc[feature.feature_name] = (acc[feature.feature_name] || 0) + (feature.usage_count || 0)
      return acc
    }, {} as Record<string, number>) || {}

    const topFeatures = Object.entries(featureCounts)
      .map(([feature_name, usage_count]) => ({ feature_name, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5)

    setEngagementMetrics({
      totalEvents,
      uniqueUsers,
      avgEventsPerUser: Math.round(avgEventsPerUser * 100) / 100,
      topEvents,
      topFeatures
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const latestMetrics = dailyMetrics[dailyMetrics.length - 1]
  const totalMetrics = dailyMetrics.reduce((acc, day) => ({
    total_users: acc.total_users + (day.total_users || 0),
    total_sessions: acc.total_sessions + (day.total_sessions || 0),
    total_story_starts: acc.total_story_starts + (day.total_story_starts || 0),
    total_story_completions: acc.total_story_completions + (day.total_story_completions || 0),
    total_choices_made: acc.total_choices_made + (day.total_choices_made || 0),
    avg_bounce_rate: acc.avg_bounce_rate + (day.bounce_rate || 0),
    avg_conversion_rate: acc.avg_conversion_rate + (day.conversion_rate || 0)
  }), {
    total_users: 0,
    total_sessions: 0,
    total_story_starts: 0,
    total_story_completions: 0,
    total_choices_made: 0,
    avg_bounce_rate: 0,
    avg_conversion_rate: 0
  })

  const avgBounceRate = dailyMetrics.length > 0 ? totalMetrics.avg_bounce_rate / dailyMetrics.length : 0
  const avgConversionRate = dailyMetrics.length > 0 ? totalMetrics.avg_conversion_rate / dailyMetrics.length : 0
  const completionRate = totalMetrics.total_story_starts > 0 
    ? (totalMetrics.total_story_completions / totalMetrics.total_story_starts) * 100 
    : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{totalMetrics.total_users}</p>
          {latestMetrics && (
            <p className="text-sm text-gray-600 mt-1">
              {latestMetrics.new_users || 0} new, {latestMetrics.returning_users || 0} returning
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Story Completion Rate</h3>
          <p className="text-3xl font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 mt-1">
            {totalMetrics.total_story_completions} / {totalMetrics.total_story_starts} stories
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Session Duration</h3>
          <p className="text-3xl font-bold text-gray-900">
            {latestMetrics ? formatDuration(latestMetrics.avg_session_duration_seconds || 0) : '0m 0s'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Bounce rate: {avgBounceRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-gray-900">{avgConversionRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 mt-1">Free to premium</p>
        </div>
      </div>

      {/* Engagement Metrics */}
      {engagementMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Events</h3>
            <div className="space-y-3">
              {engagementMetrics.topEvents.map((event, index) => (
                <div key={event.event_type} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {event.event_type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">{event.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
            <div className="space-y-3">
              {engagementMetrics.topFeatures.map((feature, index) => (
                <div key={feature.feature_name} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {feature.feature_name.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">{feature.usage_count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Metrics Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stories Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stories Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Choices Made
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyMetrics.map((day) => (
                <tr key={day.date}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {format(new Date(day.date), 'MMM dd')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.total_users || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.total_sessions || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.total_story_starts || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.total_story_completions || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.total_choices_made || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retention Cohorts */}
      {retentionData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Retention Cohorts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cohort Date
                  </th>
                  {[...Array(8)].map((_, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from(new Set(retentionData.map(d => d.cohort_date))).map(cohortDate => (
                  <tr key={cohortDate}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(new Date(cohortDate), 'MMM dd')}
                    </td>
                    {[...Array(8)].map((_, period) => {
                      const data = retentionData.find(
                        d => d.cohort_date === cohortDate && d.period_number === period
                      )
                      return (
                        <td key={period} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data ? `${data.retention_rate || 0}%` : '-'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}