import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { EndingRarity } from '@/types/story'

type StoryRunRow = Database['public']['Tables']['story_runs']['Row']

export interface UserEndingCollection {
  userId: string
  discoveredEndings: EndingEntry[]
  completionPercentage: number
  rarityBreakdown: Record<EndingRarity, number>
  lastDiscovered: Date | null
  totalStoriesCompleted: number
}

export interface EndingEntry {
  endingTag: string
  title: string
  description: string
  rarity: EndingRarity
  genre: string
  discoveredAt: Date
  storyRunId: string
}

export interface EndingCatalogEntry {
  endingTag: string
  genre: string
  title: string | null
  description: string | null
  globalCompletions: number
  rarity: EndingRarity
}

export interface EndingStatistics {
  totalEndings: number
  endingsByGenre: Record<string, number>
  endingsByRarity: Record<EndingRarity, number>
  completionRate: number
}

/**
 * Queries for managing user ending collections
 */
export class EndingCollectionQueries {
  /**
   * Gets a user's complete ending collection
   */
  static async getUserCollection(userId: string): Promise<UserEndingCollection> {
    try {
      // Get all completed story runs for the user
      const { data: storyRuns, error: runsError } = await supabase
        .from('story_runs')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .not('ending_tag', 'is', null)
        .order('completed_at', { ascending: false })

      if (runsError) {
        console.error('Error fetching user story runs:', runsError)
        throw new Error(`Failed to fetch user story runs: ${runsError.message}`)
      }

      const runs = (storyRuns || []) as StoryRunRow[]
      
      // Convert to ending entries
      const discoveredEndings: EndingEntry[] = runs
        .filter((run): run is StoryRunRow & { ending_tag: string; completed_at: string } => 
          Boolean(run.ending_tag && run.completed_at)
        )
        .map(run => ({
          endingTag: run.ending_tag,
          title: run.ending_title || 'Unknown Ending',
          description: `A ${run.ending_rarity || 'common'} ending in ${run.genre}`,
          rarity: (run.ending_rarity as EndingRarity) || EndingRarity.COMMON,
          genre: run.genre,
          discoveredAt: new Date(run.completed_at),
          storyRunId: run.id
        }))

      // Calculate statistics
      const uniqueEndings = new Map<string, EndingEntry>()
      discoveredEndings.forEach(ending => {
        if (!uniqueEndings.has(ending.endingTag)) {
          uniqueEndings.set(ending.endingTag, ending)
        }
      })

      const uniqueEndingsList = Array.from(uniqueEndings.values())
      
      // Calculate rarity breakdown
      const rarityBreakdown: Record<EndingRarity, number> = {
        [EndingRarity.COMMON]: 0,
        [EndingRarity.UNCOMMON]: 0,
        [EndingRarity.RARE]: 0,
        [EndingRarity.ULTRA_RARE]: 0
      }

      uniqueEndingsList.forEach(ending => {
        rarityBreakdown[ending.rarity]++
      })

      // Get total possible endings for completion percentage
      const totalPossibleEndings = await this.getTotalPossibleEndings()
      const completionPercentage = totalPossibleEndings > 0 
        ? (uniqueEndingsList.length / totalPossibleEndings) * 100 
        : 0

      const lastDiscovered = uniqueEndingsList.length > 0 
        ? uniqueEndingsList[0].discoveredAt 
        : null

      return {
        userId,
        discoveredEndings: uniqueEndingsList,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        rarityBreakdown,
        lastDiscovered,
        totalStoriesCompleted: runs.length
      }
    } catch (error) {
      console.error('Error getting user collection:', error)
      throw error
    }
  }

  /**
   * Records a new ending discovery for a user
   */
  static async recordEndingDiscovery(
    userId: string,
    storyRunId: string,
    endingTag: string,
    title: string,
    rarity: EndingRarity,
    genre: string
  ): Promise<void> {
    try {
      // Update the story run with ending information
      const { error: updateError } = await (supabase as any)
        .from('story_runs')
        .update({
          ending_tag: endingTag,
          ending_title: title,
          ending_rarity: rarity,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', storyRunId)

      if (updateError) {
        console.error('Error updating story run with ending:', updateError)
        throw new Error(`Failed to record ending: ${updateError.message}`)
      }

      // Add to ending catalog if it doesn't exist
      await this.addToEndingCatalog(endingTag, genre, title)
    } catch (error) {
      console.error('Error recording ending discovery:', error)
      throw error
    }
  }

  /**
   * Gets ending statistics for a user
   */
  static async getUserEndingStatistics(userId: string): Promise<EndingStatistics> {
    try {
      const collection = await this.getUserCollection(userId)
      
      const endingsByGenre: Record<string, number> = {}
      const endingsByRarity: Record<EndingRarity, number> = {
        [EndingRarity.COMMON]: 0,
        [EndingRarity.UNCOMMON]: 0,
        [EndingRarity.RARE]: 0,
        [EndingRarity.ULTRA_RARE]: 0
      }

      collection.discoveredEndings.forEach(ending => {
        endingsByGenre[ending.genre] = (endingsByGenre[ending.genre] || 0) + 1
        endingsByRarity[ending.rarity]++
      })

      const totalPossibleEndings = await this.getTotalPossibleEndings()
      const completionRate = totalPossibleEndings > 0 
        ? (collection.discoveredEndings.length / totalPossibleEndings) * 100 
        : 0

      return {
        totalEndings: collection.discoveredEndings.length,
        endingsByGenre,
        endingsByRarity,
        completionRate: Math.round(completionRate * 100) / 100
      }
    } catch (error) {
      console.error('Error getting user ending statistics:', error)
      throw error
    }
  }

  /**
   * Gets global ending statistics
   */
  static async getGlobalEndingStatistics(): Promise<EndingStatistics> {
    try {
      const { data: endings, error } = await supabase
        .from('ending_catalog')
        .select('*')

      if (error) {
        console.error('Error fetching global endings:', error)
        throw new Error(`Failed to fetch global endings: ${error.message}`)
      }

      const endingsList = (endings || []) as Database['public']['Tables']['ending_catalog']['Row'][]
      
      const endingsByGenre: Record<string, number> = {}
      const endingsByRarity: Record<EndingRarity, number> = {
        [EndingRarity.COMMON]: 0,
        [EndingRarity.UNCOMMON]: 0,
        [EndingRarity.RARE]: 0,
        [EndingRarity.ULTRA_RARE]: 0
      }

      // Calculate rarity based on completion frequency
      for (const ending of endingsList) {
        endingsByGenre[ending.genre] = (endingsByGenre[ending.genre] || 0) + 1
        
        // Get completion count for this ending
        const { count } = await supabase
          .from('story_runs')
          .select('*', { count: 'exact' })
          .eq('ending_tag', ending.ending_tag)
          .eq('completed', true)

        const completionCount = count || 0
        
        // Calculate rarity based on completion frequency
        let rarity: EndingRarity
        if (completionCount < 5) {
          rarity = EndingRarity.ULTRA_RARE
        } else if (completionCount < 25) {
          rarity = EndingRarity.RARE
        } else if (completionCount < 100) {
          rarity = EndingRarity.UNCOMMON
        } else {
          rarity = EndingRarity.COMMON
        }
        
        endingsByRarity[rarity]++
      }

      return {
        totalEndings: endingsList.length,
        endingsByGenre,
        endingsByRarity,
        completionRate: 100 // Global completion rate is always 100%
      }
    } catch (error) {
      console.error('Error getting global ending statistics:', error)
      throw error
    }
  }

  /**
   * Checks if a user has discovered a specific ending
   */
  static async hasUserDiscoveredEnding(userId: string, endingTag: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('story_runs')
        .select('id')
        .eq('user_id', userId)
        .eq('ending_tag', endingTag)
        .eq('completed', true)
        .limit(1)

      if (error) {
        console.error('Error checking ending discovery:', error)
        return false
      }

      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error checking ending discovery:', error)
      return false
    }
  }

  /**
   * Gets recently discovered endings across all users
   */
  static async getRecentEndingDiscoveries(limit: number = 10): Promise<EndingEntry[]> {
    try {
      const { data: recentRuns, error } = await supabase
        .from('story_runs')
        .select('*')
        .eq('completed', true)
        .not('ending_tag', 'is', null)
        .not('ending_title', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent discoveries:', error)
        throw new Error(`Failed to fetch recent discoveries: ${error.message}`)
      }

      const runs = (recentRuns || []) as StoryRunRow[]
      
      return runs
        .filter((run): run is StoryRunRow & { ending_tag: string; ending_title: string; completed_at: string } => 
          Boolean(run.ending_tag && run.ending_title && run.completed_at)
        )
        .map(run => ({
          endingTag: run.ending_tag,
          title: run.ending_title,
          description: `A ${run.ending_rarity || 'common'} ending in ${run.genre}`,
          rarity: (run.ending_rarity as EndingRarity) || EndingRarity.COMMON,
          genre: run.genre,
          discoveredAt: new Date(run.completed_at),
          storyRunId: run.id
        }))
    } catch (error) {
      console.error('Error getting recent discoveries:', error)
      throw error
    }
  }

  /**
   * Adds an ending to the global catalog
   */
  private static async addToEndingCatalog(
    endingTag: string,
    genre: string,
    title: string
  ): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('ending_catalog')
        .upsert({
          ending_tag: endingTag,
          genre,
          title,
          description: `A unique ending discovered in ${genre} stories`
        }, {
          onConflict: 'ending_tag'
        })

      if (error) {
        console.error('Error adding to ending catalog:', error)
        // Don't throw - this is non-critical
      }
    } catch (error) {
      console.error('Error adding to ending catalog:', error)
      // Don't throw - this is non-critical
    }
  }

  /**
   * Gets the total number of possible endings
   */
  private static async getTotalPossibleEndings(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('ending_catalog')
        .select('*', { count: 'exact' })

      if (error) {
        console.error('Error getting total endings count:', error)
        return 100 // Default estimate
      }

      return count || 100
    } catch (error) {
      console.error('Error getting total endings count:', error)
      return 100 // Default estimate
    }
  }
}

/**
 * Queries for managing the global ending catalog
 */
export class EndingCatalogQueries {
  /**
   * Gets all endings in the catalog
   */
  static async getAllEndings(): Promise<EndingCatalogEntry[]> {
    try {
      const { data: endings, error } = await supabase
        .from('ending_catalog')
        .select('*')
        .order('genre', { ascending: true })

      if (error) {
        console.error('Error fetching ending catalog:', error)
        throw new Error(`Failed to fetch ending catalog: ${error.message}`)
      }

      const endingsList = (endings || []) as Database['public']['Tables']['ending_catalog']['Row'][]
      
      // Calculate global completions and rarity for each ending
      const catalogEntries: EndingCatalogEntry[] = []
      
      for (const ending of endingsList) {
        const { count } = await supabase
          .from('story_runs')
          .select('*', { count: 'exact' })
          .eq('ending_tag', ending.ending_tag)
          .eq('completed', true)

        const globalCompletions = count || 0
        
        // Calculate rarity based on completion frequency
        let rarity: EndingRarity
        if (globalCompletions < 5) {
          rarity = EndingRarity.ULTRA_RARE
        } else if (globalCompletions < 25) {
          rarity = EndingRarity.RARE
        } else if (globalCompletions < 100) {
          rarity = EndingRarity.UNCOMMON
        } else {
          rarity = EndingRarity.COMMON
        }

        catalogEntries.push({
          endingTag: ending.ending_tag,
          genre: ending.genre,
          title: ending.title,
          description: ending.description,
          globalCompletions,
          rarity
        })
      }

      return catalogEntries
    } catch (error) {
      console.error('Error getting ending catalog:', error)
      throw error
    }
  }

  /**
   * Gets endings by genre
   */
  static async getEndingsByGenre(genre: string): Promise<EndingCatalogEntry[]> {
    try {
      const allEndings = await this.getAllEndings()
      return allEndings.filter(ending => ending.genre === genre)
    } catch (error) {
      console.error('Error getting endings by genre:', error)
      throw error
    }
  }

  /**
   * Gets endings by rarity
   */
  static async getEndingsByRarity(rarity: EndingRarity): Promise<EndingCatalogEntry[]> {
    try {
      const allEndings = await this.getAllEndings()
      return allEndings.filter(ending => ending.rarity === rarity)
    } catch (error) {
      console.error('Error getting endings by rarity:', error)
      throw error
    }
  }
}