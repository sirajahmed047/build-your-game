'use client'

import { useState } from 'react'
import { useSaveReplay } from '@/lib/hooks/useSaveReplay'
import { StoryHistory } from '@/components/story/StoryHistory'
import { SavePoints } from '@/components/story/SavePoints'
import { ReplayOptionsComponent } from '@/components/story/ReplayOptions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function SaveReplayDemo() {
  const [selectedStoryRunId, setSelectedStoryRunId] = useState<string | null>(null)
  const [showSavePoints, setShowSavePoints] = useState(false)
  const [showReplayOptions, setShowReplayOptions] = useState(false)

  const {
    storyHistory,
    isLoadingHistory,
    saveProgress,
    isSavingProgress,
    refetchHistory
  } = useSaveReplay({
    onProgressSaved: (savePoint) => {
      console.log('Progress saved:', savePoint)
    },
    onReplayStarted: (session) => {
      console.log('Replay started:', session)
      setShowReplayOptions(false)
    }
  })

  const handleTestSaveProgress = async () => {
    if (!selectedStoryRunId) return
    
    const mockGameState = {
      act: 1,
      flags: ['test_flag'],
      relationships: { wizard: 50 },
      inventory: ['magic_sword'],
      personalityTraits: {
        riskTaking: 60,
        empathy: 70,
        pragmatism: 40,
        creativity: 80,
        leadership: 55
      }
    }

    const mockPersonalityTraits = {
      riskTaking: 60,
      empathy: 70,
      pragmatism: 40,
      creativity: 80,
      leadership: 55
    }

    await saveProgress(
      selectedStoryRunId,
      Math.floor(Math.random() * 10) + 1,
      mockGameState,
      mockPersonalityTraits,
      'This is a test save point created from the demo.',
      [
        { id: 'A', text: 'Test choice A', slug: 'test_choice_a' },
        { id: 'B', text: 'Test choice B', slug: 'test_choice_b' }
      ],
      'Demo save point'
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Save & Replay System Demo</h1>
          <p className="text-gray-600">
            Test the save and replay functionality for interactive stories.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Story History */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Story History</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchHistory()}
                  disabled={isLoadingHistory}
                >
                  🔄 Refresh
                </Button>
              </div>
              
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading...</span>
                </div>
              ) : storyHistory.length > 0 ? (
                <div className="space-y-3">
                  {storyHistory.slice(0, 5).map((historyItem) => (
                    <div
                      key={historyItem.storyRun.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedStoryRunId === historyItem.storyRun.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedStoryRunId(historyItem.storyRun.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {historyItem.storyRun.genre} Story
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          historyItem.storyRun.completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {historyItem.storyRun.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        💾 {historyItem.savePoints} save points
                      </div>
                      {historyItem.storyRun.ending_title && (
                        <div className="text-sm text-gray-700 mt-1">
                          🏆 {historyItem.storyRun.ending_title}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📚</div>
                  <p>No stories found. Play some stories first!</p>
                </div>
              )}
            </Card>
          </div>

          {/* Demo Actions */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Demo Actions</h2>
              
              {selectedStoryRunId ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Selected Story: <code className="font-mono">{selectedStoryRunId}</code>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={handleTestSaveProgress}
                      disabled={isSavingProgress}
                      className="flex items-center justify-center"
                    >
                      {isSavingProgress ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">💾</span>
                          Test Save Progress
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setShowSavePoints(true)}
                      className="flex items-center justify-center"
                    >
                      <span className="mr-2">📋</span>
                      View Save Points
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setShowReplayOptions(true)}
                      className="flex items-center justify-center"
                    >
                      <span className="mr-2">🔄</span>
                      Replay Options
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">👆</div>
                  <p>Select a story from the history to test save/replay features.</p>
                </div>
              )}
            </Card>

            {/* Feature Status */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold mb-3">Implementation Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span>Automatic progress saving at decision points</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span>Replay from story beginning with alternate choices</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span>Same branching template for consistent replays</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span>Immediate replay options after completion</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  <span>Progress restoration after browser close</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Full Story History Modal */}
        <div className="mt-8">
          <StoryHistory
            onStorySelected={(storyRun) => {
              setSelectedStoryRunId(storyRun.id)
            }}
            onReplayStarted={() => {
              console.log('Replay started from history')
            }}
            maxItems={10}
          />
        </div>

        {/* Save Points Modal */}
        {showSavePoints && selectedStoryRunId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <SavePoints
                storyRunId={selectedStoryRunId}
                onRestoreProgress={(savePoint) => {
                  console.log('Restored to save point:', savePoint)
                  setShowSavePoints(false)
                }}
                onClose={() => setShowSavePoints(false)}
              />
            </div>
          </div>
        )}

        {/* Replay Options Modal */}
        {showReplayOptions && selectedStoryRunId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ReplayOptionsComponent
                storyRun={storyHistory.find(h => h.storyRun.id === selectedStoryRunId)?.storyRun!}
                onReplayStarted={() => {
                  console.log('Replay started from options')
                  setShowReplayOptions(false)
                }}
                onClose={() => setShowReplayOptions(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}