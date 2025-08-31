import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to set session ID for anonymous users
// This will be used in Edge Functions where we can set PostgreSQL session variables
export function setSessionId(sessionId: string) {
  // For now, we'll handle session ID through the application layer
  // In production, this would be set in Edge Functions using SQL: SET app.session_id = sessionId
  console.log('Session ID set:', sessionId)
  return Promise.resolve({ error: null })
}