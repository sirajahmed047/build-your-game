'use client'

import { useState, useEffect } from 'react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)

  useEffect(() => {
    setMode(defaultMode)
  }, [defaultMode])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSuccess = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative card-floating max-w-md w-full p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="text-4xl mb-4 animate-float">
              {mode === 'signin' ? '🌟' : '✨'}
            </div>
            <h2 className="text-2xl font-bold text-gradient-primary">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-neutral-600 mt-3 leading-relaxed">
              {mode === 'signin' 
                ? 'Sign in to continue your story journey and explore your insights' 
                : 'Join our community to save progress and discover your unique narrative patterns'
              }
            </p>
          </div>

          {/* Form */}
          {mode === 'signin' ? (
            <SignInForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={() => setMode('signup')}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSuccess}
              onSwitchToSignIn={() => setMode('signin')}
            />
          )}
        </div>
      </div>
    </div>
  )
}