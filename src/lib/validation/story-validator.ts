import { validateStoryResponse, validateChoice, validateGameState, StoryResponseSchema } from './schemas'
import type { StoryResponse, Choice, GameState } from '@/types/story'

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors: string[]
  canRetry: boolean
}

export interface RetryOptions {
  maxRetries: number
  retryDelay: number
  onRetry?: (attempt: number, errors: string[]) => void
  onFinalFailure?: (errors: string[]) => void
}

export class StoryValidator {
  /**
   * Validates a story response from AI with detailed error reporting
   */
  static validateStoryResponse(data: unknown): ValidationResult<StoryResponse> {
    const result = validateStoryResponse(data)
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: [],
        canRetry: false
      }
    }

    const errors = this.formatZodErrors(result.error.issues)
    const canRetry = this.isRetryableError(result.error.issues)

    return {
      success: false,
      errors,
      canRetry
    }
  }

  /**
   * Validates individual choices with fallback repair attempts
   */
  static validateChoices(choices: unknown[]): ValidationResult<Choice[]> {
    if (!Array.isArray(choices)) {
      return {
        success: false,
        errors: ['Choices must be an array'],
        canRetry: true
      }
    }

    if (choices.length < 2 || choices.length > 4) {
      return {
        success: false,
        errors: [`Expected 2-4 choices, got ${choices.length}`],
        canRetry: true
      }
    }

    const validatedChoices: Choice[] = []
    const errors: string[] = []

    choices.forEach((choice, index) => {
      const result = validateChoice(choice)
      if (result.success) {
        validatedChoices.push(result.data)
      } else {
        // Try to repair the choice
        const repairedChoice = this.repairChoice(choice, index)
        if (repairedChoice) {
          validatedChoices.push(repairedChoice)
        } else {
          errors.push(`Choice ${index + 1}: ${this.formatZodErrors(result.error.issues).join(', ')}`)
        }
      }
    })

    return {
      success: validatedChoices.length >= 2,
      data: validatedChoices.length >= 2 ? validatedChoices : undefined,
      errors,
      canRetry: errors.length > 0
    }
  }

  /**
   * Validates game state with repair attempts
   */
  static validateGameState(data: unknown): ValidationResult<GameState> {
    const result = validateGameState(data)
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: [],
        canRetry: false
      }
    }

    // Try to repair the game state
    const repairedState = this.repairGameState(data)
    if (repairedState) {
      return {
        success: true,
        data: repairedState,
        errors: ['Game state was repaired'],
        canRetry: false
      }
    }

    const errors = this.formatZodErrors(result.error.issues)
    return {
      success: false,
      errors,
      canRetry: true
    }
  }

  /**
   * Attempts to repair a malformed choice object
   */
  private static repairChoice(choice: any, index: number): Choice | null {
    if (typeof choice !== 'object' || choice === null) {
      return null
    }

    try {
      const repaired: Choice = {
        id: choice.id || choice.option_id || String.fromCharCode(65 + index), // A, B, C, D
        text: choice.text || choice.description || choice.option || `Choice ${index + 1}`,
        slug: choice.slug || choice.choice_slug || `choice_${index + 1}`,
        consequences: Array.isArray(choice.consequences) ? choice.consequences : undefined,
        traits_impact: typeof choice.traits_impact === 'object' ? choice.traits_impact : undefined
      }

      // Validate the repaired choice
      const validation = validateChoice(repaired)
      return validation.success ? repaired : null
    } catch {
      return null
    }
  }

  /**
   * Attempts to repair a malformed game state object
   */
  private static repairGameState(data: any): GameState | null {
    if (typeof data !== 'object' || data === null) {
      return null
    }

    try {
      const repaired: GameState = {
        act: typeof data.act === 'number' ? data.act : 1,
        flags: Array.isArray(data.flags) ? data.flags : [],
        relationships: typeof data.relationships === 'object' ? data.relationships : {},
        inventory: Array.isArray(data.inventory) ? data.inventory : [],
        personalityTraits: typeof data.personalityTraits === 'object' ? {
          riskTaking: data.personalityTraits?.riskTaking || 50,
          empathy: data.personalityTraits?.empathy || 50,
          pragmatism: data.personalityTraits?.pragmatism || 50,
          creativity: data.personalityTraits?.creativity || 50,
          leadership: data.personalityTraits?.leadership || 50
        } : {
          riskTaking: 50,
          empathy: 50,
          pragmatism: 50,
          creativity: 50,
          leadership: 50
        }
      }

      // Validate the repaired state
      const validation = validateGameState(repaired)
      return validation.success ? repaired : null
    } catch {
      return null
    }
  }

  /**
   * Determines if validation errors are retryable
   */
  private static isRetryableError(issues: any[]): boolean {
    // Check for common retryable issues
    const retryablePatterns = [
      'Required',
      'Expected string',
      'Expected number',
      'Expected array',
      'Expected object',
      'Invalid type'
    ]

    return issues.some(issue => 
      retryablePatterns.some(pattern => 
        issue.message?.includes(pattern) || issue.code?.includes(pattern.toLowerCase())
      )
    )
  }

  /**
   * Formats Zod validation errors into readable messages
   */
  private static formatZodErrors(issues: any[]): string[] {
    return issues.map(issue => {
      const path = issue.path?.length > 0 ? `${issue.path.join('.')}: ` : ''
      return `${path}${issue.message}`
    })
  }
}

/**
 * Retry wrapper for story generation with validation
 */
export async function validateWithRetry<T>(
  operation: () => Promise<unknown>,
  validator: (data: unknown) => ValidationResult<T>,
  options: RetryOptions
): Promise<ValidationResult<T>> {
  let lastResult: ValidationResult<T>
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      const data = await operation()
      lastResult = validator(data)
      
      if (lastResult.success) {
        return lastResult
      }
      
      if (!lastResult.canRetry || attempt === options.maxRetries) {
        break
      }
      
      options.onRetry?.(attempt, lastResult.errors)
      
      if (attempt < options.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, options.retryDelay))
      }
    } catch (error) {
      lastResult = {
        success: false,
        errors: [`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        canRetry: attempt < options.maxRetries
      }
      
      if (attempt < options.maxRetries) {
        options.onRetry?.(attempt, lastResult.errors)
        await new Promise(resolve => setTimeout(resolve, options.retryDelay))
      }
    }
  }
  
  options.onFinalFailure?.(lastResult!.errors)
  return lastResult!
}

/**
 * Default retry options for story generation
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  onRetry: (attempt, errors) => {
    console.warn(`Story validation failed (attempt ${attempt}):`, errors)
  },
  onFinalFailure: (errors) => {
    console.error('Story validation failed after all retries:', errors)
  }
}