'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className, 
  ...props 
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)} {...props}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizes[size]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  )
}

export function LoadingOverlay({ 
  text = 'Loading...', 
  className 
}: { 
  text?: string
  className?: string 
}) {
  return (
    <div className={cn(
      'absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10',
      className
    )}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}