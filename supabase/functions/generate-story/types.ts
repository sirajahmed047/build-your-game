// Request/Response types for the Edge Function
export interface StoryGenerationRequest {
  genre: 'fantasy' | 'mystery' | 'sci-fi' | 'horror' | 'romance' | 'thriller'
  length: 'quick' | 'standard' | 'extended'
  challenge: 'casual' | 'challenging'
  userId?: string
  sessionId: string
  storyRunId?: string
  currentStep?: number
  gameState?: GameState
  previousChoice?: string
  storyArc?: any // StoryArc type from story-arc.ts
  storyGuidance?: string
}

export interface StoryResponse {
  storyText: string
  choices: Choice[]
  gameState: GameState
  isEnding: boolean
  endingType?: EndingType
  endingTag?: string
}

export interface Choice {
  id: string // "A", "B", "C", "D"
  text: string
  slug: string // Stable identifier like "trust_stranger"
  consequences?: string[]
  traits_impact?: Record<string, number>
}

export interface GameState {
  act: number
  flags: string[]
  relationships: Record<string, number>
  inventory: string[]
  personalityTraits: Record<string, number>
}

export type EndingType = 'heroic' | 'tragic' | 'mysterious' | 'triumphant' | 'bittersweet'

// AI Response validation schema
export interface AIStoryResponse {
  story_text: string
  choices: {
    id: string
    text: string
    slug: string
    consequences?: string[]
    traits_impact?: Record<string, number>
  }[]
  game_state: {
    act: number
    flags: string[]
    relationships: Record<string, number>
    inventory: string[]
    personality_traits: Record<string, number>
  }
  is_ending: boolean
  ending_type?: string
  ending_tag?: string
}

// Validation function for AI responses
export function validateStoryResponse(response: any): AIStoryResponse {
  // Basic structure validation
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response: not an object')
  }

  if (!response.story_text || typeof response.story_text !== 'string') {
    throw new Error('Invalid response: missing or invalid story_text')
  }

  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    throw new Error('Invalid response: missing or invalid choices array')
  }

  // Validate choices
  for (const choice of response.choices) {
    if (!choice.id || !choice.text || !choice.slug) {
      throw new Error('Invalid response: choice missing required fields')
    }
  }

  // Validate game state
  if (!response.game_state || typeof response.game_state !== 'object') {
    throw new Error('Invalid response: missing or invalid game_state')
  }

  const gameState = response.game_state
  if (typeof gameState.act !== 'number' || 
      !Array.isArray(gameState.flags) ||
      typeof gameState.relationships !== 'object' ||
      !Array.isArray(gameState.inventory) ||
      typeof gameState.personality_traits !== 'object') {
    throw new Error('Invalid response: invalid game_state structure')
  }

  if (typeof response.is_ending !== 'boolean') {
    throw new Error('Invalid response: is_ending must be boolean')
  }

  return response as AIStoryResponse
}

// Rate limiting types
export interface RateLimitResult {
  allowed: boolean
  remainingRequests: number
  resetTime?: number
}

// Usage tracking types
export interface TokenUsage {
  userId?: string
  sessionId: string
  genre: string
  tokensUsed: number
  requestType: string
}

// Story generation result
export interface StoryGenerationResult {
  story: StoryResponse
  tokensUsed: number
}