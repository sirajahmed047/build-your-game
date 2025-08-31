'use client'

import { useState } from 'react'
import { useStoryGeneration } from '../../lib/hooks/useStoryGeneration'
import type { StoryResponse } from '../../types/story'

export function StoryGenerationExample() {
  const [currentStory, setCurrentStory] = useState<StoryResponse | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<'fantasy' | 'mystery' | 'sci-fi'>('fantasy')
  const [selectedLength, setSelectedLength] = useState<'quick' | 'standard'>('quick')
  const [selectedChallenge, setSelectedChallenge] = useState<'casual' | 'challenging'>('casual')

  const {
    startNewStory,
    isGenerating,
    generationError,
    rateLimitStatus,
    isRateLimited,
    getRateLimitResetTime
  } = useStoryGeneration({
    onSuccess: (story) => {
      setCurrentStory(story)
    },
    onError: (error) => {
      console.error('Story generation failed:', error)
    }
  })

  const handleStartStory = () => {
    startNewStory({
      genre: selectedGenre,
      length: selectedLength,
      challenge: selectedChallenge,
      userId: 'demo-user'
    })
  }

  const handleChoiceSelect = (choiceId: string) => {
    // This would normally continue the story
    console.log('Selected choice:', choiceId)
    // For now, just show an alert
    alert(`You selected choice ${choiceId}. Story continuation would happen here.`)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">AI Story Generator</h2>
        
        {/* Rate limit status */}
        {rateLimitStatus && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Remaining stories today: {rateLimitStatus.remainingRequests} / {rateLimitStatus.dailyLimit}
              {rateLimitStatus.isPremium && <span className="ml-2 text-green-600">(Premium)</span>}
            </p>
          </div>
        )}

        {/* Story configuration */}
        {!currentStory && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === 'fantasy' || value === 'mystery' || value === 'sci-fi') {
                    setSelectedGenre(value)
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="fantasy">Fantasy</option>
                <option value="mystery">Mystery</option>
                <option value="sci-fi">Sci-Fi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length
              </label>
              <select
                value={selectedLength}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === 'quick' || value === 'standard') {
                    setSelectedLength(value)
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="quick">Quick (15 min)</option>
                <option value="standard">Standard (30 min)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge
              </label>
              <select
                value={selectedChallenge}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === 'casual' || value === 'challenging') {
                    setSelectedChallenge(value)
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="casual">Casual</option>
                <option value="challenging">Challenging</option>
              </select>
            </div>

            <button
              onClick={handleStartStory}
              disabled={isGenerating || (rateLimitStatus?.remainingRequests === 0)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Story...' : 'Start New Story'}
            </button>
          </div>
        )}

        {/* Error display */}
        {generationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">
              {isRateLimited(generationError) 
                ? `Rate limit exceeded. Try again ${getRateLimitResetTime(generationError) || 'later'}.`
                : generationError.message
              }
            </p>
          </div>
        )}

        {/* Story display */}
        {currentStory && (
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="text-gray-800 leading-relaxed">
                {currentStory.storyText}
              </p>
            </div>

            {/* Choices */}
            {currentStory.choices && currentStory.choices.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">What do you do?</h3>
                {currentStory.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice.id)}
                    className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <span className="font-medium text-blue-600">{choice.id}.</span>{' '}
                    {choice.text}
                  </button>
                ))}
              </div>
            )}

            {/* Game state debug info */}
            {currentStory.gameState && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Debug: Game State
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(currentStory.gameState, null, 2)}
                </pre>
              </details>
            )}

            {/* Ending display */}
            {currentStory.isEnding && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-lg font-semibold text-green-800">Story Complete!</h3>
                {currentStory.endingType && (
                  <p className="text-green-700">
                    Ending Type: {currentStory.endingType}
                  </p>
                )}
                <button
                  onClick={() => setCurrentStory(null)}
                  className="mt-2 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                >
                  Start New Story
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}