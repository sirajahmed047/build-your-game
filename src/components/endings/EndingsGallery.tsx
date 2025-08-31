'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { EndingCollectionQueries, type UserEndingCollection, type EndingEntry } from '@/lib/endings/ending-queries'
import { EndingRarity } from '@/types/story'
import { EndingCard } from './EndingCard'
import { EndingFilters } from './EndingFilters'
import { EndingStats } from './EndingStats'
import { AchievementNotification } from './AchievementNotification'

interface EndingsGalleryProps {
  onEndingSelect?: (ending: EndingEntry) => void
}

export function EndingsGallery({ onEndingSelect }: EndingsGalleryProps) {
  const { user } = useAuth()
  const [collection, setCollection] = useState<UserEndingCollection | null>(null)
  const [filteredEndings, setFilteredEndings] = useState<EndingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<EndingRarity | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'rarity' | 'genre'>('date')
  const [showAchievement, setShowAchievement] = useState<string | null>(null)

  const checkForAchievements = useCallback((userCollection: UserEndingCollection) => {
    const { discoveredEndings, rarityBreakdown } = userCollection

    // Check for milestone achievements
    if (discoveredEndings.length === 1) {
      setShowAchievement('First Ending Discovered!')
    } else if (discoveredEndings.length === 10) {
      setShowAchievement('Story Collector - 10 Endings!')
    } else if (discoveredEndings.length === 25) {
      setShowAchievement('Master Collector - 25 Endings!')
    } else if (rarityBreakdown[EndingRarity.ULTRA_RARE] === 1) {
      setShowAchievement('Ultra Rare Discovery!')
    } else if (rarityBreakdown[EndingRarity.RARE] >= 5) {
      setShowAchievement('Rare Ending Hunter!')
    }

    // Auto-hide achievement after 5 seconds
    if (showAchievement) {
      setTimeout(() => setShowAchievement(null), 5000)
    }
  }, [showAchievement])

  const loadUserCollection = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const userCollection = await EndingCollectionQueries.getUserCollection(user.id)
      setCollection(userCollection)
      
      // Check for achievements
      checkForAchievements(userCollection)
    } catch (err) {
      console.error('Error loading user collection:', err)
      setError(err instanceof Error ? err.message : 'Failed to load collection')
    } finally {
      setLoading(false)
    }
  }, [user, checkForAchievements])

  const filterAndSortEndings = useCallback(() => {
    if (!collection) return

    let filtered = [...collection.discoveredEndings]

    // Apply genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(ending => ending.genre === selectedGenre)
    }

    // Apply rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(ending => ending.rarity === selectedRarity)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
        case 'rarity':
          const rarityOrder = {
            [EndingRarity.ULTRA_RARE]: 4,
            [EndingRarity.RARE]: 3,
            [EndingRarity.UNCOMMON]: 2,
            [EndingRarity.COMMON]: 1
          }
          return rarityOrder[b.rarity] - rarityOrder[a.rarity]
        case 'genre':
          return a.genre.localeCompare(b.genre)
        default:
          return 0
      }
    })

    setFilteredEndings(filtered)
  }, [collection, selectedGenre, selectedRarity, sortBy])

  useEffect(() => {
    if (user) {
      loadUserCollection()
    }
  }, [user, loadUserCollection])

  useEffect(() => {
    if (collection) {
      filterAndSortEndings()
    }
  }, [collection, selectedGenre, selectedRarity, sortBy, filterAndSortEndings])

  const getAvailableGenres = () => {
    if (!collection) return []
    const genres = new Set(collection.discoveredEndings.map(ending => ending.genre))
    return Array.from(genres).sort()
  }

  const getAvailableRarities = () => {
    if (!collection) return []
    const rarities = new Set(collection.discoveredEndings.map(ending => ending.rarity))
    return Array.from(rarities).sort((a, b) => {
      const order = {
        [EndingRarity.ULTRA_RARE]: 4,
        [EndingRarity.RARE]: 3,
        [EndingRarity.UNCOMMON]: 2,
        [EndingRarity.COMMON]: 1
      }
      return order[b] - order[a]
    })
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In to View Your Collection</h3>
        <p className="text-gray-600">
          Create an account to start collecting story endings and track your progress.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your collection...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Collection</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadUserCollection}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!collection || collection.discoveredEndings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Endings Discovered Yet</h3>
        <p className="text-gray-600 mb-6">
          Complete your first story to start building your collection of unique endings.
        </p>
        <button
          onClick={() => window.location.href = '/story-demo'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
        >
          Start Your First Story
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Achievement Notification */}
      {showAchievement && (
        <AchievementNotification
          message={showAchievement}
          onClose={() => setShowAchievement(null)}
        />
      )}

      {/* Collection Statistics */}
      <EndingStats collection={collection} />

      {/* Filters and Controls */}
      <EndingFilters
        availableGenres={getAvailableGenres()}
        availableRarities={getAvailableRarities()}
        selectedGenre={selectedGenre}
        selectedRarity={selectedRarity}
        sortBy={sortBy}
        onGenreChange={setSelectedGenre}
        onRarityChange={setSelectedRarity}
        onSortChange={setSortBy}
      />

      {/* Endings Grid */}
      {filteredEndings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No endings match your current filters.</p>
          <button
            onClick={() => {
              setSelectedGenre('all')
              setSelectedRarity('all')
            }}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEndings.map((ending) => (
            <EndingCard
              key={`${ending.endingTag}-${ending.storyRunId}`}
              ending={ending}
              onClick={() => onEndingSelect?.(ending)}
            />
          ))}
        </div>
      )}

      {/* Collection Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Collection Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {collection.discoveredEndings.length} endings discovered
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, collection.completionPercentage)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {collection.completionPercentage.toFixed(1)}% of all possible endings
            </p>
          </div>

          {/* Genre Progress */}
          {getAvailableGenres().map(genre => {
            const genreEndings = collection.discoveredEndings.filter(e => e.genre === genre)
            const genreProgress = (genreEndings.length / collection.discoveredEndings.length) * 100
            
            return (
              <div key={genre}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">{genre}</span>
                  <span className="text-sm text-gray-600">{genreEndings.length} endings</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${genreProgress}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}