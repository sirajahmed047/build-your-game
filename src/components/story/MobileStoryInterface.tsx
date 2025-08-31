'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Choice, GameState } from '@/types/story'

interface MobileStoryInterfaceProps {
  storyText: string
  choices: Choice[]
  gameState?: GameState
  genre: string
  currentStep: number
  totalSteps?: number
  isProcessing?: boolean
  canMakeChoice?: boolean
  selectedChoiceId?: string
  onChoiceSelect: (choice: Choice) => void
  showStats?: boolean
  onToggleStats?: () => void
}

export function MobileStoryInterface({
  storyText,
  choices,
  gameState,
  genre,
  currentStep,
  totalSteps = 10,
  isProcessing = false,
  canMakeChoice = true,
  selectedChoiceId,
  onChoiceSelect,
  showStats = false,
  onToggleStats
}: MobileStoryInterfaceProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const progressPercentage = Math.min(100, (currentStep / totalSteps) * 100)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Act {gameState?.act || 1} • Step {currentStep}
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {genre}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="flex-1 px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div 
              className={`text-base leading-relaxed whitespace-pre-wrap text-gray-800 ${
                !isExpanded && storyText.length > 300 ? 'line-clamp-6' : ''
              }`}
            >
              {storyText}
            </div>
            {storyText.length > 300 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-blue-600 text-sm font-medium"
              >
                {isExpanded ? 'Show Less' : 'Read More'}
              </button>
            )}
          </CardContent>
        </Card>

        {/* Game State Indicators */}
        {gameState && (gameState.flags?.length > 0 || gameState.inventory?.length > 0) && (
          <Card className="mb-6">
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {gameState.flags?.slice(0, 2).map((flag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                  >
                    {flag}
                  </span>
                ))}
                {gameState.inventory?.slice(0, 2).map((item, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded-full"
                  >
                    {item}
                  </span>
                ))}
                {(gameState.flags?.length > 2 || gameState.inventory?.length > 2) && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    +{(gameState.flags?.length || 0) + (gameState.inventory?.length || 0) - 4} more
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Choices */}
      {choices.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t shadow-lg">
          <div className="px-4 py-4">
            {onToggleStats && (
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">What do you do?</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleStats}
                  className="text-blue-600"
                >
                  📊 {showStats ? 'Hide' : 'Stats'}
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              {choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id
                const hasTraitImpact = choice.traits_impact && Object.keys(choice.traits_impact).length > 0
                
                return (
                  <button
                    key={choice.id}
                    onClick={() => {
                      if (canMakeChoice && !isProcessing) {
                        onChoiceSelect(choice)
                      }
                    }}
                    disabled={!canMakeChoice || isProcessing}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    } ${
                      !canMakeChoice || isProcessing 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer active:scale-95'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mr-3 ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{choice.text}</p>
                        {hasTraitImpact && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(choice.traits_impact!).slice(0, 2).map(([trait, impact]) => (
                              <span
                                key={trait}
                                className={`px-1.5 py-0.5 rounded text-xs ${
                                  impact > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {trait}: {impact > 0 ? '+' : ''}{impact}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Loading indicator */}
                    {isSelected && isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-75 rounded-lg">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}