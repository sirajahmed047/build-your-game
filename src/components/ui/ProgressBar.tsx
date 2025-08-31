'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = 'blue',
  size = 'md',
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full', sizes[size])}>
        <div
          className={cn('rounded-full transition-all duration-300', colors[color], sizes[size])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}