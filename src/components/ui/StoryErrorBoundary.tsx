'use client'

import { Component, ReactNode } from 'react'
import { Button } from './Button'
import { ErrorMessage } from './ErrorBoundary'

interface Props {
  children: ReactNode
  onRetry?: () => void
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

export class StoryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('StoryErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Log to analytics if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('story_error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getErrorMessage()
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-amber-600 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-amber-900 mb-2">Story Interrupted</h3>
          <p className="text-amber-700 text-center mb-4 max-w-md">
            {errorMessage}
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleRetry} variant="outline">
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="default"
            >
              Restart Story
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-gray-100 rounded text-sm max-w-full overflow-auto">
              <summary className="cursor-pointer font-medium">Error Details (Dev)</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
              {this.state.errorInfo && (
                <pre className="mt-2 whitespace-pre-wrap">
                  Component Stack: {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }

  private getErrorMessage(): string {
    const error = this.state.error
    
    if (!error) {
      return this.props.fallbackMessage || 'An unexpected error occurred while loading your story.'
    }

    // Provide user-friendly messages for common errors
    if (error.message.includes('Rate limit')) {
      return 'You\'ve reached your story limit. Please wait a moment before continuing.'
    }
    
    if (error.message.includes('Network')) {
      return 'Connection issue detected. Please check your internet and try again.'
    }
    
    if (error.message.includes('generation failed')) {
      return 'Story generation encountered an issue. Let\'s try creating a new adventure.'
    }
    
    if (error.message.includes('validation')) {
      return 'Story content needs to be refreshed. Please try again.'
    }

    return this.props.fallbackMessage || 'Something went wrong with your story. Let\'s get you back on track.'
  }
}

// Specialized error boundary for choice selection
export class ChoiceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ChoiceErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage
          title="Choice Error"
          message="Unable to process your choice. Please try selecting again."
          onRetry={() => {
            this.setState({ hasError: false, error: undefined })
            this.props.onRetry?.()
          }}
        />
      )
    }

    return this.props.children
  }
}

// Error boundary for analytics and non-critical features
export class AnalyticsErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('AnalyticsErrorBoundary caught an error (non-critical):', error, errorInfo)
    // Don't show UI error for analytics failures - just log and continue
  }

  render() {
    // Always render children - analytics errors shouldn't break the UI
    return this.props.children
  }
}