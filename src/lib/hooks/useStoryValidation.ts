import { useState, useCallback, useMemo } from 'react'
import { StoryValidator, validateWithRetry, DEFAULT_RETRY_OPTIONS } from '@/lib/validation/story-validator'
import type { StoryResponse } from '@/types/story'
import type { ValidationResult, RetryOptions } from '@/lib/validation/story-validator'

export interface UseStoryValidationOptions {
  retryOptions?: Partial<RetryOptions>
  onValidationError?: (errors: string[]) => void
  onRetryAttempt?: (attempt: number, errors: string[]) => void
}

export interface StoryValidationState {
  isValidating: boolean
  validationErrors: string[]
  retryCount: number
  lastValidationTime: Date | null
}

export function useStoryValidation(options: UseStoryValidationOptions = {}) {
  const [state, setState] = useState<StoryValidationState>({
    isValidating: false,
    validationErrors: [],
    retryCount: 0,
    lastValidationTime: null
  })

  // Destructure callback functions from options to avoid stale closures
  const { onValidationError: onValidationErrorCallback, onRetryAttempt: onRetryAttemptCallback, retryOptions: retryOptionsPartial } = options

  // Memoize individual callback functions to prevent unnecessary re-renders
  const onValidationError = useCallback((errors: string[]) => {
    onValidationErrorCallback?.(errors)
  }, [onValidationErrorCallback])

  const onRetryAttempt = useCallback((attempt: number, errors: string[]) => {
    onRetryAttemptCallback?.(attempt, errors)
  }, [onRetryAttemptCallback])

  const retryOptions: RetryOptions = useMemo(() => ({
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOptionsPartial,
    onRetry: (attempt, errors) => {
      setState(prev => ({ ...prev, retryCount: attempt }))
      onRetryAttempt(attempt, errors)
      retryOptionsPartial?.onRetry?.(attempt, errors)
    },
    onFinalFailure: (errors) => {
      onValidationError(errors)
      retryOptionsPartial?.onFinalFailure?.(errors)
    }
  }), [
    retryOptionsPartial,
    onValidationError,
    onRetryAttempt
  ])

  const validateStoryResponse = useCallback(async (
    operation: () => Promise<unknown>
  ): Promise<ValidationResult<StoryResponse>> => {
    setState(prev => ({
      ...prev,
      isValidating: true,
      validationErrors: [],
      retryCount: 0
    }))

    try {
      const result = await validateWithRetry(
        operation,
        StoryValidator.validateStoryResponse,
        retryOptions
      )

      setState(prev => ({
        ...prev,
        isValidating: false,
        validationErrors: result.errors,
        lastValidationTime: new Date()
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error'
      setState(prev => ({
        ...prev,
        isValidating: false,
        validationErrors: [errorMessage],
        lastValidationTime: new Date()
      }))

      return {
        success: false,
        errors: [errorMessage],
        canRetry: false
      }
    }
  }, [retryOptions])

  const validateSingleResponse = useCallback((data: unknown): ValidationResult<StoryResponse> => {
    setState(prev => ({
      ...prev,
      validationErrors: [],
      lastValidationTime: new Date()
    }))

    const result = StoryValidator.validateStoryResponse(data)
    
    setState(prev => ({
      ...prev,
      validationErrors: result.errors
    }))

    if (!result.success) {
      onValidationError(result.errors)
    }

    return result
  }, [onValidationError])

  const clearValidationState = useCallback(() => {
    setState({
      isValidating: false,
      validationErrors: [],
      retryCount: 0,
      lastValidationTime: null
    })
  }, [])

  return {
    ...state,
    validateStoryResponse,
    validateSingleResponse,
    clearValidationState
  }
}