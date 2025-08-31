'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { AuthModal } from './AuthModal'
import { Button } from '@/components/ui/Button'
import type { ButtonProps } from '@/components/ui/Button'

interface AuthButtonProps extends Omit<ButtonProps, 'onClick'> {
  mode?: 'signin' | 'signup' | 'signout'
  children?: React.ReactNode
}

export function AuthButton({ mode = 'signin', children, ...buttonProps }: AuthButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const { user, signOut } = useAuth()

  // Handle signout mode
  if (mode === 'signout') {
    if (!user) return null
    
    return (
      <Button
        onClick={signOut}
        {...buttonProps}
      >
        {children || 'Sign Out'}
      </Button>
    )
  }

  // Don't show auth button if user is already signed in (for signin/signup modes)
  if (user) {
    return null
  }

  const defaultText = mode === 'signin' ? 'Sign In' : 'Sign Up'

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        {...buttonProps}
      >
        {children || defaultText}
      </Button>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultMode={mode}
      />
    </>
  )
}