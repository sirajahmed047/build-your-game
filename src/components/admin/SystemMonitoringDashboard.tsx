'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks?: Record<string, any>
  error?: string
}

interface PerformanceMetrics {
  timestamp: string
  totalResponseTime: number
  performanceScore: number
  metrics: Record<string, any>
  alerts: string[]
}

interface MaterializedViewStatus {
  timestamp: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  materializedViews: any[]
  analysis: {
    overallStatus: string
    issues: string[]
    metrics: Record<string, any>
  }
  recommendations: string[]
}

export function SystemMonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [mvStatus, setMvStatus] = useState<MaterializedViewStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealthData = async () => {
    try {
      const [healthRes, perfRes, mvRes] = await Promise.all([
        fetch('/api/health/database'),
        fetch('/api/monitoring/performance'),
        fetch('/api/monitoring/materialized-views')
      ])

      const [health, perf, mv] = await Promise.all([
        healthRes.json(),
        perfRes.json(),
        mvRes.json()
      ])

      setHealthStatus(health)
      setPerformanceMetrics(perf)
      setMvStatus(mv)
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchHealthData()
  }

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/monitoring/materialized-views', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (response.ok) {
        // Refresh data after manual trigger
        setTimeout(() => fetchHealthData(), 2000)
      } else {
        console.error('Manual refresh failed:', result.error)
      }
    } catch (error) {
      console.error('Manual refresh failed:', error)
    }
  }

  useEffect(() => {
    fetchHealthData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2">Loading system monitoring data...</span>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'degraded': return 'text-yellow-600 bg-yellow-50'
      case 'unhealthy': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'degraded': return '⚠️'
      case 'unhealthy': return '❌'
      default: return '❓'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Monitoring Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? <LoadingSpinner className="w-4 h-4" /> : '🔄'}
            Refresh
          </Button>
          <Button
            onClick={handleManualRefresh}
            disabled={refreshing}
            variant="outline"
          >
            Manual MV Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Database Health</h3>
            <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(healthStatus?.status || 'unknown')}`}>
              {getStatusIcon(healthStatus?.status || 'unknown')} {healthStatus?.status || 'Unknown'}
            </span>
          </div>
          {healthStatus?.checks && (
            <div className="mt-2 space-y-1 text-sm">
              {Object.entries(healthStatus.checks).map(([key, check]: [string, any]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span className={getStatusColor(check.status)}>
                    {check.status} ({check.responseTime})
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Performance Score</h3>
            <span className={`px-2 py-1 rounded-full text-sm ${
              (performanceMetrics?.performanceScore || 0) >= 85 ? 'text-green-600 bg-green-50' :
              (performanceMetrics?.performanceScore || 0) >= 70 ? 'text-yellow-600 bg-yellow-50' :
              'text-red-600 bg-red-50'
            }`}>
              {performanceMetrics?.performanceScore || 0}%
            </span>
          </div>
          {performanceMetrics && (
            <div className="mt-2 text-sm text-gray-600">
              Response Time: {performanceMetrics.totalResponseTime}ms
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Materialized Views</h3>
            <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(mvStatus?.status || 'unknown')}`}>
              {getStatusIcon(mvStatus?.status || 'unknown')} {mvStatus?.status || 'Unknown'}
            </span>
          </div>
          {mvStatus?.analysis && (
            <div className="mt-2 text-sm text-gray-600">
              Issues: {mvStatus.analysis.issues.length}
            </div>
          )}
        </Card>
      </div>

      {/* Performance Alerts */}
      {performanceMetrics?.alerts && performanceMetrics.alerts.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-800 mb-2">Performance Alerts</h3>
          <ul className="space-y-1">
            {performanceMetrics.alerts.map((alert, index) => (
              <li key={index} className="text-red-700 text-sm">
                • {alert}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Materialized View Issues */}
      {mvStatus?.analysis.issues && mvStatus.analysis.issues.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <h3 className="font-semibold text-yellow-800 mb-2">Materialized View Issues</h3>
          <ul className="space-y-1 mb-4">
            {mvStatus.analysis.issues.map((issue, index) => (
              <li key={index} className="text-yellow-700 text-sm">
                • {issue}
              </li>
            ))}
          </ul>
          
          <h4 className="font-medium text-yellow-800 mb-2">Recommendations:</h4>
          <ul className="space-y-1">
            {mvStatus.recommendations.map((rec, index) => (
              <li key={index} className="text-yellow-700 text-sm">
                → {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Metrics */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Database Metrics</h3>
          {healthStatus?.checks && (
            <div className="space-y-3">
              {Object.entries(healthStatus.checks).map(([key, check]: [string, any]) => (
                <div key={key} className="border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{key}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(check.status)}`}>
                      {check.status}
                    </span>
                  </div>
                  {check.data && (
                    <div className="text-sm text-gray-600">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(check.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {check.error && (
                    <div className="text-sm text-red-600">
                      Error: {check.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Materialized View Details */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Materialized View Status</h3>
          {mvStatus?.materializedViews && (
            <div className="space-y-3">
              {mvStatus.materializedViews.map((view, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{view.view_name}</span>
                    <span className="text-sm text-gray-600">
                      {view.success_rate_24h}% success
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Last refresh: {new Date(view.last_refresh_at).toLocaleString()}</div>
                    <div>Avg duration: {view.avg_duration_24h}s</div>
                    <div>Total refreshes (24h): {view.total_refreshes_24h}</div>
                  </div>
                  {view.last_error && (
                    <div className="text-sm text-red-600 mt-1">
                      Last error: {view.last_error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* System Health Dashboard */}
      {healthStatus?.checks?.systemHealth?.data && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">System Health Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {healthStatus.checks.systemHealth.data.map((metric: any, index: number) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.metric}</div>
                <div className={`text-xs px-2 py-1 rounded mt-1 ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  )
}