import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const startTime = Date.now()
    const checks: Record<string, any> = {}

    // Test basic connectivity
    const { data: connectivityTest, error: connectivityError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    checks.connectivity = {
      status: connectivityError ? 'unhealthy' : 'healthy',
      responseTime: `${Date.now() - startTime}ms`,
      error: connectivityError?.message
    }

    // Test choice statistics job health
    const mvStartTime = Date.now()
    const { data: mvHealth, error: mvError } = await supabase
      .rpc('get_choice_statistics_job_health')

    checks.choiceStatisticsJob = {
      status: mvError ? 'unhealthy' : 'healthy',
      responseTime: `${Date.now() - mvStartTime}ms`,
      data: mvHealth,
      error: mvError?.message
    }

    // Test ending statistics (as a health check)
    const endingStartTime = Date.now()
    const { data: endingHealth, error: endingError } = await supabase
      .rpc('get_ending_statistics')

    checks.endingStatistics = {
      status: endingError ? 'unhealthy' : 'healthy',
      responseTime: `${Date.now() - endingStartTime}ms`,
      data: endingHealth,
      error: endingError?.message
    }

    // Test rate limiting system
    const rateStartTime = Date.now()
    const { data: rateHealth, error: rateError } = await supabase
      .rpc('get_rate_limit_status', { user_identifier: 'health-check' })

    checks.rateLimiting = {
      status: rateError ? 'unhealthy' : 'healthy',
      responseTime: `${Date.now() - rateStartTime}ms`,
      data: rateHealth,
      error: rateError?.message
    }

    // Test basic table access (user_profiles as a simple check)
    const statsStartTime = Date.now()
    const { data: tableStats, error: statsError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    checks.tableAccess = {
      status: statsError ? 'unhealthy' : 'healthy',
      responseTime: `${Date.now() - statsStartTime}ms`,
      data: tableStats,
      error: statsError?.message
    }

    // Determine overall health
    const unhealthyChecks = Object.values(checks).filter(check => check.status === 'unhealthy')
    const overallStatus = unhealthyChecks.length === 0 ? 'healthy' : 
                         unhealthyChecks.length <= 1 ? 'degraded' : 'unhealthy'

    const totalResponseTime = Date.now() - startTime

    const healthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalResponseTime: `${totalResponseTime}ms`,
      checks,
      summary: {
        totalChecks: Object.keys(checks).length,
        healthyChecks: Object.values(checks).filter(check => check.status === 'healthy').length,
        unhealthyChecks: unhealthyChecks.length
      }
    }

    return NextResponse.json(healthStatus, {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        connectivity: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}