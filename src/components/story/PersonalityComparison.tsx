'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserProfileQueries } from '@/lib/supabase/queries'
import type { PersonalityTraits } from '@/types/story'

interface PersonalityComparisonProps {
  userId?: string
  currentTraits?: PersonalityTraits
  className?: string
}

interface ComparisonData {
  trait: string
  userValue: number
  globalAverage: number
  deviation: number
  percentile: number
  description: string
}

export function PersonalityComparison({ 
  userId, 
  currentTraits, 
  className = '' 
}: PersonalityComparisonProps) {
  const [comparisons, setComparisons] = useState<ComparisonData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculatePercentile = useCallback((userValue: number, globalAverage: number): number => {
    // Simplified percentile calculation
    // In a real implementation, this would use actual distribution data
    const standardDeviation = 15 // Assumed standard deviation
    const zScore = (userValue - globalAverage) / standardDeviation
    
    // Convert z-score to percentile (simplified)
    if (zScore >= 2) return 98
    if (zScore >= 1.5) return 93
    if (zScore >= 1) return 84
    if (zScore >= 0.5) return 69
    if (zScore >= 0) return 50
    if (zScore >= -0.5) return 31
    if (zScore >= -1) return 16
    if (zScore >= -1.5) return 7
    return 2
  }, [])

  const getTraitAdjective = useCallback((trait: string, isHigh: boolean): string => {
    const adjectives: Record<string, { high: string; low: string }> = {
      riskTaking: { high: 'adventurous', low: 'cautious' },
      empathy: { high: 'compassionate', low: 'pragmatic' },
      pragmatism: { high: 'practical', low: 'idealistic' },
      creativity: { high: 'innovative', low: 'traditional' },
      leadership: { high: 'decisive', low: 'collaborative' }
    }
    
    return adjectives[trait]?.[isHigh ? 'high' : 'low'] || (isHigh ? 'strong' : 'moderate')
  }, [])

  const getComparisonDescription = useCallback((trait: string, deviation: number): string => {
    const absDeviation = Math.abs(deviation)
    const isHigher = deviation > 0
    
    if (absDeviation < 10) {
      return "Similar to most players"
    } else if (absDeviation < 25) {
      return isHigher 
        ? `Slightly more ${getTraitAdjective(trait, true)} than average`
        : `Slightly more ${getTraitAdjective(trait, false)} than average`
    } else if (absDeviation < 50) {
      return isHigher
        ? `Much more ${getTraitAdjective(trait, true)} than most players`
        : `Much more ${getTraitAdjective(trait, false)} than most players`
    } else {
      return isHigher
        ? `Extremely ${getTraitAdjective(trait, true)} compared to others`
        : `Extremely ${getTraitAdjective(trait, false)} compared to others`
    }
  }, [getTraitAdjective])

  useEffect(() => {
    const loadComparisons = async () => {
      if (!currentTraits) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Get global averages (this would be implemented in UserProfileQueries)
        const globalAverages = await UserProfileQueries.getGlobalPersonalityAverages()
        
        const comparisonData: ComparisonData[] = Object.entries(currentTraits).map(([trait, value]) => {
          const globalAvg = globalAverages[trait] || 50
          const deviation = ((value - globalAvg) / globalAvg) * 100
          const percentile = calculatePercentile(value, globalAvg)
          
          return {
            trait,
            userValue: value,
            globalAverage: globalAvg,
            deviation,
            percentile,
            description: getComparisonDescription(trait, deviation)
          }
        })

        setComparisons(comparisonData)
      } catch (err) {
        console.error('Error loading personality comparisons:', err)
        setError('Failed to load comparison data')
      } finally {
        setIsLoading(false)
      }
    }

    loadComparisons()
  }, [userId, currentTraits, getComparisonDescription, calculatePercentile])

  const getDeviationColor = (deviation: number) => {
    const absDeviation = Math.abs(deviation)
    if (absDeviation < 10) return 'text-gray-600'
    if (absDeviation < 25) return 'text-blue-600'
    if (absDeviation < 50) return 'text-purple-600'
    return 'text-red-600'
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'bg-purple-100 text-purple-800'
    if (percentile >= 75) return 'bg-blue-100 text-blue-800'
    if (percentile >= 25) return 'bg-gray-100 text-gray-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || comparisons.length === 0) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <p>Personality comparison unavailable</p>
        <p className="text-sm">Complete more stories to see insights</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          How You Compare to Other Players
        </h3>
        <p className="text-sm text-gray-600">
          Based on choices made across all stories
        </p>
      </div>

      <div className="space-y-4">
        {comparisons
          .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
          .map((comparison) => (
            <div key={comparison.trait} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize text-gray-800">
                  {comparison.trait.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPercentileColor(comparison.percentile)}`}>
                  {comparison.percentile}th percentile
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-2">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>You: {comparison.userValue}</span>
                    <span>Average: {comparison.globalAverage.toFixed(1)}</span>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-3">
                    {/* Global average marker */}
                    <div 
                      className="absolute top-0 w-1 h-3 bg-gray-400 rounded"
                      style={{ left: `${comparison.globalAverage}%` }}
                    />
                    {/* User value bar */}
                    <div
                      className={`h-3 rounded-full ${
                        comparison.userValue > comparison.globalAverage
                          ? 'bg-blue-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${comparison.userValue}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  {comparison.description}
                </p>
                <span className={`text-sm font-medium ${getDeviationColor(comparison.deviation)}`}>
                  {comparison.deviation > 0 ? '+' : ''}{comparison.deviation.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-blue-800 mb-2">Your Unique Profile</h4>
        <p className="text-sm text-blue-700">
          {getUniqueProfileDescription(comparisons)}
        </p>
      </div>
    </div>
  )
}

function getUniqueProfileDescription(comparisons: ComparisonData[]): string {
  const strongTraits = comparisons
    .filter(c => Math.abs(c.deviation) > 25)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
    .slice(0, 2)

  if (strongTraits.length === 0) {
    return "You have a well-balanced personality that aligns closely with most players."
  }

  const descriptions = strongTraits.map(trait => {
    const adjective = trait.deviation > 0 
      ? getTraitAdjective(trait.trait, true)
      : getTraitAdjective(trait.trait, false)
    return `${adjective} (${trait.trait.replace(/([A-Z])/g, ' $1').trim()})`
  })

  return `You stand out as particularly ${descriptions.join(' and ')}, making choices that reflect your unique approach to storytelling.`
}

function getTraitAdjective(trait: string, isHigh: boolean): string {
  const adjectives: Record<string, { high: string; low: string }> = {
    riskTaking: { high: 'adventurous', low: 'cautious' },
    empathy: { high: 'compassionate', low: 'pragmatic' },
    pragmatism: { high: 'practical', low: 'idealistic' },
    creativity: { high: 'innovative', low: 'traditional' },
    leadership: { high: 'decisive', low: 'collaborative' }
  }
  
  return adjectives[trait]?.[isHigh ? 'high' : 'low'] || (isHigh ? 'strong' : 'moderate')
}