'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useStoryValidation } from '@/lib/hooks/useStoryValidation'
import { StoryRunQueries, generateSessionId } from '@/lib'
import type { StoryGenerationRequest, StoryResponse } from '@/types/story'

interface StoryGeneratorProps {
  onStoryGenerated: (story: StoryResponse) => void
  onError: (error: string) => void
}

export function StoryGenerator({ onStoryGenerated, onError }: StoryGeneratorProps) {
  const { user, sessionId } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  
  const {
    isValidating,
    validationErrors,
    retryCount,
    validateStoryResponse,
    clearValidationState
  } = useStoryValidation({
    onValidationError: (errors) => {
      console.error('Story validation failed:', errors)
      onError(`Story validation failed: ${errors.join(', ')}`)
    },
    onRetryAttempt: (attempt, errors) => {
      console.warn(`Retrying story generation (attempt ${attempt}):`, errors)
    }
  })

  const generateStory = async (request: StoryGenerationRequest) => {
    setIsGenerating(true)
    clearValidationState()

    try {
      // First create a story run record
      const storyRun = await StoryRunQueries.create({
        session_id: sessionId,
        genre: request.genre,
        length: request.length,
        challenge: request.challenge,
        user_id: request.userId || null
      })

      if (!storyRun) {
        throw new Error('Failed to create story run')
      }

      // Mock AI story generation (replace with actual AI call)
      const mockAIGeneration = async (): Promise<unknown> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Return a mock story response
        return {
          storyText: `Welcome to your ${request.genre} adventure! You find yourself at the beginning of an epic journey...`,
          choices: [
            {
              id: 'A',
              text: 'Venture forth boldly',
              slug: 'venture_forth_boldly',
              traits_impact: { riskTaking: 10, leadership: 5 }
            },
            {
              id: 'B',
              text: 'Proceed with caution',
              slug: 'proceed_with_caution',
              traits_impact: { pragmatism: 10, empathy: 5 }
            },
            {
              id: 'C',
              text: 'Gather more information first',
              slug: 'gather_information',
              traits_impact: { creativity: 10, pragmatism: 5 }
            }
          ],
          gameState: {
            act: 1,
            flags: ['story_started'],
            relationships: {},
            inventory: [],
            personalityTraits: {
              riskTaking: 50,
              empathy: 50,
              pragmatism: 50,
              creativity: 50,
              leadership: 50
            }
          },
          isEnding: false
        }
      }

      // Validate the AI response with retry logic
      const validationResult = await validateStoryResponse(mockAIGeneration)

      if (validationResult.success && validationResult.data) {
        onStoryGenerated(validationResult.data)
      } else {
        throw new Error(`Story generation failed: ${validationResult.errors.join(', ')}`)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      onError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleQuickStart = () => {
    generateStory({
      genre: 'fantasy',
      length: 'quick',
      challenge: 'casual',
      userId: user?.id || '',
      sessionId
    })
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Story Generator</h2>
      
      <button
        onClick={handleQuickStart}
        disabled={isGenerating || isValidating}
        className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
      >
        {isGenerating || isValidating ? 'Generating...' : 'Start Fantasy Adventure'}
      </button>

      {(isGenerating || isValidating) && (
        <div className="mt-4 text-sm text-gray-600">
          <p>Generating your story...</p>
          {retryCount > 0 && (
            <p className="text-yellow-600">Retry attempt: {retryCount}</p>
          )}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">Validation Errors:</p>
          <ul className="list-disc list-inside text-sm">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}