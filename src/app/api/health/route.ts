import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Basic health check
    const startTime = Date.now()
    
    // Test database connectivity
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database connectivity failed: ${error.message}`)
    }

    const responseTime = Date.now() - startTime

    // Check if response time is acceptable (< 1000ms)
    const isHealthy = responseTime < 1000

    const healthStatus = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        },
        api: {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json(healthStatus, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        api: {
          status: 'unhealthy'
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