'use client'

import { EndingRarity } from '@/types/story'

interface EndingFiltersProps {
  availableGenres: string[]
  availableRarities: EndingRarity[]
  selectedGenre: string
  selectedRarity: EndingRarity | 'all'
  sortBy: 'date' | 'rarity' | 'genre'
  onGenreChange: (genre: string) => void
  onRarityChange: (rarity: EndingRarity | 'all') => void
  onSortChange: (sort: 'date' | 'rarity' | 'genre') => void
}

export function EndingFilters({
  availableGenres,
  availableRarities,
  selectedGenre,
  selectedRarity,
  sortBy,
  onGenreChange,
  onRarityChange,
  onSortChange
}: EndingFiltersProps) {
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Filter & Sort</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Genre Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genre
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Genres</option>
            {availableGenres.map(genre => (
              <option key={genre} value={genre}>
                {getGenreIcon(genre)} {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rarity
          </label>
          <select
            value={selectedRarity}
            onChange={(e) => onRarityChange(e.target.value as EndingRarity | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Rarities</option>
            {availableRarities.map(rarity => (
              <option key={rarity} value={rarity}>
                {getRarityIcon(rarity)} {rarity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'date' | 'rarity' | 'genre')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">📅 Discovery Date</option>
            <option value="rarity">💎 Rarity</option>
            <option value="genre">📚 Genre</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedGenre !== 'all' || selectedRarity !== 'all') && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            
            {selectedGenre !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getGenreIcon(selectedGenre)} {selectedGenre}
                <button
                  onClick={() => onGenreChange('all')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {selectedRarity !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {getRarityIcon(selectedRarity)} {selectedRarity.replace('_', ' ')}
                <button
                  onClick={() => onRarityChange('all')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            
            <button
              onClick={() => {
                onGenreChange('all')
                onRarityChange('all')
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}