'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { getOrCreateSessionId } from '@/lib/utils/session'
import { UserProfileQueries } from '@/lib/supabase/queries'

interface AuthContextType {
  user: User | null
  session: Session | null
  sessionId: string
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(() => getOrCreateSessionId())

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // If user signs in, merge their guest session data
      if (event === 'SIGNED_IN' && session?.user) {
        await mergeGuestData(session.user.id, sessionId)
      }
    })

    return () => subscription.unsubscribe()
  }, [sessionId])

  const mergeGuestData = async (userId: string, guestSessionId: string) => {
    try {
      // Create or get user profile
      await UserProfileQueries.getOrCreate(userId)
      
      // Merge guest story runs into authenticated account
      await UserProfileQueries.mergeGuestData(userId, guestSessionId)
      
      console.log('Successfully merged guest data for user:', userId)
    } catch (error) {
      console.error('Error merging guest data:', error)
      // Don't throw - this shouldn't block the sign-in process
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    sessionId,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}