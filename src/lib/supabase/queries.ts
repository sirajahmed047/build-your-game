import { supabase } from './client'
import type { Database, Json } from '@/types/database'
import type { StoryRun, StoryStep, GameState, PersonalityTraits } from '@/types/story'
import {
  safeGetPersonalityTraits,
  safeGetJsonArray,
  isValidChoice,
  isDatabaseRow,
  toJson
} from '@/lib/utils/type-safety'

type StoryRunInsert = Database['public']['Tables']['story_runs']['Insert']
type StoryRunUpdate = Database['public']['Tables']['story_runs']['Update']
type StoryStepInsert = Database['public']['Tables']['story_steps']['Insert']
type StoryStepUpdate = Database['public']['Tables']['story_steps']['Update']

// Story Run CRUD Operations
export class StoryRunQueries {
  static async create(data: StoryRunInsert): Promise<StoryRun | null> {
    const { data: storyRun, error } = await supabase
      .from('story_runs')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating story run:', error)
      throw new Error(`Failed to create story run: ${error.message}`)
    }

    return storyRun
  }

  static async getById(id: string): Promise<StoryRun | null> {
    const { data: storyRun, error } = await supabase
      .from('story_runs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching story run:', error)
      throw new Error(`Failed to fetch story run: ${error.message}`)
    }

    return storyRun
  }

  static async getByUserId(userId: string): Promise<StoryRun[]> {
    const { data: storyRuns, error } = await supabase
      .from('story_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user story runs:', error)
      throw new Error(`Failed to fetch user story runs: ${error.message}`)
    }

    return storyRuns || []
  }

  static async getBySessionId(sessionId: string): Promise<StoryRun[]> {
    const { data: storyRuns, error } = await supabase
      .from('story_runs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching session story runs:', error)
      throw new Error(`Failed to fetch session story runs: ${error.message}`)
    }

    return storyRuns || []
  }



  static async update(id: string, data: StoryRunUpdate): Promise<StoryRun | null> {
    const { data: storyRun, error } = await supabase
      .from('story_runs')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating story run:', error)
      throw new Error(`Failed to update story run: ${error.message}`)
    }

    return storyRun
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('story_runs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting story run:', error)
      throw new Error(`Failed to delete story run: ${error.message}`)
    }
  }

  static async markCompleted(id: string, endingData: {
    ending_title?: string
    ending_rarity?: string
    ending_tag?: string
  }): Promise<StoryRun | null> {
    return this.update(id, {
      completed: true,
      completed_at: new Date().toISOString(),
      ...endingData
    })
  }
}

// Story Step CRUD Operations
export class StoryStepQueries {
  static async create(data: {
    story_run_id: string
    step_number: number
    story_text: string
    choices: any[]
    game_state?: GameState
    traits_snapshot?: PersonalityTraits
    choice_slug?: string
    decision_key_hash?: string
  }): Promise<StoryStep | null> {
    // Validate and safely convert choices array
    const validChoices = safeGetJsonArray(toJson(data.choices), isValidChoice)

    const insertData: StoryStepInsert = {
      story_run_id: data.story_run_id,
      step_number: data.step_number,
      story_text: data.story_text,
      choices: toJson(validChoices),
      game_state: toJson(data.game_state || {}),
      traits_snapshot: toJson(data.traits_snapshot || {}),
      choice_slug: data.choice_slug,
      decision_key_hash: data.decision_key_hash
    }

    const { data: storyStep, error } = await supabase
      .from('story_steps')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating story step:', error)
      throw new Error(`Failed to create story step: ${error.message}`)
    }

    return isDatabaseRow(storyStep) ? storyStep as StoryStep : null
  }

  static async getById(id: string): Promise<StoryStep | null> {
    const { data: storyStep, error } = await supabase
      .from('story_steps')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching story step:', error)
      throw new Error(`Failed to fetch story step: ${error.message}`)
    }

    return isDatabaseRow(storyStep) ? storyStep as StoryStep : null
  }

  static async getByStoryRunId(storyRunId: string): Promise<StoryStep[]> {
    const { data: storySteps, error } = await supabase
      .from('story_steps')
      .select('*')
      .eq('story_run_id', storyRunId)
      .order('step_number', { ascending: true })

    if (error) {
      console.error('Error fetching story steps:', error)
      throw new Error(`Failed to fetch story steps: ${error.message}`)
    }

    return (storySteps || []).filter(isDatabaseRow) as StoryStep[]
  }

  static async update(id: string, data: StoryStepUpdate): Promise<StoryStep | null> {
    const { data: storyStep, error } = await supabase
      .from('story_steps')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating story step:', error)
      throw new Error(`Failed to update story step: ${error.message}`)
    }

    return storyStep
  }

  static async recordChoice(id: string, choiceId: string, choiceSlug?: string): Promise<StoryStep | null> {
    return this.update(id, {
      selected_choice_id: choiceId,
      choice_slug: choiceSlug
    })
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('story_steps')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting story step:', error)
      throw new Error(`Failed to delete story step: ${error.message}`)
    }
  }

  static async getLatestStep(storyRunId: string): Promise<StoryStep | null> {
    const { data: storyStep, error } = await supabase
      .from('story_steps')
      .select('*')
      .eq('story_run_id', storyRunId)
      .order('step_number', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching latest story step:', error)
      throw new Error(`Failed to fetch latest story step: ${error.message}`)
    }

    return isDatabaseRow(storyStep) ? storyStep as StoryStep : null
  }
}

// User Profile CRUD Operations
export class UserProfileQueries {
  static async create(userId: string, data: Partial<Database['public']['Tables']['user_profiles']['Insert']> = {}): Promise<Database['public']['Tables']['user_profiles']['Row'] | null> {
    const profileData: Database['public']['Tables']['user_profiles']['Insert'] = {
      id: userId,
      subscription_tier: 'free',
      personality_traits: toJson(data.personality_traits || {}),
      total_choices: 0,
      ...data
    }

    const { data: profile, error } = await (supabase as any)
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      throw new Error(`Failed to create user profile: ${error.message}`)
    }

    return isDatabaseRow(profile) ? profile : null
  }

  static async getById(userId: string): Promise<Database['public']['Tables']['user_profiles']['Row'] | null> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching user profile:', error)
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }

    return profile
  }

  static async getOrCreate(userId: string): Promise<Database['public']['Tables']['user_profiles']['Row']> {
    let profile = await this.getById(userId)

    if (!profile) {
      profile = await this.create(userId)
    }

    return profile!
  }

  static async update(userId: string, data: Database['public']['Tables']['user_profiles']['Update']): Promise<Database['public']['Tables']['user_profiles']['Row'] | null> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }

    const { data: profile, error } = await (supabase as any)
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      throw new Error(`Failed to update user profile: ${error.message}`)
    }

    return isDatabaseRow(profile) ? profile : null
  }

  static async updateSubscriptionTier(userId: string, tier: string): Promise<Database['public']['Tables']['user_profiles']['Row'] | null> {
    return this.update(userId, { subscription_tier: tier })
  }

  static async updatePersonalityTraits(userId: string, traits: Json): Promise<Database['public']['Tables']['user_profiles']['Row'] | null> {
    return this.update(userId, { personality_traits: traits })
  }

  static async incrementChoiceCount(userId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_user_choice_count' as any, {
      user_id: userId
    } as any)

    if (error) {
      console.error('Error incrementing choice count:', error)
      // Don't throw - this is non-critical
    }
  }

  static async mergeGuestData(userId: string, guestSessionId: string): Promise<void> {
    try {
      // Update guest story runs to be associated with the authenticated user
      const { error } = await supabase
        .from('story_runs')
        .update({ user_id: userId })
        .is('user_id', null)
        .eq('session_id', guestSessionId)

      if (error) {
        console.error('Error merging guest data:', error)
        // Don't throw - this shouldn't block sign-in
      }
    } catch (error) {
      console.error('Guest data merge failed:', error)
      // Don't throw - this shouldn't block sign-in
    }
  }

  static async getGlobalPersonalityAverages(): Promise<Record<string, number>> {
    try {
      // Query to get average personality traits across all users
      const { data, error } = await supabase
        .from('user_profiles')
        .select('personality_traits')
        .not('personality_traits', 'is', null)

      if (error) {
        console.error('Error fetching global personality averages:', error)
        // Return default averages if query fails
        return {
          riskTaking: 50,
          empathy: 50,
          pragmatism: 50,
          creativity: 50,
          leadership: 50
        }
      }

      if (!data || data.length === 0) {
        // Return default averages if no data
        return {
          riskTaking: 50,
          empathy: 50,
          pragmatism: 50,
          creativity: 50,
          leadership: 50
        }
      }

      // Calculate averages using safe type checking
      const traitSums: Record<string, number> = {}
      const traitCounts: Record<string, number> = {}

      data.forEach((profile) => {
        const traits = safeGetPersonalityTraits(profile.personality_traits)
        Object.entries(traits).forEach(([trait, value]) => {
          if (typeof value === 'number') {
            traitSums[trait] = (traitSums[trait] || 0) + value
            traitCounts[trait] = (traitCounts[trait] || 0) + 1
          }
        })
      })

      // Calculate final averages
      const averages: Record<string, number> = {}
      Object.keys(traitSums).forEach(trait => {
        averages[trait] = traitSums[trait] / traitCounts[trait]
      })

      // Ensure all expected traits have values
      const defaultTraits = ['riskTaking', 'empathy', 'pragmatism', 'creativity', 'leadership']
      defaultTraits.forEach(trait => {
        if (!(trait in averages)) {
          averages[trait] = 50
        }
      })

      return averages
    } catch (error) {
      console.error('Error calculating global personality averages:', error)
      // Return default averages on error
      return {
        riskTaking: 50,
        empathy: 50,
        pragmatism: 50,
        creativity: 50,
        leadership: 50
      }
    }
  }


}

// Choice Statistics Operations
export class ChoiceStatsQueries {
  static async incrementImpressions(choiceSlug: string, optionId: string, genre: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_choice_impressions' as any, {
        p_choice_slug: choiceSlug,
        p_option_id: optionId,
        p_genre: genre
      } as any)

      if (error) {
        console.error('Error incrementing impressions:', error)
        // Don't throw - this is non-critical for user experience
      }
    } catch (error) {
      console.error('Error calling increment_choice_impressions:', error)
      // Silently fail to not break story flow
    }
  }

  static async incrementSelections(choiceSlug: string, optionId: string, genre: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_choice_selections' as any, {
        p_choice_slug: choiceSlug,
        p_option_id: optionId,
        p_genre: genre
      } as any)

      if (error) {
        console.error('Error incrementing selections:', error)
        // Don't throw - this is non-critical for user experience
      }
    } catch (error) {
      console.error('Error calling increment_choice_selections:', error)
      // Silently fail to not break story flow
    }
  }

  static async getChoiceStatistics(choiceSlug: string, genre: string) {
    const { data: stats, error } = await supabase
      .from('choice_statistics_cached')
      .select('*')
      .eq('choice_slug', choiceSlug)
      .eq('genre', genre)

    if (error) {
      console.error('Error fetching choice statistics:', error)
      return []
    }

    return stats || []
  }

  static async getAllChoiceStatistics(genre?: string) {
    let query = supabase
      .from('choice_statistics_cached')
      .select('*')

    if (genre) {
      query = query.eq('genre', genre)
    }

    const { data: stats, error } = await query

    if (error) {
      console.error('Error fetching all choice statistics:', error)
      return []
    }

    return stats || []
  }

  static async getCronJobHealth() {
    try {
      const { data, error } = await supabase.rpc('get_choice_statistics_job_health' as any)

      if (error) {
        console.error('Error fetching cron job health:', error)
        return null
      }

      return Array.isArray(data) && (data as any[]).length > 0 ? (data as any[])[0] : null
    } catch (error) {
      console.error('Error calling cron job health function:', error)
      return null
    }
  }

  static async refreshChoiceStatistics() {
    try {
      const { error } = await supabase.rpc('refresh_choice_statistics_with_monitoring')

      if (error) {
        console.error('Error manually refreshing choice statistics:', error)
        throw new Error(`Failed to refresh choice statistics: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error refreshing choice statistics:', error)
      throw error
    }
  }
}