'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'warm' | 'sage'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus-ring disabled:opacity-50 disabled:pointer-events-none'
    
    const variants = {
      primary: 'btn-primary',
      secondary: 'bg-gradient-to-r from-neutral-500 to-neutral-600 hover:from-neutral-600 hover:to-neutral-700 text-white shadow-soft hover:shadow-soft-lg hover:scale-105',
      outline: 'btn-ghost border-2',
      ghost: 'btn-ghost',
      destructive: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-soft hover:shadow-soft-lg',
      warm: 'btn-secondary',
      sage: 'bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white shadow-soft hover:shadow-soft-lg hover:scale-105'
    }
    
    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6',
      lg: 'h-14 px-8 text-lg'
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, type ButtonProps }