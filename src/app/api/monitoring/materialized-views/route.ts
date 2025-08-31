import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Get choice statistics job health
    const { data: mvHealth, error: mvError } = await supabase
      .rpc('get_choice_statistics_job_health')

    if (mvError) {
      throw new Error(`Failed to get choice statistics job health: ${mvError.message}`)
    }

    // Get recent cost tracking as a proxy for system activity
    const { data: refreshLogs, error: logsError } = await supabase
      .from('cost_tracking')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (logsError) {
      console.warn('Failed to get activity logs:', logsError.message)
    }

    // Get rate limit status as system health indicator
    const { data: cronStatus, error: cronError } = await supabase
      .rpc('get_rate_limit_status', { user_identifier: 'system-check' })

    if (cronError) {
      console.warn('Failed to get system status:', cronError.message)
    }

    const responseTime = Date.now() - startTime

    // Analyze health status
    const healthAnalysis = analyzeSystemHealth(mvHealth, refreshLogs, cronStatus)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      responseTime,
      status: healthAnalysis.overallStatus,
      choiceStatisticsJob: mvHealth,
      recentActivity: refreshLogs,
      systemStatus: cronStatus,
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
      .rpc('refresh_choice_statistics')

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

function analyzeSystemHealth(
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

  // Analyze choice statistics job health
  if (mvHealth && mvHealth.length > 0) {
    mvHealth.forEach((job: any) => {
      metrics.choiceStatisticsJob = {
        successCount24h: job.success_count_24h,
        errorCount24h: job.error_count_24h,
        avgDuration: job.avg_duration_seconds,
        lastSuccess: job.last_success,
        lastError: job.last_error,
        currentRowCount: job.current_row_count
      }

      // Check for issues
      const totalRuns = job.success_count_24h + job.error_count_24h
      const errorRate = totalRuns > 0 ? (job.error_count_24h / totalRuns) * 100 : 0
      
      if (errorRate > 10) {
        issues.push(`Choice statistics job: High error rate (${errorRate.toFixed(1)}%)`)
      }

      if (job.avg_duration_seconds > 30) {
        issues.push(`Choice statistics job: High average duration (${job.avg_duration_seconds}s)`)
      }

      if (job.last_error && job.last_error !== 'None') {
        const lastSuccess = new Date(job.last_success)
        const hoursSinceSuccess = (Date.now() - lastSuccess.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceSuccess > 2) {
          issues.push(`Choice statistics job: No success in ${Math.round(hoursSinceSuccess)} hours`)
        }
      }
    })
  }

  // Analyze system status via rate limiting
  if (cronStatus && cronStatus.length > 0) {
    cronStatus.forEach((status: any) => {
      metrics.systemStatus = {
        dailyLimit: status.daily_limit,
        requestsToday: status.requests_today,
        remainingRequests: status.remaining_requests,
        isPremium: status.is_premium
      }

      // Check for issues
      if (status.remaining_requests <= 0) {
        issues.push('System rate limit exceeded')
      }

      if (status.requests_today > status.daily_limit * 0.9) {
        issues.push('System approaching rate limit')
      }
    })
  }

  // Analyze recent activity logs
  if (refreshLogs && refreshLogs.length > 0) {
    const recentActivity = refreshLogs.length
    const totalTokens = refreshLogs.reduce((sum: number, log: any) => sum + (log.tokens_used || 0), 0)
    const totalCost = refreshLogs.reduce((sum: number, log: any) => sum + (log.estimated_cost || 0), 0)

    metrics.recentActivity = {
      totalRequests: recentActivity,
      totalTokens,
      totalCost: totalCost.toFixed(4),
      avgTokensPerRequest: recentActivity > 0 ? Math.round(totalTokens / recentActivity) : 0
    }

    if (recentActivity === 0) {
      issues.push('No recent system activity detected')
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
    recommendations.push('URGENT: Multiple system issues detected - investigate immediately')
  }

  if (analysis.issues.some((issue: string) => issue.includes('High error rate'))) {
    recommendations.push('Check database logs for choice statistics job errors')
    recommendations.push('Consider optimizing database queries or increasing timeouts')
  }

  if (analysis.issues.some((issue: string) => issue.includes('High average duration'))) {
    recommendations.push('Optimize choice statistics queries for better performance')
    recommendations.push('Consider adding database indexes or partitioning')
  }

  if (analysis.issues.some((issue: string) => issue.includes('No success'))) {
    recommendations.push('Check database connectivity and job configuration')
    recommendations.push('Manually trigger refresh to test functionality')
  }

  if (analysis.issues.some((issue: string) => issue.includes('rate limit'))) {
    recommendations.push('Monitor API usage and consider upgrading limits')
    recommendations.push('Implement request throttling or caching')
  }

  if (analysis.issues.some((issue: string) => issue.includes('No recent system activity'))) {
    recommendations.push('Check if the system is receiving user requests')
    recommendations.push('Verify API endpoints and user flows')
  }

  if (recommendations.length === 0) {
    recommendations.push('All system components are healthy - no action required')
  }

  return recommendations
}