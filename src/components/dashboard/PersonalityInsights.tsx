'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { PersonalityComparison } from '@/components/story/PersonalityComparison'
import { getDominantTraits, getTraitDescription } from '@/lib/utils/game-state'
import type { PersonalityTraits } from '@/types/story'

interface PersonalityInsightsProps {
  traits: PersonalityTraits
  totalChoices: number
  userId?: string
  onViewComparison?: () => void
}

export function PersonalityInsights({ 
  traits, 
  totalChoices, 
  userId,
  onViewComparison 
}: PersonalityInsightsProps) {
  const [showComparison, setShowComparison] = useState(false)
  const dominantTraits = getDominantTraits(traits)

  const getTraitColor = (value: number): 'blue' | 'green' | 'purple' | 'red' | 'yellow' => {
    if (value >= 80) return 'purple'
    if (value >= 60) return 'blue'
    if (value >= 40) return 'green'
    if (value >= 20) return 'yellow'
    return 'red'
  }

  const getPersonalityArchetype = (traits: PersonalityTraits) => {
    const dominant = getDominantTraits(traits)
    if (dominant.length === 0) return 'Balanced Explorer'
    
    const topTrait = dominant[0]
    const combinations = {
      riskTaking: {
        high: 'Daring Adventurer',
        medium: 'Calculated Risk-Taker',
        low: 'Cautious Planner'
      },
      empathy: {
        high: 'Compassionate Leader',
        medium: 'Understanding Guide',
        low: 'Pragmatic Realist'
      },
      pragmatism: {
        high: 'Strategic Thinker',
        medium: 'Practical Problem-Solver',
        low: 'Idealistic Dreamer'
      },
      creativity: {
        high: 'Innovative Visionary',
        medium: 'Creative Problem-Solver',
        low: 'Methodical Executor'
      },
      leadership: {
        high: 'Natural Commander',
        medium: 'Collaborative Leader',
        low: 'Supportive Team Player'
      }
    }

    const level = topTrait.value >= 70 ? 'high' : topTrait.value >= 40 ? 'medium' : 'low'
    return combinations[topTrait.trait as keyof typeof combinations]?.[level] || 'Unique Individual'
  }

  return (
    <div className="space-y-6">
      {/* Personality Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Personality Profile</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowComparison(!showComparison)
                onViewComparison?.()
              }}
            >
              <span className="mr-1">📈</span>
              {showComparison ? 'Hide' : 'Compare'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Archetype */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {getPersonalityArchetype(traits)}
              </h3>
              <p className="text-sm text-gray-600">
                Based on {totalChoices} choices across your stories
              </p>
            </div>

            {/* Trait Bars */}
            <div className="space-y-4">
              {Object.entries(traits).map(([trait, value]) => (
                <div key={trait}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium capitalize">
                      {trait.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-gray-600 font-semibold">
                      {value}/100
                    </span>
                  </div>
                  <ProgressBar
                    value={value}
                    max={100}
                    color={getTraitColor(value)}
                    size="md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {getTraitDescription(trait as keyof PersonalityTraits, value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dominant Traits */}
      <Card>
        <CardHeader>
          <CardTitle>Your Strongest Traits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dominantTraits.slice(0, 3).map(({ trait, value, description }, index) => (
              <div key={trait} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold capitalize">
                    {trait.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {description} (Score: {value})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personality Comparison */}
      {showComparison && userId && (
        <Card>
          <CardHeader>
            <CardTitle>How You Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalityComparison
              userId={userId}
              currentTraits={traits}
            />
          </CardContent>
        </Card>
      )}

      {/* Insights and Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Personality Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dominantTraits.slice(0, 2).map(({ trait, value }) => {
              const insights = {
                riskTaking: {
                  high: "You're drawn to bold choices and exciting adventures. Try exploring different story paths to see how your risk-taking plays out!",
                  low: "You prefer careful, calculated decisions. Your thoughtful approach often leads to unique story outcomes."
                },
                empathy: {
                  high: "You consistently choose compassionate options. Your empathetic nature creates meaningful character relationships.",
                  low: "You make practical decisions focused on outcomes. This pragmatic approach often leads to efficient story resolutions."
                },
                pragmatism: {
                  high: "You excel at finding practical solutions. Your realistic approach helps navigate complex story challenges.",
                  low: "You're guided by ideals and principles. Your value-driven choices create inspiring story moments."
                },
                creativity: {
                  high: "You think outside the box and choose unconventional paths. Your creative choices lead to surprising story developments.",
                  low: "You prefer tried-and-true approaches. Your methodical choices create stable, predictable story progressions."
                },
                leadership: {
                  high: "You naturally take charge in story situations. Your leadership choices inspire other characters and drive the narrative forward.",
                  low: "You prefer supporting roles and collaborative approaches. Your team-oriented choices create rich character dynamics."
                }
              }

              const level = value >= 60 ? 'high' : 'low'
              const insight = insights[trait as keyof typeof insights]?.[level]

              return insight ? (
                <div key={trait} className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 capitalize mb-1">
                    {trait.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ) : null
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}