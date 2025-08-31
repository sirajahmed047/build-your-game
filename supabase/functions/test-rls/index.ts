import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient, setSessionId, getSessionId } from '../_shared/session.ts'

serve(async (req) => {
  try {
    const supabase = createSupabaseClient(req)
    const sessionId = getSessionId(req)
    
    // Set session ID for RLS policies
    await setSessionId(supabase, sessionId)
    
    // Test 1: Create a story run for guest user (should succeed)
    const { data: guestStoryRun, error: guestError } = await supabase
      .from('story_runs')
      .insert({
        session_id: sessionId,
        genre: 'fantasy',
        length: 'quick',
        challenge: 'casual'
      })
      .select()
      .single()
    
    if (guestError) {
      throw new Error(`Guest story run creation failed: ${guestError.message}`)
    }
    
    // Test 2: Try to access another session's data (should fail)
    const { data: otherSessionData, error: otherSessionError } = await supabase
      .from('story_runs')
      .select()
      .eq('session_id', 'different-session-id')
    
    // This should return empty array due to RLS, not an error
    if (otherSessionData && otherSessionData.length > 0) {
      throw new Error('RLS policy failed: accessed other session data')
    }
    
    // Test 3: Access own session data (should succeed)
    const { data: ownSessionData, error: ownSessionError } = await supabase
      .from('story_runs')
      .select()
      .eq('session_id', sessionId)
    
    if (ownSessionError) {
      throw new Error(`Own session data access failed: ${ownSessionError.message}`)
    }
    
    if (!ownSessionData || ownSessionData.length === 0) {
      throw new Error('Could not access own session data')
    }
    
    // Test 4: Create story step for the story run (should succeed)
    const { data: storyStep, error: stepError } = await supabase
      .from('story_steps')
      .insert({
        story_run_id: guestStoryRun.id,
        step_number: 1,
        story_text: 'Test story text',
        choices: [
          { id: 'A', text: 'Choice A', slug: 'test_choice_a' },
          { id: 'B', text: 'Choice B', slug: 'test_choice_b' }
        ]
      })
      .select()
      .single()
    
    if (stepError) {
      throw new Error(`Story step creation failed: ${stepError.message}`)
    }
    
    // Clean up test data
    await supabase.from('story_steps').delete().eq('id', storyStep.id)
    await supabase.from('story_runs').delete().eq('id', guestStoryRun.id)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'All RLS tests passed',
        tests: {
          guestStoryRunCreation: 'PASSED',
          otherSessionAccess: 'PASSED (blocked as expected)',
          ownSessionAccess: 'PASSED',
          storyStepCreation: 'PASSED'
        }
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'RLS test failed'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})