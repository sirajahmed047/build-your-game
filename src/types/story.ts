// Core story generation types
export interface StoryGenerationRequest {
  genre: 'fantasy' | 'mystery' | 'sci-fi' | 'horror' | 'romance' | 'thriller'
  length: 'quick' | 'standard' | 'extended'
  challenge: 'casual' | 'challenging'
  userId: string
  sessionId: string
}

// Database entity types
export interface StoryRun {
  id: string
  user_id: string | null
  session_id: string | null
  genre: string
  length: string
  challenge: string
  ending_title: string | null
  ending_rarity: string | null
  ending_tag: string | null
  completed: boolean | null
  created_at: string | null
  completed_at: string | null
}

export interface StoryStep {
  id: string
  story_run_id: string
  step_number: number
  story_text: string
  choices: any // JSON data from database
  selected_choice_id: string | null
  choice_slug: string | null
  decision_key_hash: string | null
  game_state: any // JSON data from database
  traits_snapshot: any // JSON data from database
  created_at: string | null
  trait_risk?: number | null
  trait_empathy?: number | null
}

export interface StoryResponse {
  storyText: string
  choices: Choice[]
  gameState: GameState
  isEnding: boolean
  endingType?: EndingType
}

export interface Choice {
  id: string
  text: string
  slug: string // Stable identifier like "trust_stranger"
  consequences?: string[]
  traits_impact?: Record<string, number> | undefined // Allow undefined for MVP flexibility
}

export interface GameState {
  act: number
  flags: string[]
  relationships: Record<string, number>
  inventory: string[]
  personalityTraits: Record<string, number>
}

export interface PersonalityTraits {
  riskTaking: number
  empathy: number
  pragmatism: number
  creativity: number
  leadership: number
}

export interface PersonalityProfile {
  userId: string
  traits: PersonalityTraits
  evolution: PersonalitySnapshot[]
  totalChoices: number
  lastUpdated: Date
}

export interface PersonalitySnapshot {
  date: Date
  traits: PersonalityTraits
  storiesCompleted: number
}

export interface ChoiceStatistics {
  choiceSlug: string
  optionId: string // "A", "B", "C", "D"
  genre: string
  impressions: number
  selections: number
  percentage: number // selections / impressions * 100
  rarityLevel: 'common' | 'uncommon' | 'rare' | 'ultra-rare'
}

export interface PersonalComparison {
  userId: string
  personalTendencies: Record<string, number>
  globalAverages: Record<string, number>
  deviationScore: number
}

export interface Ending {
  id: string
  storyPath: string
  genre: string
  title: string
  description: string
  rarity: EndingRarity
  unlockConditions: string[]
}

export interface UserCollection {
  userId: string
  discoveredEndings: string[]
  completionPercentage: number
  rarityBreakdown: Record<EndingRarity, number>
  lastDiscovered: Date
}

export enum EndingRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon', 
  RARE = 'rare',
  ULTRA_RARE = 'ultra-rare'
}

export type EndingType = 'heroic' | 'tragic' | 'mysterious' | 'triumphant' | 'bittersweet'

export interface EngagementEvent {
  userId: string
  sessionId: string
  eventType: EventType
  timestamp: Date
  metadata: Record<string, any>
}

export enum EventType {
  STORY_STARTED = 'story_started',
  CHOICE_MADE = 'choice_made',
  STORY_COMPLETED = 'story_completed',
  ENDING_DISCOVERED = 'ending_discovered',
  REPLAY_INITIATED = 'replay_initiated'
}

// Story flow types
export interface StorySession {
  storyRun: StoryRun
  currentStep: StoryStep | null
  gameState: GameState
  personalityTraits: PersonalityTraits
  isCompleted: boolean
}

export interface StoryProgressionResult {
  session: StorySession
  newStep: StoryStep
  isEnding: boolean
  endingData?: {
    title: string
    rarity: string
    tag: string
    type: EndingType
  }
}

export interface ChoiceSelectionResult {
  updatedStep: StoryStep
  progressionResult?: StoryProgressionResult
}