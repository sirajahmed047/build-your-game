'use client'

import { useState, useEffect } from 'react'
import { ChoiceStatsQueries } from '@/lib/supabase/queries'

interface CronJobHealth {
  last_success: string | null
  last_error: string | null
  success_count_24h: number
  error_count_24h: number
  avg_duration_seconds: number | null
  current_row_count: number
}

export function CronJobMonitor() {
  const [health, setHealth] = useState<CronJobHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadHealth = async () => {
    try {
      setError(null)
      const healthData = await ChoiceStatsQueries.getCronJobHealth()
      setHealth(healthData)
    } catch (err) {
      console.error('Error loading cron job health:', err)
      setError('Failed to load cron job health')
    } finally {
      setIsLoading(false)
    }
  }

  const manualRefresh = async () => {
    try {
      setIsRefreshing(true)
      await ChoiceStatsQueries.refreshChoiceStatistics()
      // Reload health after refresh
      await loadHealth()
    } catch (err) {
      console.error('Error manually refreshing:', err)
      setError('Failed to manually refresh statistics')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadHealth()
    
    // Refresh health every 30 seconds
    const interval = setInterval(loadHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getHealthStatus = () => {
    if (!health) return 'unknown'
    
    const now = new Date()
    const lastSuccess = health.last_success ? new Date(health.last_success) : null
    const lastError = health.last_error ? new Date(health.last_error) : null
    
    // If no recent success (within 10 minutes), it's unhealthy
    if (!lastSuccess || (now.getTime() - lastSuccess.getTime()) > 10 * 60 * 1000) {
      return 'unhealthy'
    }
    
    // If recent errors, it's warning
    if (lastError && (now.getTime() - lastError.getTime()) < 60 * 60 * 1000) {
      return 'warning'
    }
    
    return 'healthy'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    return `${seconds.toFixed(2)}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  const status = getHealthStatus()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Choice Statistics Cron Job</h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.toUpperCase()}
          </span>
          <button
            onClick={manualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Manual Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Last Success</label>
              <p className="text-sm text-gray-900">{formatDate(health.last_success)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Last Error</label>
              <p className="text-sm text-gray-900">{formatDate(health.last_error)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Average Duration</label>
              <p className="text-sm text-gray-900">{formatDuration(health.avg_duration_seconds)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Success Count (24h)</label>
              <p className="text-sm text-gray-900">{health.success_count_24h}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Error Count (24h)</label>
              <p className="text-sm text-gray-900">{health.error_count_24h}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Current Row Count</label>
              <p className="text-sm text-gray-900">{health.current_row_count.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p>Cron job runs every 5 minutes to refresh choice statistics materialized view.</p>
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}