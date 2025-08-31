'use client'

import { createContext, useContext, useEffect, ReactNode, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { analytics } from '@/lib/analytics/client'
import { usePageTracking, useSessionTracking } from '@/lib/hooks/useAnalyticsTracking'
import type { User } from '@supabase/supabase-js'

interface AnalyticsContextType {
  isInitialized: boolean
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  isInitialized: false
})

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  
  // Initialize page and session tracking
  usePageTracking()
  useSessionTracking()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Update analytics user context when auth state changes
    analytics.updateUser(user?.id || null)
  }, [user])

  return (
    <AnalyticsContext.Provider value={{ isInitialized: true }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider')
  }
  return context
}