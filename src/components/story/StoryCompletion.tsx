'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AchievementNotification } from '@/components/endings/AchievementNotification'
import type { StoryRun, PersonalityTraits } from '@/types/story'

interface StoryCompletionProps {
  storyRun: StoryRun
  personalityTraits?: PersonalityTraits
  onPlayAgain: (genre: 'fantasy' | 'mystery' | 'sci-fi') => void
  onViewCollection: () => void
  onViewDashboard: () => void
}

export function StoryCompletion({
  storyRun,
  personalityTraits,
  onPlayAgain,
  onViewCollection,
  onViewDashboard
}: StoryCompletionProps) {
  const [showAchievement, setShowAchievement] = useState<string | null>(null)
  const [showPersonalityUpdate, setShowPersonalityUpdate] = useState(false)

  useEffect(() => {
    // Show achievement notification for rare endings
    if (storyRun.ending_rarity === 'ultra-rare') {
      setShowAchievement('🎉 Ultra Rare Ending Discovered!')
    } else if (storyRun.ending_rarity === 'rare') {
      setShowAchievement('⭐ Rare Ending Unlocked!')
    }

    // Show personality update notification
    if (personalityTraits) {
      setShowPersonalityUpdate(true)
      setTimeout(() => setShowPersonalityUpdate(false), 3000)
    }
  }, [storyRun.ending_rarity, personalityTraits])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'ultra-rare':
        return 'from-purple-400 to-pink-400'
      case 'rare':
        return 'from-yellow-400 to-orange-400'
      case 'uncommon':
        return 'from-blue-400 to-cyan-400'
      default:
        return 'from-gray-400 to-gray-500'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'ultra-rare':
        return '💎'
      case 'rare':
        return '⭐'
      case 'uncommon':
        return '🔹'
      default:
        return '⚪'
    }
  }

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'ultra-rare':
        return 'Ultra Rare'
      case 'rare':
        return 'Rare'
      case 'uncommon':
        return 'Uncommon'
      default:
        return 'Common'
    }
  }

  const getCompletionMessage = (rarity: string) => {
    switch (rarity) {
      case 'ultra-rare':
        return 'Incredible! You discovered an ultra-rare ending that few players ever see!'
      case 'rare':
        return 'Amazing! You found a rare ending that most players miss!'
      case 'uncommon':
        return 'Great job! You discovered an uncommon ending!'
      default:
        return 'Well done! You completed your story!'
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Achievement Notification */}
      {showAchievement && (
        <AchievementNotification
          message={showAchievement}
          onClose={() => setShowAchievement(null)}
        />
      )}

      {/* Personality Update Notification */}
      {showPersonalityUpdate && personalityTraits && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-slide-in">
          <h4 className="font-semibold mb-2">Personality Updated! 🧠</h4>
          <p className="text-sm">Your choices have shaped your character profile.</p>
        </div>
      )}

      {/* Main Completion Card */}
      <Card className="overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${getRarityColor(storyRun.ending_rarity || 'common')}`} />
        <CardHeader className="text-center pb-4">
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle className="text-2xl mb-2">Story Complete!</CardTitle>
          <p className="text-gray-600">
            {getCompletionMessage(storyRun.ending_rarity || 'common')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Ending Details */}
          {storyRun.ending_title && (
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {storyRun.ending_title}
              </h3>
              
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100">
                <span className="text-2xl">
                  {getRarityIcon(storyRun.ending_rarity || 'common')}
                </span>
                <span className="font-medium">
                  {getRarityText(storyRun.ending_rarity || 'common')} Ending
                </span>
              </div>
            </div>
          )}

          {/* Story Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {storyRun.genre}
              </div>
              <div className="text-sm text-gray-600">Genre</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 capitalize">
                {storyRun.challenge}
              </div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
          </div>

          {/* Collection Progress */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900">Collection Progress</span>
              <span className="text-sm text-blue-700">+1 Ending Added</span>
            </div>
            <ProgressBar
              value={75} // This would be calculated based on actual collection
              max={100}
              color="blue"
              showPercentage={true}
            />
            <p className="text-xs text-blue-700 mt-1">
              Keep exploring to discover more unique endings!
            </p>
          </div>

          {/* Personality Insights */}
          {personalityTraits && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-3">Your Choices Revealed</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(personalityTraits)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 4)
                  .map(([trait, value]) => (
                    <div key={trait} className="text-center">
                      <div className="text-lg font-bold text-purple-700">
                        {value}%
                      </div>
                      <div className="text-xs text-purple-600 capitalize">
                        {trait.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => onPlayAgain(storyRun.genre as 'fantasy' | 'mystery' | 'sci-fi')}
              className="flex-1"
              size="lg"
            >
              <span className="mr-2">🔄</span>
              Play Again
            </Button>
            
            <Button
              onClick={onViewCollection}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <span className="mr-2">🏆</span>
              View Collection
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onViewDashboard}
              variant="ghost"
              className="flex-1"
              size="lg"
            >
              <span className="mr-2">📊</span>
              Dashboard
            </Button>
            
            <Button
              onClick={() => {
                // Share functionality could be added here
                if (navigator.share) {
                  navigator.share({
                    title: 'Interactive Story Generator',
                    text: `I just discovered a ${storyRun.ending_rarity} ending: "${storyRun.ending_title}"!`,
                    url: window.location.origin
                  })
                }
              }}
              variant="ghost"
              className="flex-1"
              size="lg"
            >
              <span className="mr-2">📤</span>
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips for Next Story */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ready for Your Next Adventure?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600">💡</span>
              <div>
                <p className="text-sm font-medium">Try Different Choices</p>
                <p className="text-xs text-gray-600">
                  Explore alternative paths to discover new endings and personality traits.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-green-600">🎯</span>
              <div>
                <p className="text-sm font-medium">Challenge Yourself</p>
                <p className="text-xs text-gray-600">
                  Try a different difficulty level or genre for unique experiences.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-purple-600">📈</span>
              <div>
                <p className="text-sm font-medium">Track Your Growth</p>
                <p className="text-xs text-gray-600">
                  Watch how your personality profile evolves with each story.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}