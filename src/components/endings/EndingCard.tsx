'use client'

import { EndingEntry } from '@/lib/endings/ending-queries'
import { EndingRarity } from '@/types/story'
import { formatDistanceToNow } from 'date-fns'

interface EndingCardProps {
  ending: EndingEntry
  onClick?: () => void
}

export function EndingCard({ ending, onClick }: EndingCardProps) {
  const getRarityColor = (rarity: EndingRarity) => {
    switch (rarity) {
      case EndingRarity.ULTRA_RARE:
        return 'from-purple-500 to-pink-500'
      case EndingRarity.RARE:
        return 'from-yellow-400 to-orange-500'
      case EndingRarity.UNCOMMON:
        return 'from-blue-400 to-blue-600'
      case EndingRarity.COMMON:
        return 'from-gray-400 to-gray-600'
      default:
        return 'from-gray-400 to-gray-600'
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

  const getRarityBorderClass = (rarity: EndingRarity) => {
    switch (rarity) {
      case EndingRarity.ULTRA_RARE:
        return 'border-purple-300 shadow-purple-100'
      case EndingRarity.RARE:
        return 'border-yellow-300 shadow-yellow-100'
      case EndingRarity.UNCOMMON:
        return 'border-blue-300 shadow-blue-100'
      case EndingRarity.COMMON:
        return 'border-gray-300 shadow-gray-100'
      default:
        return 'border-gray-300 shadow-gray-100'
    }
  }

  return (
    <div
      className={`bg-white rounded-lg border-2 ${getRarityBorderClass(ending.rarity)} shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:scale-105`}
      onClick={onClick}
    >
      {/* Header with rarity indicator */}
      <div className={`bg-gradient-to-r ${getRarityColor(ending.rarity)} p-4 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getRarityIcon(ending.rarity)}</span>
            <span className="text-white font-semibold capitalize">
              {ending.rarity.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xl">{getGenreIcon(ending.genre)}</span>
            <span className="text-white text-sm capitalize">{ending.genre}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {ending.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {ending.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Discovered {formatDistanceToNow(ending.discoveredAt, { addSuffix: true })}
          </span>
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>{ending.genre}</span>
          </div>
        </div>
      </div>

      {/* Rarity glow effect for ultra-rare endings */}
      {ending.rarity === EndingRarity.ULTRA_RARE && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse pointer-events-none" />
      )}
    </div>
  )
}