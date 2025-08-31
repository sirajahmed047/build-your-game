import { StoryGenerationRequest } from './types.ts'

/**
 * Generate a stable choice slug from choice text
 */
export function generateChoiceSlug(choiceText: string): string {
  return choiceText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50) // Limit length
}

/**
 * Generate a decision key hash to prevent slug collisions across different contexts
 */
export function generateDecisionKeyHash(
  genre: string,
  act: number,
  storyContext: string,
  choiceText: string
): string {
  const contextString = `${genre}:${act}:${storyContext}:${choiceText}`
  return hashString(contextString)
}

/**
 * Simple hash function for generating decision keys
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Generate stable choice slugs with context to prevent collisions
 */
export function generateContextualChoiceSlug(
  choiceText: string,
  request: StoryGenerationRequest,
  storyContext: string = ''
): string {
  const baseSlug = generateChoiceSlug(choiceText)
  const contextHash = generateDecisionKeyHash(
    request.genre,
    request.gameState?.act || 1,
    storyContext,
    choiceText
  )
  
  return `${baseSlug}_${contextHash.substring(0, 4)}`
}

/**
 * Validate and normalize choice IDs
 */
export function normalizeChoiceId(id: string, index: number): string {
  const validIds = ['A', 'B', 'C', 'D']
  
  // If ID is already valid, return it
  if (validIds.includes(id.toUpperCase())) {
    return id.toUpperCase()
  }
  
  // Otherwise, use index-based ID
  return validIds[index] || 'A'
}

/**
 * Extract key terms from story text for context hashing
 */
export function extractStoryContext(storyText: string): string {
  // Extract key nouns and verbs for context
  const words = storyText
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 5) // Take first 5 meaningful words
    
  return words.join('_')
}