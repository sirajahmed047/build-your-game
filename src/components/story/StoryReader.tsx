'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ChoiceStatistics } from './ChoiceStatistics'
import type { Choice, GameState } from '@/types/story'

interface StoryReaderProps {
  storyText: string
  choices: Choice[]
  gameState?: GameState
  genre: string
  currentStep: number
  totalSteps?: number
  isProcessing?: boolean
  canMakeChoice?: boolean
  selectedChoiceId?: string
  choiceSlug?: string
  onChoiceSelect: (choice: Choice) => void
  onToggleStats?: () => void
  showStats?: boolean
}

export function StoryReader({
  storyText,
  choices,
  gameState,
  genre,
  currentStep,
  totalSteps = 10,
  isProcessing = false,
  canMakeChoice = true,
  selectedChoiceId,
  choiceSlug,
  onChoiceSelect,
  onToggleStats,
  showStats = false
}: StoryReaderProps) {
  const [expandedChoice, setExpandedChoice] = useState<string | null>(null)

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'ultra-rare':
        return 'border-purple-300 bg-purple-50 hover:bg-purple-100'
      case 'rare':
        return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
      case 'uncommon':
        return 'border-blue-300 bg-blue-50 hover:bg-blue-100'
      default:
        return 'border-gray-200 bg-white hover:bg-gray-50'
    }
  }

  const getRarityIcon = (rarity?: string) => {
    switch (rarity) {
      case 'ultra-rare':
        return '💎'
      case 'rare':
        return '⭐'
      case 'uncommon':
        return '🔸'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Story Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Act {gameState?.act || 1} • Step {currentStep}
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {genre}
            </span>
          </div>
          <ProgressBar
            value={currentStep}
            max={totalSteps}
            color="blue"
            size="md"
          />
        </CardContent>
      </Card>

      {/* Story Content */}
      <Card>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <div 
              className="text-lg leading-relaxed whitespace-pre-wrap text-gray-800"
              style={{ lineHeight: '1.7' }}
            >
              {storyText}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game State Indicators */}
      {gameState && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              {gameState.flags && gameState.flags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Flags:</span>
                  <div className="flex flex-wrap gap-1">
                    {gameState.flags.slice(0, 3).map((flag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {flag}
                      </span>
                    ))}
                    {gameState.flags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{gameState.flags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {gameState.inventory && gameState.inventory.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Items:</span>
                  <div className="flex flex-wrap gap-1">
                    {gameState.inventory.slice(0, 3).map((item, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                      >
                        {item}
                      </span>
                    ))}
                    {gameState.inventory.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{gameState.inventory.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Choices */}
      {choices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">What do you do?</h3>
              {onToggleStats && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleStats}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <span className="mr-1">📊</span>
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id
                const isExpanded = expandedChoice === choice.id
                const hasTraitImpact = choice.traits_impact && Object.keys(choice.traits_impact).length > 0
                
                return (
                  <div key={choice.id} className="relative">
                    <button
                      onClick={() => {
                        if (canMakeChoice && !isProcessing) {
                          onChoiceSelect(choice)
                        }
                      }}
                      disabled={!canMakeChoice || isProcessing}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : getRarityColor()
                      } ${
                        !canMakeChoice || isProcessing 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'cursor-pointer hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-3 ${
                          isSelected 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{choice.text}</p>
                            <div className="flex items-center space-x-2">
                              {getRarityIcon() && (
                                <span className="text-sm">{getRarityIcon()}</span>
                              )}
                              {hasTraitImpact && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedChoice(isExpanded ? null : choice.id)
                                  }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Trait Impact (Expanded) */}
                          {isExpanded && hasTraitImpact && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600 mb-2">Personality Impact:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(choice.traits_impact!).map(([trait, impact]) => (
                                  <span
                                    key={trait}
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      impact > 0 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {trait.replace(/([A-Z])/g, ' $1').trim()}: {impact > 0 ? '+' : ''}{impact}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Loading indicator for selected choice */}
                    {isSelected && isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-75 rounded-lg">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Choice Statistics */}
            {showStats && choiceSlug && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <ChoiceStatistics
                  choiceSlug={choiceSlug}
                  genre={genre}
                  selectedOptionId={selectedChoiceId}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}