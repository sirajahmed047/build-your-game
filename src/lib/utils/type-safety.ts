import type { Json } from '@/types/database'
import type { PersonalityTraits, GameState } from '@/types/story'

/**
 * Type guard to check if a value is a valid PersonalityTraits object
 */
export const isValidPersonalityTraits = (traits: unknown): traits is PersonalityTraits => {
  if (!traits || typeof traits !== 'object' || Array.isArray(traits)) {
    return false
  }

  const obj = traits as Record<string, unknown>
  const requiredTraits = ['riskTaking', 'empathy', 'pragmatism', 'creativity', 'leadership']
  
  return requiredTraits.every(trait => 
    trait in obj && typeof obj[trait] === 'number' && 
    obj[trait] >= 0 && obj[trait] <= 100
  )
}

/**
 * Type guard to check if a value is a valid GameState object
 */
export const isValidGameState = (state: unknown): state is GameState => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return false
  }

  const obj = state as Record<string, unknown>
  
  return (
    'act' in obj && typeof obj.act === 'number' &&
    'flags' in obj && Array.isArray(obj.flags) &&
    'relationships' in obj && typeof obj.relationships === 'object' &&
    'inventory' in obj && Array.isArray(obj.inventory) &&
    'personalityTraits' in obj && typeof obj.personalityTraits === 'object'
  )
}

/**
 * Type guard to check if a Json value is a non-null object
 */
export const isJsonObject = (json: Json): json is Record<string, Json> => {
  return json !== null && typeof json === 'object' && !Array.isArray(json)
}

/**
 * Type guard to check if a Json value is an array
 */
export const isJsonArray = (json: Json): json is Json[] => {
  return Array.isArray(json)
}

/**
 * Safe JSON parsing utility with fallback and validation
 */
export const safeParseJson = <T>(
  json: Json | null | undefined, 
  fallback: T,
  validator?: (value: unknown) => value is T
): T => {
  if (json === null || json === undefined) {
    return fallback
  }
  
  try {
    // If it's already parsed (which it should be from Supabase), validate if validator provided
    if (validator && !validator(json)) {
      console.warn('JSON validation failed, using fallback:', json)
      return fallback
    }
    return json as T
  } catch (error) {
    console.warn('JSON parsing failed, using fallback:', error)
    return fallback
  }
}

/**
 * Type guard for checking if a value is a valid database row
 */
export const isValidDatabaseRow = <T extends Record<string, any>>(
  row: T | null | undefined,
  requiredFields: (keyof T)[]
): row is T => {
  if (!row || typeof row !== 'object') {
    return false
  }
  
  return requiredFields.every(field => field in row && row[field] !== null && row[field] !== undefined)
}

/**
 * Safe array extraction from Json with optional validation
 */
export const safeGetJsonArray = (
  json: any,
  validator?: (item: any) => boolean
): any[] => {
  if (!Array.isArray(json)) {
    return []
  }
  
  return validator ? json.filter(validator) : json
}

/**
 * Safe object property extraction with type validation
 */
export const safeGetJsonProperty = <T>(
  json: Json | null | undefined,
  key: string,
  validator: (value: unknown) => value is T,
  fallback: T
): T => {
  if (json === null || json === undefined || !isJsonObject(json) || !(key in json)) {
    return fallback
  }
  
  const value = json[key]
  return validator(value) ? value : fallback
}

/**
 * Type guard for valid choice objects
 */
export const isValidChoice = (choice: unknown): choice is { id: string; text: string; slug: string } => {
  if (!choice || typeof choice !== 'object' || Array.isArray(choice)) {
    return false
  }
  
  const obj = choice as Record<string, unknown>
  return (
    'id' in obj &&
    'text' in obj &&
    'slug' in obj &&
    typeof obj.id === 'string' &&
    typeof obj.text === 'string' &&
    typeof obj.slug === 'string'
  )
}

/**
 * Type guard for valid story run data
 */
export const isValidStoryRun = (run: unknown): run is {
  id: string
  user_id: string | null
  session_id: string | null
  genre: string
  length: string
  challenge: string
  completed: boolean
} => {
  if (!run || typeof run !== 'object' || Array.isArray(run)) {
    return false
  }
  
  const obj = run as Record<string, unknown>
  return (
    'id' in obj &&
    'genre' in obj &&
    'length' in obj &&
    'challenge' in obj &&
    'completed' in obj &&
    typeof obj.id === 'string' &&
    typeof obj.genre === 'string' &&
    typeof obj.length === 'string' &&
    typeof obj.challenge === 'string' &&
    typeof obj.completed === 'boolean'
  )
}

/**
 * Safe conversion of unknown value to string with fallback
 */
export const safeToString = (value: unknown, fallback: string = ''): string => {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return fallback
  }
  try {
    return String(value)
  } catch {
    return fallback
  }
}

/**
 * Safe conversion of unknown value to number with fallback
 */
export const safeToNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

/**
 * Safe conversion of unknown value to boolean with fallback
 */
export const safeToBoolean = (value: unknown, fallback: boolean = false): boolean => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return fallback
}

/**
 * Safe conversion of object to Json type
 */
export const toJson = (value: unknown): Json => {
  if (value === null || value === undefined) {
    return null
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  
  if (Array.isArray(value)) {
    return value.map(toJson)
  }
  
  if (typeof value === 'object') {
    const result: { [key: string]: Json | undefined } = {}
    Object.entries(value).forEach(([key, val]) => {
      result[key] = toJson(val)
    })
    return result
  }
  
  return null
}

/**
 * Safe personality traits extraction from database Json
 */
export const safeGetPersonalityTraits = (json: Json | null | undefined): PersonalityTraits => {
  const defaultTraits: PersonalityTraits = {
    riskTaking: 50,
    empathy: 50,
    pragmatism: 50,
    creativity: 50,
    leadership: 50
  }

  if (json === null || json === undefined || !isJsonObject(json)) {
    return defaultTraits
  }

  if (isValidPersonalityTraits(json)) {
    return json
  }

  // Try to extract valid traits from partial data
  const extractedTraits: PersonalityTraits = { ...defaultTraits }
  
  Object.entries(defaultTraits).forEach(([key, defaultValue]) => {
    const value = json[key]
    if (typeof value === 'number' && value >= 0 && value <= 100) {
      extractedTraits[key as keyof PersonalityTraits] = value
    }
  })

  return extractedTraits
}

/**
 * Safe game state extraction from database Json
 */
export const safeGetGameState = (json: Json | null | undefined): GameState => {
  const defaultGameState: GameState = {
    act: 1,
    flags: [],
    relationships: {},
    inventory: [],
    personalityTraits: {}
  }

  if (json === null || json === undefined || !isJsonObject(json)) {
    return defaultGameState
  }

  if (isValidGameState(json)) {
    return json
  }

  // Try to extract valid game state from partial data
  const extractedState: GameState = { ...defaultGameState }
  
  if (typeof json.act === 'number') {
    extractedState.act = json.act
  }
  
  if (Array.isArray(json.flags)) {
    extractedState.flags = json.flags.filter(flag => typeof flag === 'string')
  }
  
  if (isJsonObject(json.relationships)) {
    const relationships: Record<string, number> = {}
    Object.entries(json.relationships).forEach(([key, value]) => {
      if (typeof value === 'number') {
        relationships[key] = value
      }
    })
    extractedState.relationships = relationships
  }
  
  if (Array.isArray(json.inventory)) {
    extractedState.inventory = json.inventory.filter(item => typeof item === 'string')
  }
  
  if (isJsonObject(json.personalityTraits)) {
    const traits: Record<string, number> = {}
    Object.entries(json.personalityTraits).forEach(([key, value]) => {
      if (typeof value === 'number') {
        traits[key] = value
      }
    })
    extractedState.personalityTraits = traits
  }

  return extractedState
}

/**
 * Safe choices array extraction from database Json
 */
export const safeGetChoicesArray = (json: Json | null | undefined): any[] => {
  if (json === null || json === undefined || !isJsonArray(json)) {
    return []
  }
  
  return json.filter(choice => 
    choice && 
    typeof choice === 'object' && 
    !Array.isArray(choice) &&
    'id' in choice && 
    'text' in choice
  )
}

/**
 * Validates that a string is not null, undefined, or empty
 */
export const isValidString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0
}

/**
 * Validates that a number is within a specific range
 */
export const isValidNumber = (value: unknown, min?: number, max?: number): value is number => {
  if (typeof value !== 'number' || isNaN(value)) {
    return false
  }
  
  if (min !== undefined && value < min) {
    return false
  }
  
  if (max !== undefined && value > max) {
    return false
  }
  
  return true
}

/**
 * Safe property access with fallback
 */
export const safeGet = <T>(obj: unknown, key: string, fallback: T): T => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return fallback
  }
  
  const record = obj as Record<string, unknown>
  const value = record[key]
  return value !== undefined ? value as T : fallback
}

/**
 * Type guard for database row existence
 */
export const isDatabaseRow = <T>(row: T | null | undefined): row is T => {
  return row !== null && row !== undefined
}

/**
 * Type guard for valid user profile with required fields
 */
export const isValidUserProfile = (profile: unknown): profile is {
  id: string
  subscription_tier: string
  personality_traits: Json
  total_choices: number
  created_at: string
  updated_at: string
} => {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return false
  }
  
  const obj = profile as Record<string, unknown>
  return (
    'id' in obj && typeof obj.id === 'string' &&
    'subscription_tier' in obj && typeof obj.subscription_tier === 'string' &&
    'personality_traits' in obj &&
    'total_choices' in obj && typeof obj.total_choices === 'number' &&
    'created_at' in obj && typeof obj.created_at === 'string' &&
    'updated_at' in obj && typeof obj.updated_at === 'string'
  )
}

/**
 * Type guard for valid story run with required fields
 */
export const isValidStoryRunRow = (run: unknown): run is {
  id: string
  user_id: string | null
  session_id: string | null
  genre: string
  length: string
  challenge: string
  completed: boolean
  created_at: string
} => {
  if (!run || typeof run !== 'object' || Array.isArray(run)) {
    return false
  }
  
  const obj = run as Record<string, unknown>
  return (
    'id' in obj && typeof obj.id === 'string' &&
    'genre' in obj && typeof obj.genre === 'string' &&
    'length' in obj && typeof obj.length === 'string' &&
    'challenge' in obj && typeof obj.challenge === 'string' &&
    'completed' in obj && typeof obj.completed === 'boolean' &&
    'created_at' in obj && typeof obj.created_at === 'string'
  )
}

/**
 * Type guard for valid story step with required fields
 */
export const isValidStoryStepRow = (step: unknown): step is {
  id: string
  story_run_id: string
  step_number: number
  story_text: string
  choices: Json
  game_state: Json
  traits_snapshot: Json
  created_at: string
} => {
  if (!step || typeof step !== 'object' || Array.isArray(step)) {
    return false
  }
  
  const obj = step as Record<string, unknown>
  return (
    'id' in obj && typeof obj.id === 'string' &&
    'story_run_id' in obj && typeof obj.story_run_id === 'string' &&
    'step_number' in obj && typeof obj.step_number === 'number' &&
    'story_text' in obj && typeof obj.story_text === 'string' &&
    'choices' in obj &&
    'game_state' in obj &&
    'traits_snapshot' in obj &&
    'created_at' in obj && typeof obj.created_at === 'string'
  )
}

/**
 * Safe database query result handler
 */
export const safeDatabaseResult = <T>(
  data: T | null,
  error: any,
  context?: string
): T | null => {
  if (error) {
    console.error(`Database error${context ? ` in ${context}` : ''}:`, error)
    return null
  }
  
  return data
}

/**
 * Safe array database result handler
 */
export const safeDatabaseArrayResult = <T>(
  data: T[] | null,
  error: any,
  itemValidator?: (item: T) => boolean,
  context?: string
): T[] => {
  if (error) {
    console.error(`Database error${context ? ` in ${context}` : ''}:`, error)
    return []
  }
  
  if (!Array.isArray(data)) {
    return []
  }
  
  if (itemValidator) {
    return data.filter(item => {
      const isValid = itemValidator(item)
      if (!isValid) {
        console.warn(`Invalid item in array${context ? ` in ${context}` : ''}:`, item)
      }
      return isValid
    })
  }
  
  return data
}