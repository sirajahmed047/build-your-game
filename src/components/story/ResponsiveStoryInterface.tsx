'use client'

import { useState, useEffect } from 'react'
import { StoryReader } from './StoryReader'
import { MobileStoryInterface } from './MobileStoryInterface'
import type { Choice, GameState } from '@/types/story'

interface ResponsiveStoryInterfaceProps {
  storyText: string
  choices: Choice[]
  gameState?: GameState
  genre: string
  currentStep: number
  totalSteps?: number
  isProcessing?: boolean
  canMakeChoice?: boolean
  selectedChoiceId?: string
  choiceSlug?: string
  onChoiceSelect: (choice: Choice) => void
  onToggleStats?: () => void
  showStats?: boolean
}

export function ResponsiveStoryInterface(props: ResponsiveStoryInterfaceProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Use mobile interface for small screens
  if (isMobile) {
    return <MobileStoryInterface {...props} />
  }

  // Use desktop interface for larger screens
  return <StoryReader {...props} />
}