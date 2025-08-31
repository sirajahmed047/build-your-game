// Database operations
export { StoryRunQueries, StoryStepQueries, ChoiceStatsQueries, UserProfileQueries } from './supabase/queries'

// Story flow and game state management
export { StoryFlowService } from './story/story-flow'
export { 
  createInitialGameState, 
  calculateTraitChanges 
} from './utils/game-state'
export { useStorySession, useStorySessionState, usePersonalityTracking } from './hooks/useStorySession'

// AI story generation
export * from './ai/story-generation'
export { generateSessionId } from './ai/story-generation'

// Validation
export * from './validation/schemas'
export { StoryValidator, validateWithRetry, DEFAULT_RETRY_OPTIONS } from './validation/story-validator'
export { useStoryValidation } from './hooks/useStoryValidation'

// Utilities
export * from './utils/crypto'
export { 
  safeGetPersonalityTraits, 
  safeGetGameState, 
  safeGetChoicesArray,
  isValidPersonalityTraits,
  isValidGameState,
  safeParseJson
} from './utils/type-safety'

// Supabase client
export { supabase, setSessionId } from './supabase/client'

// Types re-exports
export type {
  ValidatedStoryResponse,
  ValidatedStoryGenerationRequest,
  ValidatedChoice,
  ValidatedGameState,
  ValidatedPersonalityTraits,
  ValidatedStoryRun,
  ValidatedStoryStep,
  ValidatedChoiceStatistics,
  ValidatedEngagementEvent
} from './validation/schemas'

// Choice Statistics Hooks
export { useChoiceStatistics } from './hooks/useChoiceStatistics'
export { useChoiceStatisticsRealtime } from './hooks/useChoiceStatisticsRealtime'

export type {
  ValidationResult,
  RetryOptions
} from './validation/story-validator'