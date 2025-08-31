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

    // Test materialized view health
    const mvStartTime = Date.now()
    const { data: mvHealth, error: mvError } = await supabase
      .rpc('get_materialized_view_health')

    checks.materializedViews = {
      status: mvError ? 'unhealthy' : 'healthy',
      responseTime: `${Date.now() - mvStartTime}ms`,
      data: mvHealth,
      error: mvError?.message
    }

    // Test backup health
    const backupStartTime = Date.now()
    const { data: backupHealth, error: backupError } = await supabase
      .rpc('get_backup_health_status')

    checks.backupHealth = {
      status: backupError ? 'unhealthy' : 'healthy',
      responseTime: `${Date.now() - backupStartTime}ms`,
      data: backupHealth,
      error: backupError?.message
    }

    // Test cron job health
    const cronStartTime = Date.now()
    const { data: cronHealth, error: cronError } = await supabase
      .from('cron_job_status')
      .select('*')

    checks.cronJobs = {
      status: cronError ? 'unhealthy' : 'healthy',
      responseTime: `${Date.now() - cronStartTime}ms`,
      data: cronHealth,
      error: cronError?.message
    }

    // Test table statistics
    const statsStartTime = Date.now()
    const { data: tableStats, error: statsError } = await supabase
      .rpc('get_table_stats')

    checks.tableStatistics = {
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