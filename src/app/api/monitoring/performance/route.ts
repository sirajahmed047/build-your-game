import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const startTime = Date.now()
    const metrics: Record<string, any> = {}

    // Choice statistics job performance
    const queryStartTime = Date.now()
    const { data: queryStats, error: queryError } = await supabase
      .rpc('get_choice_statistics_job_health')

    metrics.choiceStatisticsPerformance = {
      responseTime: Date.now() - queryStartTime,
      status: queryError ? 'error' : 'success',
      data: queryStats,
      error: queryError?.message
    }

    // Ending statistics performance
    const tableStatsStartTime = Date.now()
    const { data: tableStats, error: tableStatsError } = await supabase
      .rpc('get_ending_statistics')

    metrics.endingStatistics = {
      responseTime: Date.now() - tableStatsStartTime,
      status: tableStatsError ? 'error' : 'success',
      data: tableStats,
      error: tableStatsError?.message
    }

    // Rate limiting performance
    const mvStartTime = Date.now()
    const { data: mvHealth, error: mvError } = await supabase
      .rpc('get_rate_limit_status', { user_identifier: 'performance-check' })

    metrics.rateLimitingHealth = {
      responseTime: Date.now() - mvStartTime,
      status: mvError ? 'error' : 'success',
      data: mvHealth,
      error: mvError?.message
    }

    // Basic table performance check
    const activityStartTime = Date.now()
    const { data: systemHealth, error: systemError } = await supabase
      .from('choice_aggregates')
      .select('count')
      .limit(1)

    metrics.databasePerformance = {
      responseTime: Date.now() - activityStartTime,
      status: systemError ? 'error' : 'success',
      data: systemHealth,
      error: systemError?.message
    }

    // Calculate performance scores
    const performanceScore = calculatePerformanceScore(metrics)
    
    const totalResponseTime = Date.now() - startTime

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      totalResponseTime,
      performanceScore,
      metrics,
      alerts: generatePerformanceAlerts(metrics, performanceScore)
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Performance monitoring failed:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

function calculatePerformanceScore(metrics: Record<string, any>): number {
  let score = 100
  
  // Deduct points for slow response times
  Object.values(metrics).forEach((metric: any) => {
    if (metric.responseTime > 1000) score -= 10
    else if (metric.responseTime > 500) score -= 5
    
    if (metric.status === 'error') score -= 20
  })
  
  return Math.max(0, score)
}

function generatePerformanceAlerts(metrics: Record<string, any>, score: number): string[] {
  const alerts: string[] = []
  
  if (score < 70) {
    alerts.push('CRITICAL: Overall performance score is below 70%')
  } else if (score < 85) {
    alerts.push('WARNING: Performance degradation detected')
  }
  
  Object.entries(metrics).forEach(([key, metric]: [string, any]) => {
    if (metric.status === 'error') {
      alerts.push(`ERROR: ${key} check failed - ${metric.error}`)
    }
    
    if (metric.responseTime > 2000) {
      alerts.push(`WARNING: ${key} response time is high (${metric.responseTime}ms)`)
    }
  })
  
  return alerts
}