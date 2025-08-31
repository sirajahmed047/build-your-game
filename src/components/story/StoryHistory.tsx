'use client'

import { useState } from 'react'
import { useStoryHistory } from '@/lib/hooks/useSaveReplay'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ReplayOptionsComponent, QuickReplayButton } from './ReplayOptions'
import { SavePoints } from './SavePoints'
import type { StoryRun } from '@/types/story'

interface StoryHistoryProps {
  userId?: string
  onStorySelected?: (storyRun: StoryRun) => void
  onReplayStarted?: () => void
  maxItems?: number
}

export function StoryHistory({ 
  userId, 
  onStorySelected, 
  onReplayStarted,
  maxItems = 10 
}: StoryHistoryProps) {
  const [selectedStory, setSelectedStory] = useState<StoryRun | null>(null)
  const [showReplayOptions, setShowReplayOptions] = useState(false)
  const [showSavePoints, setShowSavePoints] = useState(false)

  const { data: storyHistory, isLoading, refetch } = useStoryHistory(userId)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getGenreEmoji = (genre: string) => {
    switch (genre) {
      case 'fantasy': return '🧙‍♂️'
      case 'mystery': return '🔍'
      case 'sci-fi': return '🚀'
      default: return '📖'
    }
  }

  const getRarityEmoji = (rarity?: string) => {
    switch (rarity) {
      case 'ultra-rare': return '💎'
      case 'rare': return '⭐'
      case 'uncommon': return '🔹'
      case 'common': return '⚪'
      default: return ''
    }
  }

  const handleStoryClick = (storyRun: StoryRun) => {
    setSelectedStory(storyRun)
    onStorySelected?.(storyRun)
  }

  const handleShowReplayOptions = (storyRun: StoryRun) => {
    setSelectedStory(storyRun)
    setShowReplayOptions(true)
  }

  const handleShowSavePoints = (storyRun: StoryRun) => {
    setSelectedStory(storyRun)
    setShowSavePoints(true)
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading story history...</span>
        </div>
      </Card>
    )
  }

  if (!storyHistory || storyHistory.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📚</div>
          <h3 className="text-lg font-semibold mb-2">No Stories Yet</h3>
          <p>Your completed stories will appear here for replay.</p>
        </div>
      </Card>
    )
  }

  const displayedHistory = storyHistory.slice(0, maxItems)

  return (
    <div className="space-y-4">
      {/* Replay Options Modal */}
      {showReplayOptions && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ReplayOptionsComponent
              storyRun={selectedStory}
              onReplayStarted={() => {
                setShowReplayOptions(false)
                onReplayStarted?.()
              }}
              onClose={() => setShowReplayOptions(false)}
            />
          </div>
        </div>
      )}

      {/* Save Points Modal */}
      {showSavePoints && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <SavePoints
              storyRunId={selectedStory.id}
              onRestoreProgress={() => {
                setShowSavePoints(false)
                onStorySelected?.(selectedStory)
              }}
              onClose={() => setShowSavePoints(false)}
            />
          </div>
        </div>
      )}

      {/* Story History List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Story History</h3>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {displayedHistory.map((historyItem) => {
            const { storyRun, canReplay, savePoints, lastPlayedAt } = historyItem
            
            return (
              <div
                key={storyRun.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Story Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getGenreEmoji(storyRun.genre)}</span>
                      <span className="font-medium capitalize">
                        {storyRun.genre} Story
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500 capitalize">
                        {storyRun.length} • {storyRun.challenge}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        storyRun.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {storyRun.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    {/* Ending Information */}
                    {storyRun.ending_title && (
                      <div className="mb-2">
                        <div className="flex items-center space-x-2">
                          {storyRun.ending_rarity && (
                            <span>{getRarityEmoji(storyRun.ending_rarity)}</span>
                          )}
                          <span className="text-sm font-medium text-gray-700">
                            {storyRun.ending_title}
                          </span>
                          {storyRun.ending_rarity && (
                            <span className="text-xs text-gray-500 capitalize">
                              ({storyRun.ending_rarity.replace('_', ' ')})
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Story Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                      <span>💾 {savePoints} save points</span>
                      <span>🕒 {formatDate(lastPlayedAt)}</span>
                      {storyRun.completed_at && (
                        <span>✅ {formatDate(storyRun.completed_at)}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {!storyRun.completed && (
                        <Button
                          size="sm"
                          onClick={() => handleStoryClick(storyRun)}
                          className="flex items-center"
                        >
                          <span className="mr-1">▶️</span>
                          Continue
                        </Button>
                      )}

                      {savePoints > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShowSavePoints(storyRun)}
                          className="flex items-center"
                        >
                          <span className="mr-1">💾</span>
                          Save Points
                        </Button>
                      )}

                      {canReplay && (
                        <>
                          <QuickReplayButton
                            storyRunId={storyRun.id}
                            onReplayStarted={onReplayStarted}
                            size="sm"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShowReplayOptions(storyRun)}
                            className="flex items-center"
                          >
                            <span className="mr-1">⚙️</span>
                            Replay Options
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {storyHistory.length > maxItems && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-gray-500">
              Showing {maxItems} of {storyHistory.length} stories
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

interface CompactStoryHistoryProps {
  userId?: string
  onStorySelected?: (storyRun: StoryRun) => void
  maxItems?: number
}

export function CompactStoryHistory({ 
  userId, 
  onStorySelected, 
  maxItems = 5 
}: CompactStoryHistoryProps) {
  const { data: storyHistory, isLoading } = useStoryHistory(userId)

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  if (!storyHistory || storyHistory.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No previous stories
      </div>
    )
  }

  const recentStories = storyHistory.slice(0, maxItems)

  return (
    <div className="space-y-2">
      {recentStories.map((historyItem) => {
        const { storyRun } = historyItem
        
        return (
          <button
            key={storyRun.id}
            onClick={() => onStorySelected?.(storyRun)}
            className="w-full text-left p-2 rounded border hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{getGenreEmoji(storyRun.genre)}</span>
                <span className="text-sm font-medium capitalize">
                  {storyRun.genre}
                </span>
                {storyRun.ending_title && (
                  <span className="text-xs text-gray-500 truncate">
                    • {storyRun.ending_title}
                  </span>
                )}
              </div>
              <span className={`px-1 py-0.5 rounded text-xs ${
                storyRun.completed 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {storyRun.completed ? '✓' : '⏸️'}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function getGenreEmoji(genre: string): string {
  switch (genre) {
    case 'fantasy': return '🧙‍♂️'
    case 'mystery': return '🔍'
    case 'sci-fi': return '🚀'
    default: return '📖'
  }
}