import { z } from 'zod'

// Base enums and constants
export const GenreSchema = z.enum(['fantasy', 'mystery', 'sci-fi'])
export const LengthSchema = z.enum(['quick', 'standard'])
export const ChallengeSchema = z.enum(['casual', 'challenging'])
export const EndingRaritySchema = z.enum(['common', 'uncommon', 'rare', 'ultra-rare'])
export const EndingTypeSchema = z.enum(['heroic', 'tragic', 'mysterious', 'triumphant', 'bittersweet'])
export const EventTypeSchema = z.enum(['story_started', 'choice_made', 'story_completed', 'ending_discovered', 'replay_initiated'])

// Core data validation schemas
export const PersonalityTraitsSchema = z.object({
  riskTaking: z.number().min(0).max(100),
  empathy: z.number().min(0).max(100),
  pragmatism: z.number().min(0).max(100),
  creativity: z.number().min(0).max(100),
  leadership: z.number().min(0).max(100)
})

export const GameStateSchema = z.object({
  act: z.number().int().min(1),
  flags: z.array(z.string()),
  relationships: z.record(z.string(), z.number()),
  inventory: z.array(z.string()),
  personalityTraits: PersonalityTraitsSchema
})

export const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(500),
  slug: z.string().min(1).max(100),
  consequences: z.array(z.string()).optional(),
  traits_impact: z.record(z.string(), z.number()).optional()
})

// Story generation schemas
export const StoryGenerationRequestSchema = z.object({
  genre: GenreSchema,
  length: LengthSchema,
  challenge: ChallengeSchema,
  userId: z.string().uuid().optional(),
  sessionId: z.string().min(1).max(64)
})

export const StoryResponseSchema = z.object({
  storyText: z.string().min(1).max(5000),
  choices: z.array(ChoiceSchema).min(2).max(4),
  gameState: GameStateSchema,
  isEnding: z.boolean(),
  endingType: EndingTypeSchema.optional()
})

// Database entity schemas
export const StoryRunSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  session_id: z.string().max(64).nullable(),
  genre: z.string().min(1),
  length: z.string().min(1),
  challenge: z.string().min(1),
  ending_title: z.string().max(255).nullable(),
  ending_rarity: z.string().max(50).nullable(),
  ending_tag: z.string().max(100).nullable(),
  completed: z.boolean(),
  created_at: z.string(),
  completed_at: z.string().nullable()
})

export const StoryStepSchema = z.object({
  id: z.string().uuid(),
  story_run_id: z.string().uuid(),
  step_number: z.number().int().min(1),
  story_text: z.string().min(1),
  choices: z.array(ChoiceSchema),
  selected_choice_id: z.string().max(8).nullable(),
  choice_slug: z.string().max(100).nullable(),
  decision_key_hash: z.string().max(64).nullable(),
  game_state: GameStateSchema,
  traits_snapshot: PersonalityTraitsSchema,
  created_at: z.string(),
  trait_risk: z.number().nullable().optional(),
  trait_empathy: z.number().nullable().optional()
})

// API request/response schemas
export const CreateStoryRunRequestSchema = z.object({
  genre: GenreSchema,
  length: LengthSchema,
  challenge: ChallengeSchema,
  sessionId: z.string().min(1).max(64)
})

export const CreateStoryStepRequestSchema = z.object({
  story_run_id: z.string().uuid(),
  step_number: z.number().int().min(1),
  story_text: z.string().min(1).max(5000),
  choices: z.array(ChoiceSchema).min(2).max(4),
  game_state: GameStateSchema.optional(),
  traits_snapshot: PersonalityTraitsSchema.optional(),
  choice_slug: z.string().max(100).optional(),
  decision_key_hash: z.string().max(64).optional()
})

export const RecordChoiceRequestSchema = z.object({
  step_id: z.string().uuid(),
  choice_id: z.string().min(1),
  choice_slug: z.string().max(100).optional()
})

// Choice statistics schemas
export const ChoiceStatisticsSchema = z.object({
  choiceSlug: z.string(),
  optionId: z.string(),
  genre: z.string(),
  impressions: z.number().int().min(0),
  selections: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  rarityLevel: EndingRaritySchema
})

// Analytics schemas
export const EngagementEventSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().min(1),
  eventType: EventTypeSchema,
  timestamp: z.date(),
  metadata: z.record(z.string(), z.any())
})

// Validation helper functions
export function validateStoryResponse(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof StoryResponseSchema>> {
  return StoryResponseSchema.safeParse(data)
}

export function validateStoryGenerationRequest(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof StoryGenerationRequestSchema>> {
  return StoryGenerationRequestSchema.safeParse(data)
}

export function validateChoice(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof ChoiceSchema>> {
  return ChoiceSchema.safeParse(data)
}

export function validateGameState(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof GameStateSchema>> {
  return GameStateSchema.safeParse(data)
}

// Type exports for use in components
export type ValidatedStoryResponse = z.infer<typeof StoryResponseSchema>
export type ValidatedStoryGenerationRequest = z.infer<typeof StoryGenerationRequestSchema>
export type ValidatedChoice = z.infer<typeof ChoiceSchema>
export type ValidatedGameState = z.infer<typeof GameStateSchema>
export type ValidatedPersonalityTraits = z.infer<typeof PersonalityTraitsSchema>
export type ValidatedStoryRun = z.infer<typeof StoryRunSchema>
export type ValidatedStoryStep = z.infer<typeof StoryStepSchema>
export type ValidatedChoiceStatistics = z.infer<typeof ChoiceStatisticsSchema>
export type ValidatedEngagementEvent = z.infer<typeof EngagementEventSchema>