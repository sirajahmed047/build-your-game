'use client'

import { useState } from 'react'
import { Crown, Lock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useAuth } from '@/components/auth/AuthProvider'
import PaywallModal from '@/components/subscription/PaywallModal'
import UsageLimitsDisplay from '@/components/subscription/UsageLimitsDisplay'
import type { StoryGenerationRequest } from '@/types/story'

interface PremiumStoryGeneratorProps {
  onStartStory: (request: StoryGenerationRequest) => void
  loading?: boolean
}

const GENRE_OPTIONS = [
  { id: 'fantasy', name: 'Fantasy', premium: false, description: 'Magic, dragons, and epic quests' },
  { id: 'mystery', name: 'Mystery', premium: false, description: 'Puzzles, clues, and suspense' },
  { id: 'sci-fi', name: 'Sci-Fi', premium: false, description: 'Future tech and space adventures' },
  { id: 'horror', name: 'Horror', premium: true, description: 'Thrills, chills, and supernatural scares' },
  { id: 'romance', name: 'Romance', premium: true, description: 'Love stories and emotional journeys' },
  { id: 'thriller', name: 'Thriller', premium: true, description: 'High-stakes action and suspense' }
]

const LENGTH_OPTIONS = [
  { id: 'quick', name: 'Quick', duration: '15 min', premium: false, description: 'Perfect for a coffee break' },
  { id: 'standard', name: 'Standard', duration: '30 min', premium: false, description: 'Full story experience' },
  { id: 'extended', name: 'Extended', duration: '45 min', premium: true, description: 'Deep, immersive narrative' }
]

const CHALLENGE_OPTIONS = [
  { id: 'casual', name: 'Casual', description: 'Relaxed storytelling' },
  { id: 'challenging', name: 'Challenging', description: 'Complex moral dilemmas' }
]

export function PremiumStoryGenerator({ onStartStory, loading }: PremiumStoryGeneratorProps) {
  const { user, sessionId } = useAuth()
  const { isPremium, usageLimits, checkGenreAccess, checkExtendedLength, checkDailyLimit } = useSubscription()
  
  const [selectedGenre, setSelectedGenre] = useState<string>('fantasy')
  const [selectedLength, setSelectedLength] = useState<string>('standard')
  const [selectedChallenge, setSelectedChallenge] = useState<string>('casual')
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallTrigger, setPaywallTrigger] = useState<'daily_limit' | 'premium_genre' | 'extended_length' | 'advanced_analytics'>('daily_limit')
  const [paywallGenre, setPaywallGenre] = useState<string>()

  const handleGenreSelect = async (genreId: string) => {
    const genre = GENRE_OPTIONS.find(g => g.id === genreId)
    
    if (genre?.premium && user) {
      const hasAccess = await checkGenreAccess(genreId)
      if (!hasAccess) {
        setPaywallTrigger('premium_genre')
        setPaywallGenre(genreId)
        setPaywallOpen(true)
        return
      }
    }
    
    setSelectedGenre(genreId)
  }

  const handleLengthSelect = async (lengthId: string) => {
    const length = LENGTH_OPTIONS.find(l => l.id === lengthId)
    
    if (length?.premium && user) {
      const hasAccess = await checkExtendedLength()
      if (!hasAccess) {
        setPaywallTrigger('extended_length')
        setPaywallOpen(true)
        return
      }
    }
    
    setSelectedLength(lengthId)
  }

  const handleStartStory = async () => {
    if (!user) {
      // Guest users can only use basic features
      if (GENRE_OPTIONS.find(g => g.id === selectedGenre)?.premium ||
          LENGTH_OPTIONS.find(l => l.id === selectedLength)?.premium) {
        alert('Please sign in to access premium features')
        return
      }
    } else {
      // Check daily limits for authenticated users
      const hasReachedLimit = await checkDailyLimit()
      if (hasReachedLimit && !isPremium) {
        setPaywallTrigger('daily_limit')
        setPaywallOpen(true)
        return
      }
    }

    const request: StoryGenerationRequest = {
      genre: selectedGenre as any,
      length: selectedLength as any,
      challenge: selectedChallenge as any,
      userId: user?.id || '',
      sessionId
    }

    onStartStory(request)
  }

  const selectedGenreOption = GENRE_OPTIONS.find(g => g.id === selectedGenre)
  const selectedLengthOption = LENGTH_OPTIONS.find(l => l.id === selectedLength)
  const selectedChallengeOption = CHALLENGE_OPTIONS.find(c => c.id === selectedChallenge)

  return (
    <div className="space-y-6">
      {/* Usage Limits Display */}
      {user && (
        <UsageLimitsDisplay 
          onUpgradeClick={() => {
            setPaywallTrigger('daily_limit')
            setPaywallOpen(true)
          }}
        />
      )}

      {/* Genre Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Genre</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GENRE_OPTIONS.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreSelect(genre.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedGenre === genre.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{genre.name}</h4>
                {genre.premium && (
                  <div className="flex items-center space-x-1">
                    {isPremium ? (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{genre.description}</p>
              {genre.premium && !isPremium && (
                <div className="mt-2 text-xs text-purple-600 font-medium">Premium Only</div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Length Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Length</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LENGTH_OPTIONS.map((length) => (
            <button
              key={length.id}
              onClick={() => handleLengthSelect(length.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedLength === length.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{length.name}</h4>
                  <p className="text-sm text-purple-600 font-medium">{length.duration}</p>
                </div>
                {length.premium && (
                  <div className="flex items-center space-x-1">
                    {isPremium ? (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{length.description}</p>
              {length.premium && !isPremium && (
                <div className="mt-2 text-xs text-purple-600 font-medium">Premium Only</div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Challenge Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenge Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHALLENGE_OPTIONS.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => setSelectedChallenge(challenge.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedChallenge === challenge.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-medium text-gray-900">{challenge.name}</h4>
              <p className="text-sm text-gray-600">{challenge.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Start Story Button */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Ready to Begin?</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Genre:</span> {selectedGenreOption?.name}</p>
              <p><span className="font-medium">Length:</span> {selectedLengthOption?.name} ({selectedLengthOption?.duration})</p>
              <p><span className="font-medium">Challenge:</span> {selectedChallengeOption?.name}</p>
            </div>
          </div>
          
          <Button
            onClick={handleStartStory}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Story...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Start Your Adventure</span>
              </div>
            )}
          </Button>
        </div>
      </Card>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger={paywallTrigger}
        genre={paywallGenre}
      />
    </div>
  )
}

export default PremiumStoryGenerator