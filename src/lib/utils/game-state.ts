import type { GameState, PersonalityTraits, Choice } from '../../types/story'

/**
 * Utility functions for game state management
 */

/**
 * Create initial game state for a new story
 */
export function createInitialGameState(genre: string): GameState {
  const baseTraits: PersonalityTraits = {
    riskTaking: 50,
    empathy: 50,
    pragmatism: 50,
    creativity: 50,
    leadership: 50
  }

  // Adjust initial traits slightly based on genre
  const genreTraits = getGenreTraitModifiers(genre)
  const adjustedTraits = { ...baseTraits }
  
  for (const [trait, modifier] of Object.entries(genreTraits)) {
    if (trait in adjustedTraits) {
      adjustedTraits[trait as keyof PersonalityTraits] += modifier
    }
  }

  return {
    act: 1,
    flags: ['story_started', `genre_${genre}`],
    relationships: {},
    inventory: [],
    personalityTraits: adjustedTraits
  }
}

/**
 * Get genre-specific trait modifiers
 */
function getGenreTraitModifiers(genre: string): Partial<PersonalityTraits> {
  switch (genre) {
    case 'fantasy':
      return { creativity: 5, empathy: 3 }
    case 'mystery':
      return { pragmatism: 5, creativity: 3 }
    case 'sci-fi':
      return { pragmatism: 3, leadership: 5 }
    default:
      return {}
  }
}

/**
 * Check if a flag exists in game state
 */
export function hasFlag(gameState: GameState, flag: string): boolean {
  return gameState.flags.includes(flag)
}

/**
 * Add a flag to game state (immutable)
 */
export function addFlag(gameState: GameState, flag: string): GameState {
  if (hasFlag(gameState, flag)) {
    return gameState
  }
  
  return {
    ...gameState,
    flags: [...gameState.flags, flag]
  }
}

/**
 * Remove a flag from game state (immutable)
 */
export function removeFlag(gameState: GameState, flag: string): GameState {
  return {
    ...gameState,
    flags: gameState.flags.filter(f => f !== flag)
  }
}

/**
 * Get relationship value
 */
export function getRelationship(gameState: GameState, character: string): number {
  return gameState.relationships[character] || 0
}

/**
 * Set relationship value (immutable)
 */
export function setRelationship(gameState: GameState, character: string, value: number): GameState {
  const clampedValue = Math.max(-100, Math.min(100, value))
  
  return {
    ...gameState,
    relationships: {
      ...gameState.relationships,
      [character]: clampedValue
    }
  }
}

/**
 * Modify relationship value (immutable)
 */
export function modifyRelationship(gameState: GameState, character: string, change: number): GameState {
  const currentValue = getRelationship(gameState, character)
  return setRelationship(gameState, character, currentValue + change)
}

/**
 * Check if item exists in inventory
 */
export function hasItem(gameState: GameState, item: string): boolean {
  return gameState.inventory.includes(item)
}

/**
 * Add item to inventory (immutable)
 */
export function addItem(gameState: GameState, item: string): GameState {
  if (hasItem(gameState, item)) {
    return gameState
  }
  
  return {
    ...gameState,
    inventory: [...gameState.inventory, item]
  }
}

/**
 * Remove item from inventory (immutable)
 */
export function removeItem(gameState: GameState, item: string): GameState {
  return {
    ...gameState,
    inventory: gameState.inventory.filter(i => i !== item)
  }
}

/**
 * Apply multiple consequences to game state
 */
export function applyConsequences(gameState: GameState, consequences: string[]): GameState {
  let newState = gameState
  
  for (const consequence of consequences) {
    newState = applyConsequence(newState, consequence)
  }
  
  return newState
}

/**
 * Apply a single consequence to game state
 */
export function applyConsequence(gameState: GameState, consequence: string): GameState {
  const [action, ...params] = consequence.split(':')
  
  switch (action) {
    case 'add_flag':
      return params[0] ? addFlag(gameState, params[0]) : gameState
      
    case 'remove_flag':
      return params[0] ? removeFlag(gameState, params[0]) : gameState
      
    case 'set_relationship':
      if (params[0] && params[1]) {
        const value = parseInt(params[1], 10) || 0
        return setRelationship(gameState, params[0], value)
      }
      return gameState
      
    case 'modify_relationship':
      if (params[0] && params[1]) {
        const change = parseInt(params[1], 10) || 0
        return modifyRelationship(gameState, params[0], change)
      }
      return gameState
      
    case 'add_item':
      return params[0] ? addItem(gameState, params[0]) : gameState
      
    case 'remove_item':
      return params[0] ? removeItem(gameState, params[0]) : gameState
      
    case 'increment_act':
      return { ...gameState, act: gameState.act + 1 }
      
    default:
      console.warn(`Unknown consequence action: ${action}`)
      return gameState
  }
}

/**
 * Update personality traits based on choice impact (immutable)
 */
export function updatePersonalityTraits(
  currentTraits: PersonalityTraits,
  impact: Record<string, number>
): PersonalityTraits {
  const updated = { ...currentTraits }
  
  for (const [trait, change] of Object.entries(impact)) {
    if (trait in updated) {
      const current = updated[trait as keyof PersonalityTraits]
      updated[trait as keyof PersonalityTraits] = Math.max(0, Math.min(100, current + change))
    }
  }
  
  return updated
}

/**
 * Calculate personality trait changes from a choice
 */
export function calculateTraitChanges(
  choice: Choice,
  currentTraits: PersonalityTraits
): { changes: Record<string, number>; newTraits: PersonalityTraits } {
  const changes = choice.traits_impact || {}
  const newTraits = updatePersonalityTraits(currentTraits, changes)
  
  return { changes, newTraits }
}

/**
 * Get personality trait description
 */
export function getTraitDescription(trait: keyof PersonalityTraits, value: number): string {
  const descriptions = {
    riskTaking: {
      low: 'Cautious and careful',
      medium: 'Balanced risk assessment',
      high: 'Bold and adventurous'
    },
    empathy: {
      low: 'Pragmatic and detached',
      medium: 'Considerate of others',
      high: 'Deeply compassionate'
    },
    pragmatism: {
      low: 'Idealistic and principled',
      medium: 'Practical when needed',
      high: 'Results-oriented'
    },
    creativity: {
      low: 'Conventional approach',
      medium: 'Occasionally innovative',
      high: 'Highly creative thinker'
    },
    leadership: {
      low: 'Prefers to follow',
      medium: 'Leads when necessary',
      high: 'Natural born leader'
    }
  }

  const level = value < 33 ? 'low' : value < 67 ? 'medium' : 'high'
  return descriptions[trait][level]
}

/**
 * Get dominant personality traits (top 2)
 */
export function getDominantTraits(traits: PersonalityTraits): Array<{ trait: keyof PersonalityTraits; value: number; description: string }> {
  const traitEntries = Object.entries(traits) as Array<[keyof PersonalityTraits, number]>
  
  return traitEntries
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([trait, value]) => ({
      trait,
      value,
      description: getTraitDescription(trait, value)
    }))
}

/**
 * Check if game state indicates story should end
 */
export function shouldEndStory(gameState: GameState, maxSteps: number, currentStep: number): boolean {
  // Check for explicit ending flags
  const endingFlags = ['story_complete', 'hero_dies', 'villain_defeated', 'mystery_solved', 'final_confrontation']
  const hasEndingFlag = endingFlags.some(flag => hasFlag(gameState, flag))
  
  // Check if we've reached maximum steps
  const reachedMaxSteps = currentStep >= maxSteps
  
  // Check if we've reached final act
  const isFinalAct = gameState.act >= 3
  
  return hasEndingFlag || reachedMaxSteps || isFinalAct
}

/**
 * Generate story context for AI based on game state
 */
export function generateStoryContext(gameState: GameState): string {
  const context = []
  
  // Add act information
  context.push(`Currently in Act ${gameState.act}`)
  
  // Add important flags
  const importantFlags = gameState.flags.filter(flag => 
    !flag.startsWith('genre_') && flag !== 'story_started'
  )
  if (importantFlags.length > 0) {
    context.push(`Story flags: ${importantFlags.join(', ')}`)
  }
  
  // Add relationships
  const relationships = Object.entries(gameState.relationships)
    .filter(([, value]) => Math.abs(value) > 20) // Only significant relationships
    .map(([char, value]) => `${char}: ${value > 0 ? 'positive' : 'negative'} (${value})`)
  
  if (relationships.length > 0) {
    context.push(`Key relationships: ${relationships.join(', ')}`)
  }
  
  // Add inventory
  if (gameState.inventory.length > 0) {
    context.push(`Inventory: ${gameState.inventory.join(', ')}`)
  }
  
  // Add personality summary
  const dominantTraits = getDominantTraits(gameState.personalityTraits as unknown as PersonalityTraits)
  const traitSummary = dominantTraits.map(t => `${t.trait}: ${t.value}`).join(', ')
  context.push(`Personality: ${traitSummary}`)
  
  return context.join('\n')
}

/**
 * Validate game state structure
 */
export function isValidGameState(gameState: any): gameState is GameState {
  if (!gameState || typeof gameState !== 'object') {
    return false
  }
  
  const required = ['act', 'flags', 'relationships', 'inventory', 'personalityTraits']
  
  for (const field of required) {
    if (!(field in gameState)) {
      return false
    }
  }
  
  // Validate types
  if (typeof gameState.act !== 'number') return false
  if (!Array.isArray(gameState.flags)) return false
  if (typeof gameState.relationships !== 'object') return false
  if (!Array.isArray(gameState.inventory)) return false
  if (typeof gameState.personalityTraits !== 'object') return false
  
  return true
}

/**
 * Sanitize game state for storage
 */
export function sanitizeGameState(gameState: GameState): GameState {
  return {
    act: Math.max(1, Math.min(5, Math.floor(gameState.act))),
    flags: Array.from(new Set(gameState.flags.filter(f => typeof f === 'string'))),
    relationships: Object.fromEntries(
      Object.entries(gameState.relationships)
        .filter(([key, value]) => typeof key === 'string' && typeof value === 'number')
        .map(([key, value]) => [key, Math.max(-100, Math.min(100, value))])
    ),
    inventory: Array.from(new Set(gameState.inventory.filter(item => typeof item === 'string'))),
    personalityTraits: {
      riskTaking: Math.max(0, Math.min(100, gameState.personalityTraits.riskTaking || 50)),
      empathy: Math.max(0, Math.min(100, gameState.personalityTraits.empathy || 50)),
      pragmatism: Math.max(0, Math.min(100, gameState.personalityTraits.pragmatism || 50)),
      creativity: Math.max(0, Math.min(100, gameState.personalityTraits.creativity || 50)),
      leadership: Math.max(0, Math.min(100, gameState.personalityTraits.leadership || 50))
    }
  }
}