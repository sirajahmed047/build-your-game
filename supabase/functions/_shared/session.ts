import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createSupabaseClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )
}

export async function setSessionId(supabase: any, sessionId: string) {
  // Set app.session_id for RLS policies to work with guest users
  await supabase.rpc('set_config', {
    setting_name: 'app.session_id',
    setting_value: sessionId,
    is_local: true
  })
}

export function getSessionId(req: Request): string {
  // Extract session ID from headers or generate a new one
  const sessionId = req.headers.get('x-session-id')
  if (!sessionId) {
    throw new Error('Session ID is required')
  }
  return sessionId
}

export async function validateSession(req: Request, supabase: any) {
  try {
    // Try to get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (user && !error) {
        return { user, isGuest: false }
      }
    }
    
    // If no valid user, treat as guest
    return { user: null, isGuest: true }
  } catch (error) {
    // If validation fails, treat as guest
    return { user: null, isGuest: true }
  }
}