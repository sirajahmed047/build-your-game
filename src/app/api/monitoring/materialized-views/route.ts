import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Get materialized view health
    const { data: mvHealth, error: mvError } = await supabase
      .rpc('get_materialized_view_health')

    if (mvError) {
      throw new Error(`Failed to get materialized view health: ${mvError.message}`)
    }

    // Get recent refresh logs
    const { data: refreshLogs, error: logsError } = await supabase
      .from('materialized_view_refresh_log')
      .select('*')
      .order('refresh_started_at', { ascending: false })
      .limit(20)

    if (logsError) {
      console.warn('Failed to get refresh logs:', logsError.message)
    }

    // Get cron job status
    const { data: cronStatus, error: cronError } = await supabase
      .from('cron_job_status')
      .select('*')
      .in('jobname', [
        'refresh_choice_stats_monitored',
        'refresh_user_engagement_every_15m'
      ])

    if (cronError) {
      console.warn('Failed to get cron status:', cronError.message)
    }

    const responseTime = Date.now() - startTime

    // Analyze health status
    const healthAnalysis = analyzeMaterializedViewHealth(mvHealth, refreshLogs, cronStatus)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      responseTime,
      status: healthAnalysis.overallStatus,
      materializedViews: mvHealth,
      recentRefreshes: refreshLogs,
      cronJobs: cronStatus,
      analysis: healthAnalysis,
      recommendations: generateRecommendations(healthAnalysis)
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Materialized view monitoring failed:', error)
    
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

export async function POST() {
  try {
    // Manual refresh trigger
    const { data, error } = await supabase
      .rpc('manual_refresh_choice_statistics')

    if (error) {
      throw new Error(`Manual refresh failed: ${error.message}`)
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      message: 'Manual refresh triggered successfully',
      result: data
    })
  } catch (error) {
    console.error('Manual refresh failed:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, {
      status: 500
    })
  }
}

function analyzeMaterializedViewHealth(
  mvHealth: any[], 
  refreshLogs: any[], 
  cronStatus: any[]
): {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy',
  issues: string[],
  metrics: Record<string, any>
} {
  const issues: string[] = []
  const metrics: Record<string, any> = {}

  // Analyze materialized view health
  if (mvHealth && mvHealth.length > 0) {
    mvHealth.forEach((view: any) => {
      const viewName = view.view_name
      metrics[viewName] = {
        lastRefresh: view.last_refresh_at,
        lastSuccess: view.last_success_at,
        successRate: view.success_rate_24h,
        avgDuration: view.avg_duration_24h
      }

      // Check for issues
      if (view.success_rate_24h < 90) {
        issues.push(`${viewName}: Low success rate (${view.success_rate_24h}%)`)
      }

      if (view.avg_duration_24h > 30) {
        issues.push(`${viewName}: High average refresh duration (${view.avg_duration_24h}s)`)
      }

      const lastRefresh = new Date(view.last_refresh_at)
      const hoursSinceRefresh = (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceRefresh > 1) {
        issues.push(`${viewName}: No refresh in ${Math.round(hoursSinceRefresh)} hours`)
      }
    })
  }

  // Analyze cron job status
  if (cronStatus && cronStatus.length > 0) {
    cronStatus.forEach((job: any) => {
      if (!job.active) {
        issues.push(`Cron job ${job.jobname} is inactive`)
      }

      if (job.last_status !== 'Success' && job.last_status !== 'Never run') {
        issues.push(`Cron job ${job.jobname} last status: ${job.last_status}`)
      }
    })
  }

  // Analyze recent refresh logs
  if (refreshLogs && refreshLogs.length > 0) {
    const recentFailures = refreshLogs.filter((log: any) => !log.success).length
    const failureRate = recentFailures / refreshLogs.length

    if (failureRate > 0.1) {
      issues.push(`High failure rate in recent refreshes: ${Math.round(failureRate * 100)}%`)
    }

    metrics.recentRefreshes = {
      total: refreshLogs.length,
      failures: recentFailures,
      failureRate: Math.round(failureRate * 100)
    }
  }

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (issues.length > 3) {
    overallStatus = 'unhealthy'
  } else if (issues.length > 0) {
    overallStatus = 'degraded'
  }

  return {
    overallStatus,
    issues,
    metrics
  }
}

function generateRecommendations(analysis: any): string[] {
  const recommendations: string[] = []

  if (analysis.overallStatus === 'unhealthy') {
    recommendations.push('URGENT: Multiple materialized view issues detected - investigate immediately')
  }

  if (analysis.issues.some((issue: string) => issue.includes('Low success rate'))) {
    recommendations.push('Check database logs for materialized view refresh errors')
    recommendations.push('Consider increasing refresh timeout or optimizing view queries')
  }

  if (analysis.issues.some((issue: string) => issue.includes('High average refresh duration'))) {
    recommendations.push('Optimize materialized view queries for better performance')
    recommendations.push('Consider partitioning large tables or adding indexes')
  }

  if (analysis.issues.some((issue: string) => issue.includes('No refresh'))) {
    recommendations.push('Check cron job configuration and database connectivity')
    recommendations.push('Manually trigger refresh to test functionality')
  }

  if (analysis.issues.some((issue: string) => issue.includes('inactive'))) {
    recommendations.push('Reactivate disabled cron jobs')
    recommendations.push('Check cron job permissions and configuration')
  }

  if (recommendations.length === 0) {
    recommendations.push('All materialized views are healthy - no action required')
  }

  return recommendations
}