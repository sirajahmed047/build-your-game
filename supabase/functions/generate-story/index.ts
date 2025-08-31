import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateSession } from '../_shared/session.ts'
import { generateStoryContent } from './story-generator.ts'
import { validateStoryResponse, StoryGenerationRequest, StoryResponse } from './types.ts'
import { enforceRateLimit } from './rate-limiter.ts'
import { logTokenUsage } from './usage-tracker.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestBody: StoryGenerationRequest = await req.json()
    
    // Validate required fields
    if (!requestBody.genre || !requestBody.length || !requestBody.challenge || !requestBody.sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: genre, length, challenge, sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate session and get user info
    const { user, isGuest } = await validateSession(req, supabase)
    
    // Set session context for RLS
    if (isGuest) {
      await supabase.rpc('set_config', {
        setting_name: 'app.session_id',
        setting_value: requestBody.sessionId
      })
    }

    // Validate premium features access
    if (user?.id) {
      const { validateStoryRequest } = await import('./rate-limiter.ts')
      const validationResult = await validateStoryRequest(
        supabase,
        user.id,
        requestBody.genre,
        requestBody.length
      )
      
      if (!validationResult.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Premium feature required',
            reason: validationResult.reason,
            upgradeRequired: true
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Enforce rate limits
    const rateLimitResult = await enforceRateLimit(
      supabase,
      user?.id || requestBody.sessionId,
      isGuest
    )
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          remainingRequests: rateLimitResult.remainingRequests
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate story content
    const storyResult = await generateStoryContent(requestBody, supabase)
    
    // Log token usage
    await logTokenUsage(supabase, {
      userId: user?.id,
      sessionId: requestBody.sessionId,
      genre: requestBody.genre,
      tokensUsed: storyResult.tokensUsed,
      requestType: 'story_generation'
    })

    // Return successful response
    return new Response(
      JSON.stringify(storyResult.story),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Tokens-Used': storyResult.tokensUsed.toString(),
          'X-Rate-Limit-Remaining': rateLimitResult.remainingRequests.toString()
        } 
      }
    )

  } catch (error) {
    console.error('Story generation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})