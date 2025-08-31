'use client'

import { useState, useEffect } from 'react'
import { getRetentionMetrics } from '@/lib/analytics/queries'
import { format, subDays } from 'date-fns'

interface RetentionMetricsProps {
  cohortDate?: Date
  className?: string
}

export function RetentionMetrics({ 
  cohortDate = subDays(new Date(), 7), 
  className = '' 
}: RetentionMetricsProps) {
  const [retentionRates, setRetentionRates] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRetentionData()
  }, [cohortDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRetentionData = async () => {
    setLoading(true)
    try {
      const rates = await getRetentionMetrics(cohortDate)
      setRetentionRates(rates)
    } catch (error) {
      console.error('Failed to load retention data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show first 7 days for weekly retention
  const weeklyRetention = retentionRates.slice(0, 8)

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        7-Day Retention - {format(cohortDate, 'MMM dd, yyyy')} Cohort
      </h3>
      
      <div className="space-y-3">
        {weeklyRetention.map((rate, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Day {index}
            </span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(rate, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {rate.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Day 1 Retention:</span>
          <span className="font-medium text-gray-900">
            {weeklyRetention[1]?.toFixed(1) || '0.0'}%
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Day 7 Retention:</span>
          <span className="font-medium text-gray-900">
            {weeklyRetention[7]?.toFixed(1) || '0.0'}%
          </span>
        </div>
      </div>
    </div>
  )
}