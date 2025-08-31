'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthButton } from '@/components/auth/AuthButton'
import { useStorySession } from '@/lib/hooks/useStorySession'
import { useSaveReplay } from '@/lib/hooks/useSaveReplay'
import { useChoiceStatistics } from '@/lib/hooks/useChoiceStatistics'
import { useEndingsCollection } from '@/lib/hooks/useEndingsCollection'
import { getDominantTraits, getTraitDescription } from '@/lib/utils/game-state'
import { ChoiceStatistics } from './ChoiceStatistics'
import { PersonalityComparison } from './PersonalityComparison'
import { AchievementNotification } from '../endings/AchievementNotification'
import { SavePoints, SavePointIndicator } from './SavePoints'
import { StoryHistory } from './StoryHistory'
import { QuickReplayButton } from './ReplayOptions'
import { PremiumStoryGenerator } from './PremiumStoryGenerator'
import { Button } from '@/components/ui/Button'
import type { Choice, StoryProgressionResult, ChoiceSelectionResult, StoryGenerationRequest } from '@/types/story'

interface StorySessionProps {
  onStoryCompleted?: (session: any) => void
  onError?: (error: string) => void
}

export function StorySession({ onStoryCompleted, onError }: StorySessionProps) {
  const { user, loading } = useAuth()
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [showPersonalityUpdate, setShowPersonalityUpdate] = useState(false)
  const [lastTraitChanges, setLastTraitChanges] = useState<Record<string, number>>({})
  const [showChoiceStats, setShowChoiceStats] = useState(false)
  const [showPersonalityComparison, setShowPersonalityComparison] = useState(false)
  const [achievementMessage, setAchievementMessage] = useState<string | null>(null)
  const [showSavePoints, setShowSavePoints] = useState(false)
  const [showStoryHistory, setShowStoryHistory] = useState(false)

  const {
    currentSession,
    isActive,
    isCompleted,
    startNewStory,
    selectChoice,
    canMakeChoice,
    availableChoices,
    storyText,
    gameState,
    personalityTraits,
    isProcessing,
    hasError,
    error,
    storyHistory,
    getCurrentStoryRunId
  } = useStorySession({
    onStoryProgression: (result: StoryProgressionResult) => {
      console.log('Story progressed:', result)
      setSelectedChoiceId(null)
      
      if (result.isEnding) {
        console.log('Story completed with ending:', result.endingData)
        // The ending will be automatically recorded by the story flow service
      }
    },
    onChoiceSelected: (result: ChoiceSelectionResult) => {
      console.log('Choice selected:', result)
      
      // Show personality update if there were trait changes
      const step = result.updatedStep
      if (step.traits_snapshot) {
        const { safeGetPersonalityTraits } = require('../../lib/utils/type-safety')
        const traits = safeGetPersonalityTraits(step.traits_snapshot)
        const changes: Record<string, number> = {}
        
        // Calculate changes (simplified - in real implementation, compare with previous)
        Object.keys(traits).forEach(trait => {
          if (Math.random() > 0.7) { // Simulate some changes
            changes[trait] = Math.floor(Math.random() * 10) - 5
          }
        })
        
        if (Object.keys(changes).length > 0) {
          setLastTraitChanges(changes)
          setShowPersonalityUpdate(true)
          setTimeout(() => setShowPersonalityUpdate(false), 3000)
        }
      }
    },
    onStoryCompleted: (session) => {
      onStoryCompleted?.(session)
      // Refresh endings collection to show new discovery
      refreshCollection()
    },
    onError: (err) => {
      onError?.(err.message)
    }
  })

  // Save and replay functionality
  const {
    autoSaveProgress,
    setCurrentStory,
    savePoints,
    isLoadingSavePoints
  } = useSaveReplay({
    onProgressSaved: (savePoint) => {
      console.log('Progress saved:', savePoint)
    },
    onProgressRestored: (session) => {
      console.log('Progress restored:', session)
      // The story session will be updated automatically
    },
    onReplayStarted: (session) => {
      console.log('Replay started:', session)
      setShowStoryHistory(false)
    }
  })

  // Endings collection tracking
  const {
    refreshCollection
  } = useEndingsCollection({
    onNewEndingDiscovered: (ending) => {
      console.log('New ending discovered:', ending)
    },
    onAchievementUnlocked: (achievement) => {
      setAchievementMessage(achievement)
      setTimeout(() => setAchievementMessage(null), 5000)
    }
  })

  // Auto-save progress when story state changes (Requirement 6.1)
  useEffect(() => {
    if (currentSession && currentSession.currentStep && gameState && personalityTraits) {
      const currentStoryRunId = getCurrentStoryRunId()
      if (currentStoryRunId) {
        setCurrentStory(currentStoryRunId)
        
        // Auto-save at each decision point
        autoSaveProgress(
          currentStoryRunId,
          currentSession.currentStep.step_number,
          gameState,
          personalityTraits,
          storyText || '',
          availableChoices,
          `Step ${currentSession.currentStep.step_number}: ${storyText?.substring(0, 50)}...`
        )
      }
    }
  }, [currentSession, gameState, personalityTraits, storyText, availableChoices, autoSaveProgress, setCurrentStory, getCurrentStoryRunId])

  // Choice statistics tracking
  const {
    statistics: choiceStats,
    isLoading: statsLoading,
    trackSelection,
    isRareChoice
  } = useChoiceStatistics({
    choiceSlug: currentSession?.currentStep?.choice_slug || undefined,
    genre: currentSession?.storyRun.genre,
    choices: availableChoices,
    onStatisticsLoaded: (stats) => {
      // Auto-show stats if there are interesting insights
      const hasRareChoices = stats.some(stat => {
        const percentage = stat.percentage || 0
        const rarity = percentage < 5 ? 'ultra-rare' : percentage < 15 ? 'rare' : percentage < 35 ? 'uncommon' : 'common'
        return ['rare', 'ultra-rare'].includes(rarity)
      })
      if (hasRareChoices && !showChoiceStats) {
        setShowChoiceStats(true)
      }
    }
  })

  const handleStartStory = (request: StoryGenerationRequest) => {
    startNewStory({
      genre: request.genre,
      length: request.length,
      challenge: request.challenge
    })
  }

  const handleChoiceSelect = async (choice: Choice) => {
    if (!canMakeChoice) return
    
    setSelectedChoiceId(choice.id)
    
    // Track the selection for statistics
    if (currentSession?.currentStep?.choice_slug && currentSession?.storyRun.genre) {
      await trackSelection(
        currentSession.currentStep.choice_slug,
        choice.id,
        currentSession.storyRun.genre
      )
    }
    
    selectChoice(choice.id, choice.slug)
  }

  const renderStoryStart = () => (
    <div className="max-w-4xl mx-auto">
      <PremiumStoryGenerator 
        onStartStory={handleStartStory}
        loading={isProcessing}
      />

      {storyHistory && storyHistory.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Story History</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStoryHistory(true)}
              className="flex items-center"
            >
              <span className="mr-1">📚</span>
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {storyHistory.slice(0, 3).map((run) => (
              <div key={run.id} className="p-3 bg-gray-50 rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{run.genre} - {run.length}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      run.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {run.completed ? 'Completed' : 'In Progress'}
                    </span>
                    {run.completed && (
                      <QuickReplayButton
                        storyRunId={run.id}
                        size="sm"
                        onReplayStarted={() => {
                          // Replay will start automatically
                        }}
                      />
                    )}
                  </div>
                </div>
                {run.ending_title && (
                  <p className="text-sm text-gray-600 mt-1">{run.ending_title}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderStoryContent = () => {
    if (!currentSession || !storyText) return null

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Story Progress */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">
                Act {gameState?.act} • Step {currentSession.currentStep?.step_number}
              </span>
              <SavePointIndicator
                stepNumber={currentSession.currentStep?.step_number || 1}
                isCurrentStep={true}
                onClick={() => setShowSavePoints(true)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSavePoints(true)}
                className="flex items-center text-xs"
              >
                <span className="mr-1">💾</span>
                Save Points
              </Button>
              <span className="text-sm text-gray-500 capitalize">
                {currentSession.storyRun.genre} • {currentSession.storyRun.challenge}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, ((currentSession.currentStep?.step_number || 1) / 10) * 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Story Text */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{storyText}</p>
          </div>
        </div>

        {/* Choices */}
        {!isCompleted && availableChoices.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">What do you do?</h3>
              <button
                onClick={() => setShowChoiceStats(!showChoiceStats)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>📊</span>
                <span>{showChoiceStats ? 'Hide' : 'Show'} Stats</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {availableChoices.map((choice, index) => {
                const isRare = isRareChoice(choice.id)
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={!canMakeChoice || selectedChoiceId === choice.id}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedChoiceId === choice.id
                        ? 'border-blue-500 bg-blue-50'
                        : isRare
                        ? 'border-purple-300 hover:border-purple-400 hover:bg-purple-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    } ${!canMakeChoice ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-3 ${
                        isRare 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{choice.text}</p>
                          {isRare && (
                            <span className="text-purple-600 text-sm">✨ Rare</span>
                          )}
                        </div>
                        {choice.traits_impact && Object.keys(choice.traits_impact).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(choice.traits_impact).map(([trait, impact]) => (
                              <span
                                key={trait}
                                className={`px-2 py-1 rounded text-xs ${
                                  impact > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {trait}: {impact > 0 ? '+' : ''}{impact}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Choice Statistics Display */}
            {showChoiceStats && currentSession?.currentStep?.choice_slug && (
              <div className="mt-6 pt-6 border-t">
                <ChoiceStatistics
                  choiceSlug={currentSession.currentStep.choice_slug}
                  genre={currentSession.storyRun.genre}
                  selectedOptionId={selectedChoiceId || undefined}
                />
              </div>
            )}
          </div>
        )}

        {/* Story Completion */}
        {isCompleted && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-2">Story Complete!</h3>
              
              {currentSession.storyRun.ending_title && (
                <p className="text-xl mb-4 font-semibold text-gray-800">
                  {currentSession.storyRun.ending_title}
                </p>
              )}
              
              {currentSession.storyRun.ending_rarity && (
                <div className="mb-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    currentSession.storyRun.ending_rarity === 'ultra-rare' ? 'bg-purple-200 text-purple-800' :
                    currentSession.storyRun.ending_rarity === 'rare' ? 'bg-yellow-200 text-yellow-800' :
                    currentSession.storyRun.ending_rarity === 'uncommon' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {currentSession.storyRun.ending_rarity === 'ultra-rare' ? '💎' :
                     currentSession.storyRun.ending_rarity === 'rare' ? '⭐' :
                     currentSession.storyRun.ending_rarity === 'uncommon' ? '🔹' : '⚪'
                    }
                    <span className="ml-2 capitalize">
                      {currentSession.storyRun.ending_rarity.replace('_', ' ')} Ending
                    </span>
                  </span>
                </div>
              )}
              
              <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  🏆 Ending added to your collection! 
                  {currentSession.storyRun.ending_rarity === 'ultra-rare' && ' This is an ultra-rare discovery!'}
                  {currentSession.storyRun.ending_rarity === 'rare' && ' This is a rare ending!'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <QuickReplayButton
                  storyRunId={currentSession.storyRun.id}
                  onReplayStarted={() => {
                    // Replay will start automatically
                  }}
                />
                <button
                  onClick={() => {
                    handleStartStory({
                      genre: currentSession.storyRun.genre as any,
                      length: currentSession.storyRun.length as any,
                      challenge: currentSession.storyRun.challenge as any,
                      userId: user?.id || '',
                      sessionId: currentSession.storyRun.session_id || ''
                    })
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center"
                >
                  <span className="mr-2">✨</span>
                  New Story
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard?tab=endings'}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center"
                >
                  <span className="mr-2">🏆</span>
                  View Collection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Personality Traits Sidebar */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Personality</h3>
            <button
              onClick={() => setShowPersonalityComparison(!showPersonalityComparison)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>📈</span>
              <span>{showPersonalityComparison ? 'Hide' : 'Compare'}</span>
            </button>
          </div>
          
          {personalityTraits && (
            <div className="space-y-3">
              {Object.entries(personalityTraits).map(([trait, value]) => (
                <div key={trait}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium capitalize">
                      {trait.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-gray-600">{value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeof trait === 'string' && (trait === 'riskTaking' || trait === 'empathy' || trait === 'pragmatism' || trait === 'creativity' || trait === 'leadership') ? getTraitDescription(trait, value) : ''}
                  </p>
                </div>
              ))}
            </div>
          )}

          {personalityTraits && !showPersonalityComparison && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Dominant Traits</h4>
              <div className="space-y-1">
                {getDominantTraits(personalityTraits).map(({ trait, value, description }) => (
                  <div key={trait} className="text-sm">
                    <span className="font-medium capitalize">
                      {trait.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-gray-600 ml-2">({value}) - {description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personality Comparison */}
          {showPersonalityComparison && personalityTraits && (
            <div className="mt-4 pt-4 border-t">
              <PersonalityComparison
                userId={currentSession?.storyRun.user_id || undefined}
                currentTraits={personalityTraits}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show personality update notification
  const renderPersonalityUpdate = () => {
    if (!showPersonalityUpdate || Object.keys(lastTraitChanges).length === 0) return null

    return (
      <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
        <h4 className="font-semibold mb-2">Personality Updated!</h4>
        <div className="space-y-1">
          {Object.entries(lastTraitChanges).map(([trait, change]) => (
            <div key={trait} className="text-sm">
              <span className="capitalize">{trait.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className={change > 0 ? 'text-green-300' : 'text-red-300'}>
                {' '}{change > 0 ? '+' : ''}{change}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  // Require authentication
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">
            Please sign in or create an account to start your interactive story adventure.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <AuthButton mode="signin" size="lg">
              Sign In
            </AuthButton>
            <AuthButton mode="signup" variant="outline" size="lg">
              Create Account
            </AuthButton>
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-semibold">Error</h3>
          <p>{error?.message || 'An unknown error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (isProcessing && !currentSession) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Creating your story...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderPersonalityUpdate()}
      
      {/* Achievement Notification */}
      {achievementMessage && (
        <AchievementNotification
          message={achievementMessage}
          onClose={() => setAchievementMessage(null)}
        />
      )}

      {/* Save Points Modal */}
      {showSavePoints && currentSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <SavePoints
              storyRunId={currentSession.storyRun.id}
              onRestoreProgress={(savePoint) => {
                console.log('Restored to save point:', savePoint)
                setShowSavePoints(false)
              }}
              onClose={() => setShowSavePoints(false)}
            />
          </div>
        </div>
      )}

      {/* Story History Modal */}
      {showStoryHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">Story History</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStoryHistory(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-4">
                <StoryHistory
                  onStorySelected={(storyRun) => {
                    console.log('Selected story:', storyRun)
                    setShowStoryHistory(false)
                    // Could load the story here if needed
                  }}
                  onReplayStarted={() => {
                    setShowStoryHistory(false)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isActive && !isCompleted ? renderStoryStart() : renderStoryContent()}
      
      {isProcessing && currentSession && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        </div>
      )}
    </div>
  )
}