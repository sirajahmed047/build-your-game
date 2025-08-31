/**
 * Generate a stable choice slug from choice text (client-side version)
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
 * Validate choice slug format
 */
export function isValidChoiceSlug(slug: string): boolean {
  // Must be snake_case, alphanumeric with underscores, 1-50 characters
  return /^[a-z0-9_]{1,50}$/.test(slug)
}

/**
 * Normalize choice ID to valid format
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
 * Extract meaningful words from text for context
 */
export function extractKeywords(text: string, maxWords: number = 5): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'you', 'your', 'i', 'me', 'my', 'we', 'us', 'our', 'they', 'them', 'their', 'it', 'its',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall'
  ])

  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, maxWords)
}

/**
 * Generate a contextual choice slug with collision prevention
 */
export function generateContextualSlug(
  choiceText: string,
  context: {
    genre: string
    act: number
    keywords?: string[]
  }
): string {
  const baseSlug = generateChoiceSlug(choiceText)
  const contextKeywords = context.keywords || extractKeywords(choiceText, 2)
  
  if (contextKeywords.length > 0) {
    const contextSuffix = contextKeywords.join('_').substring(0, 20)
    return `${baseSlug}_${contextSuffix}`.substring(0, 50)
  }
  
  return baseSlug
}

/**
 * Validate choice structure
 */
export function validateChoice(choice: any): string[] {
  const errors: string[] = []

  if (!choice.id || typeof choice.id !== 'string') {
    errors.push('Choice must have a valid ID')
  }

  if (!choice.text || typeof choice.text !== 'string' || choice.text.trim().length === 0) {
    errors.push('Choice must have non-empty text')
  }

  if (!choice.slug || typeof choice.slug !== 'string' || !isValidChoiceSlug(choice.slug)) {
    errors.push('Choice must have a valid slug (snake_case, alphanumeric with underscores)')
  }

  if (choice.traits_impact && typeof choice.traits_impact !== 'object') {
    errors.push('Choice traits_impact must be an object')
  }

  if (choice.consequences && !Array.isArray(choice.consequences)) {
    errors.push('Choice consequences must be an array')
  }

  return errors
}

/**
 * Sanitize choice text for display
 */
export function sanitizeChoiceText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 200) // Limit length
}

/**
 * Calculate choice rarity based on selection percentage
 */
export function calculateChoiceRarity(percentage: number): 'common' | 'uncommon' | 'rare' | 'ultra-rare' {
  if (percentage >= 50) return 'common'
  if (percentage >= 25) return 'uncommon'
  if (percentage >= 10) return 'rare'
  return 'ultra-rare'
}

/**
 * Format choice statistics for display
 */
export function formatChoiceStatistics(stats: {
  percentage: number
  selections: number
  impressions: number
}): string {
  const { percentage, selections, impressions } = stats
  
  if (impressions === 0) return 'No data yet'
  
  const rarity = calculateChoiceRarity(percentage)
  const rarityLabels = {
    'common': 'Common choice',
    'uncommon': 'Uncommon choice',
    'rare': 'Rare choice',
    'ultra-rare': 'Ultra-rare choice'
  }
  
  return `${percentage.toFixed(1)}% of players chose this (${selections}/${impressions}) - ${rarityLabels[rarity]}`
}