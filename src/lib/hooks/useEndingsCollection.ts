'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { 
  EndingCollectionQueries, 
  type UserEndingCollection, 
  type EndingEntry,
  type EndingStatistics 
} from '@/lib/endings/ending-queries'
import { EndingRarity } from '@/types/story'

export interface UseEndingsCollectionOptions {
  autoLoad?: boolean
  onNewEndingDiscovered?: (ending: EndingEntry) => void
  onAchievementUnlocked?: (achievement: string) => void
}

export interface UseEndingsCollectionReturn {
  collection: UserEndingCollection | null
  statistics: EndingStatistics | null
  loading: boolean
  error: string | null
  refreshCollection: () => Promise<void>
  recordEndingDiscovery: (
    storyRunId: string,
    endingTag: string,
    title: string,
    rarity: EndingRarity,
    genre: string
  ) => Promise<void>
  hasDiscoveredEnding: (endingTag: string) => boolean
  getEndingsByGenre: (genre: string) => EndingEntry[]
  getEndingsByRarity: (rarity: EndingRarity) => EndingEntry[]
  checkForAchievements: () => string[]
}

export function useEndingsCollection(options: UseEndingsCollectionOptions = {}): UseEndingsCollectionReturn {
  const { user } = useAuth()
  const { autoLoad = true, onNewEndingDiscovered, onAchievementUnlocked } = options

  const [collection, setCollection] = useState<UserEndingCollection | null>(null)
  const [statistics, setStatistics] = useState<EndingStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previousEndingCount, setPreviousEndingCount] = useState(0)

  // Memoize callback functions to prevent infinite loops
  const memoizedOnNewEndingDiscovered = useCallback((ending: EndingEntry) => {
    onNewEndingDiscovered?.(ending)
  }, [onNewEndingDiscovered])
  
  const memoizedOnAchievementUnlocked = useCallback((achievement: string) => {
    onAchievementUnlocked?.(achievement)
  }, [onAchievementUnlocked])

  const refreshCollection = useCallback(async () => {
    if (!user) {
      setCollection(null)
      setStatistics(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [userCollection, userStats] = await Promise.all([
        EndingCollectionQueries.getUserCollection(user.id),
        EndingCollectionQueries.getUserEndingStatistics(user.id)
      ])

      setCollection(userCollection)
      setStatistics(userStats)
    } catch (err) {
      console.error('Error loading endings collection:', err)
      setError(err instanceof Error ? err.message : 'Failed to load collection')
    } finally {
      setLoading(false)
    }
  }, [user])

  const hasDiscoveredEnding = useCallback((endingTag: string): boolean => {
    if (!collection) return false
    return collection.discoveredEndings.some(ending => ending.endingTag === endingTag)
  }, [collection])

  const recordEndingDiscovery = useCallback(async (
    storyRunId: string,
    endingTag: string,
    title: string,
    rarity: EndingRarity,
    genre: string
  ) => {
    if (!user) {
      throw new Error('User must be authenticated to record ending discovery')
    }

    try {
      // Check if this is a new discovery
      const isNewDiscovery = !hasDiscoveredEnding(endingTag)

      await EndingCollectionQueries.recordEndingDiscovery(
        user.id,
        storyRunId,
        endingTag,
        title,
        rarity,
        genre
      )

      // Refresh collection to get updated data
      await refreshCollection()

      // Notify about new discovery
      if (isNewDiscovery) {
        const newEnding: EndingEntry = {
          endingTag,
          title,
          description: `A ${rarity} ending in ${genre}`,
          rarity,
          genre,
          discoveredAt: new Date(),
          storyRunId
        }
        memoizedOnNewEndingDiscovered(newEnding)
      }
    } catch (err) {
      console.error('Error recording ending discovery:', err)
      throw err
    }
  }, [user, memoizedOnNewEndingDiscovered, refreshCollection, hasDiscoveredEnding])

  const getEndingsByGenre = useCallback((genre: string): EndingEntry[] => {
    if (!collection) return []
    return collection.discoveredEndings.filter(ending => ending.genre === genre)
  }, [collection])

  const getEndingsByRarity = useCallback((rarity: EndingRarity): EndingEntry[] => {
    if (!collection) return []
    return collection.discoveredEndings.filter(ending => ending.rarity === rarity)
  }, [collection])

  const checkForAchievements = useCallback((): string[] => {
    if (!collection) return []

    const achievements: string[] = []
    const { discoveredEndings, rarityBreakdown, totalStoriesCompleted } = collection

    // First ending achievement
    if (discoveredEndings.length === 1) {
      achievements.push('First Ending Discovered!')
    }

    // Story collector milestones
    if (discoveredEndings.length === 5) {
      achievements.push('Story Explorer - 5 Endings!')
    } else if (discoveredEndings.length === 10) {
      achievements.push('Story Collector - 10 Endings!')
    } else if (discoveredEndings.length === 25) {
      achievements.push('Master Collector - 25 Endings!')
    } else if (discoveredEndings.length === 50) {
      achievements.push('Legendary Collector - 50 Endings!')
    }

    // Rarity achievements
    if (rarityBreakdown[EndingRarity.ULTRA_RARE] === 1) {
      achievements.push('Ultra Rare Discovery!')
    } else if (rarityBreakdown[EndingRarity.ULTRA_RARE] === 5) {
      achievements.push('Ultra Rare Master!')
    }

    if (rarityBreakdown[EndingRarity.RARE] === 5) {
      achievements.push('Rare Ending Hunter!')
    } else if (rarityBreakdown[EndingRarity.RARE] === 10) {
      achievements.push('Rare Ending Master!')
    }

    // Genre achievements
    const genreCount = new Set(discoveredEndings.map(e => e.genre)).size
    if (genreCount === 3) {
      achievements.push('Genre Master - All 3 Genres!')
    }

    // Completion achievements
    if (collection.completionPercentage >= 25) {
      achievements.push('Quarter Complete - 25% Collection!')
    } else if (collection.completionPercentage >= 50) {
      achievements.push('Half Complete - 50% Collection!')
    } else if (collection.completionPercentage >= 75) {
      achievements.push('Nearly Complete - 75% Collection!')
    } else if (collection.completionPercentage >= 100) {
      achievements.push('Perfect Collection - 100% Complete!')
    }

    // Story completion achievements
    if (totalStoriesCompleted === 10) {
      achievements.push('Dedicated Reader - 10 Stories!')
    } else if (totalStoriesCompleted === 50) {
      achievements.push('Story Addict - 50 Stories!')
    } else if (totalStoriesCompleted === 100) {
      achievements.push('Story Legend - 100 Stories!')
    }

    return achievements
  }, [collection])

  // Load collection when user changes or autoLoad is enabled
  useEffect(() => {
    if (user && autoLoad) {
      refreshCollection()
    }
  }, [user, autoLoad, refreshCollection])

  // Check for new achievements when collection changes
  useEffect(() => {
    if (collection && collection.discoveredEndings.length > previousEndingCount) {
      const achievements = checkForAchievements()
      achievements.forEach(achievement => {
        memoizedOnAchievementUnlocked(achievement)
      })
      setPreviousEndingCount(collection.discoveredEndings.length)
    }
  }, [collection, previousEndingCount, memoizedOnAchievementUnlocked, checkForAchievements])

  return {
    collection,
    statistics,
    loading,
    error,
    refreshCollection,
    recordEndingDiscovery,
    hasDiscoveredEnding,
    getEndingsByGenre,
    getEndingsByRarity,
    checkForAchievements
  }
}