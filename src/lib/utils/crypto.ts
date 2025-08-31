import { v4 as uuidv4 } from 'uuid'

/**
 * Generates a unique session ID for anonymous users
 */
export function generateSessionId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 32)
}

/**
 * Generates a decision key hash to prevent choice slug collisions
 * across different decision contexts
 */
export function generateDecisionKeyHash(context: {
  storyRunId: string
  stepNumber: number
  choiceSlug: string
  gameStateFlags: string[]
}): string {
  const contextString = JSON.stringify({
    run: context.storyRunId,
    step: context.stepNumber,
    slug: context.choiceSlug,
    flags: context.gameStateFlags.sort() // Sort for consistency
  })
  
  return hashString(contextString)
}

/**
 * Simple hash function for generating consistent hashes
 * Note: In production, consider using crypto.subtle.digest for better security
 */
function hashString(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString()
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Generates a stable choice slug from choice text
 */
export function generateChoiceSlug(choiceText: string): string {
  return choiceText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50) // Limit length
    .replace(/_+$/, '') // Remove trailing underscores
}

/**
 * Validates that a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}