'use client'

import { UserEndingCollection } from '@/lib/endings/ending-queries'
import { EndingRarity } from '@/types/story'
import { safeToNumber } from '@/lib/utils/type-safety'

interface EndingStatsProps {
  collection: UserEndingCollection
}

export function EndingStats({ collection }: EndingStatsProps) {
  const getRarityColor = (rarity: EndingRarity) => {
    switch (rarity) {
      case EndingRarity.ULTRA_RARE:
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case EndingRarity.RARE:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case EndingRarity.UNCOMMON:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case EndingRarity.COMMON:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRarityIcon = (rarity: EndingRarity) => {
    switch (rarity) {
      case EndingRarity.ULTRA_RARE:
        return '💎'
      case EndingRarity.RARE:
        return '⭐'
      case EndingRarity.UNCOMMON:
        return '🔹'
      case EndingRarity.COMMON:
        return '⚪'
      default:
        return '⚪'
    }
  }

  const getGenreIcon = (genre: string) => {
    switch (genre.toLowerCase()) {
      case 'fantasy':
        return '🏰'
      case 'mystery':
        return '🔍'
      case 'sci-fi':
        return '🚀'
      default:
        return '📖'
    }
  }

  // Calculate genre breakdown with null safety
  const genreBreakdown = (collection.discoveredEndings || []).reduce((acc, ending) => {
    if (ending?.genre) {
      acc[ending.genre] = (acc[ending.genre] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const totalEndings = collection.discoveredEndings?.length || 0
  const totalStories = safeToNumber(collection.totalStoriesCompleted, 0)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Collection</h2>
        {collection.lastDiscovered && (
          <div className="text-sm text-gray-600">
            Last discovery: {new Date(collection.lastDiscovered).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{totalEndings}</div>
          <div className="text-sm text-blue-800">Unique Endings</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600">{totalStories}</div>
          <div className="text-sm text-green-800">Stories Completed</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="text-3xl font-bold text-purple-600">
            {safeToNumber(collection.completionPercentage, 0).toFixed(1)}%
          </div>
          <div className="text-sm text-purple-800">Collection Complete</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <div className="text-3xl font-bold text-orange-600">
            {safeToNumber(collection.rarityBreakdown?.[EndingRarity.ULTRA_RARE], 0) + 
             safeToNumber(collection.rarityBreakdown?.[EndingRarity.RARE], 0)}
          </div>
          <div className="text-sm text-orange-800">Rare+ Endings</div>
        </div>
      </div>

      {/* Rarity Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Rarity Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(collection.rarityBreakdown || {}).map(([rarity, count]) => (
            <div
              key={rarity}
              className={`p-3 rounded-lg border text-center ${getRarityColor(rarity as EndingRarity)}`}
            >
              <div className="text-2xl mb-1">{getRarityIcon(rarity as EndingRarity)}</div>
              <div className="text-xl font-bold">{safeToNumber(count, 0)}</div>
              <div className="text-xs capitalize">
                {rarity.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Genre Breakdown */}
      {Object.keys(genreBreakdown).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Genre Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(genreBreakdown).map(([genre, count]) => (
              <div
                key={genre}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center"
              >
                <div className="text-2xl mb-1">{getGenreIcon(genre)}</div>
                <div className="text-xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{genre}</div>
                <div className="text-xs text-gray-500">
                  {((count / totalEndings) * 100).toFixed(1)}% of collection
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Hints */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Achievement Progress</h3>
        <div className="space-y-2">
          {/* First Ending */}
          <div className={`flex items-center justify-between p-2 rounded ${
            totalEndings >= 1 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
          }`}>
            <span className="text-sm">🎯 First Discovery</span>
            <span className="text-sm font-medium">
              {totalEndings >= 1 ? '✅ Complete' : '❌ Incomplete'}
            </span>
          </div>

          {/* Story Collector */}
          <div className={`flex items-center justify-between p-2 rounded ${
            totalEndings >= 10 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
          }`}>
            <span className="text-sm">📚 Story Collector (10 endings)</span>
            <span className="text-sm font-medium">
              {totalEndings >= 10 ? '✅ Complete' : `${totalEndings}/10`}
            </span>
          </div>

          {/* Rare Hunter */}
          <div className={`flex items-center justify-between p-2 rounded ${
            safeToNumber(collection.rarityBreakdown?.[EndingRarity.RARE], 0) >= 5 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
          }`}>
            <span className="text-sm">⭐ Rare Hunter (5 rare endings)</span>
            <span className="text-sm font-medium">
              {safeToNumber(collection.rarityBreakdown?.[EndingRarity.RARE], 0) >= 5 
                ? '✅ Complete' 
                : `${safeToNumber(collection.rarityBreakdown?.[EndingRarity.RARE], 0)}/5`
              }
            </span>
          </div>

          {/* Ultra Rare Discovery */}
          <div className={`flex items-center justify-between p-2 rounded ${
            safeToNumber(collection.rarityBreakdown?.[EndingRarity.ULTRA_RARE], 0) >= 1 ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
          }`}>
            <span className="text-sm">💎 Ultra Rare Discovery</span>
            <span className="text-sm font-medium">
              {safeToNumber(collection.rarityBreakdown?.[EndingRarity.ULTRA_RARE], 0) >= 1 ? '✅ Complete' : '❌ Incomplete'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}