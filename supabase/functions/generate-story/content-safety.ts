import { StoryResponse } from './types.ts'

/**
 * Apply content safety filters based on challenge level
 */
export async function applyContentSafetyFilter(
  story: StoryResponse,
  challengeLevel: string
): Promise<StoryResponse> {
  // Apply different safety levels based on challenge
  const safetyLevel = challengeLevel === 'casual' ? 'strict' : 'moderate'
  
  // Filter story text
  const filteredStoryText = filterContent(story.storyText, safetyLevel)
  
  // Filter choice texts
  const filteredChoices = story.choices.map(choice => ({
    ...choice,
    text: filterContent(choice.text, safetyLevel),
    consequences: choice.consequences?.map(c => filterContent(c, safetyLevel))
  }))
  
  return {
    ...story,
    storyText: filteredStoryText,
    choices: filteredChoices
  }
}

/**
 * Filter content based on safety level
 */
function filterContent(text: string, safetyLevel: 'strict' | 'moderate'): string {
  let filteredText = text
  
  // Common filters for both levels
  const commonFilters = [
    // Violence filters
    { pattern: /\b(kill|murder|assassinate)\b/gi, replacement: 'defeat' },
    { pattern: /\b(blood|gore|brutal)\b/gi, replacement: 'intense' },
    { pattern: /\b(torture|torment)\b/gi, replacement: 'interrogate' },
    
    // Inappropriate content
    { pattern: /\b(damn|hell)\b/gi, replacement: 'darn' },
  ]
  
  // Strict filters (for casual difficulty)
  const strictFilters = [
    { pattern: /\b(death|die|dying)\b/gi, replacement: 'defeat' },
    { pattern: /\b(attack|assault)\b/gi, replacement: 'confront' },
    { pattern: /\b(weapon|sword|knife)\b/gi, replacement: 'tool' },
    { pattern: /\b(fight|battle)\b/gi, replacement: 'challenge' },
  ]
  
  // Apply filters based on safety level
  const filtersToApply = safetyLevel === 'strict' 
    ? [...commonFilters, ...strictFilters]
    : commonFilters
  
  for (const filter of filtersToApply) {
    filteredText = filteredText.replace(filter.pattern, filter.replacement)
  }
  
  return filteredText
}

/**
 * Check if content contains prohibited elements
 */
export function containsProhibitedContent(text: string): boolean {
  const prohibitedPatterns = [
    /\b(suicide|self-harm)\b/gi,
    /\b(explicit|graphic|nsfw)\b/gi,
    /\b(hate|racism|discrimination)\b/gi,
    /\b(drugs|narcotics|addiction)\b/gi,
  ]
  
  return prohibitedPatterns.some(pattern => pattern.test(text))
}

/**
 * Validate content safety before returning to user
 */
export function validateContentSafety(story: StoryResponse): boolean {
  // Check story text
  if (containsProhibitedContent(story.storyText)) {
    return false
  }
  
  // Check all choice texts
  for (const choice of story.choices) {
    if (containsProhibitedContent(choice.text)) {
      return false
    }
    
    // Check consequences if present
    if (choice.consequences) {
      for (const consequence of choice.consequences) {
        if (containsProhibitedContent(consequence)) {
          return false
        }
      }
    }
  }
  
  return true
}