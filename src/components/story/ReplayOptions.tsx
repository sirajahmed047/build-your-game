'use client'

import { useState } from 'react'
import { useSaveReplay, useReplayOptions } from '@/lib/hooks/useSaveReplay'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { ReplayTemplate, ReplayOptions } from '@/lib/story/save-replay'
import type { StoryRun } from '@/types/story'

interface ReplayOptionsProps {
  storyRun: StoryRun
  onReplayStarted?: () => void
  onClose?: () => void
}

export function ReplayOptionsComponent({ storyRun, onReplayStarted, onClose }: ReplayOptionsProps) {
  const [selectedStartPoint, setSelectedStartPoint] = useState<number>(1)
  const [replaySettings, setReplaySettings] = useState<ReplayOptions>({
    fromStep: 1,
    withDifferentChoices: true,
    preservePersonality: false
  })

  const { data: replayData, isLoading } = useReplayOptions(storyRun.id)
  
  const {
    startReplay,
    quickRestart,
    isStartingReplay,
    isQuickRestarting
  } = useSaveReplay({
    onReplayStarted: () => {
      onReplayStarted?.()
      onClose?.()
    }
  })

  const handleStartReplay = () => {
    if (!replayData?.template) return
    
    const options: ReplayOptions = {
      ...replaySettings,
      fromStep: selectedStartPoint
    }
    
    startReplay(replayData.template, options)
  }

  const handleQuickRestart = () => {
    quickRestart(storyRun.id)
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading replay options...</span>
        </div>
      </Card>
    )
  }

  if (!replayData?.canReplay) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🚫</div>
          <h3 className="text-lg font-semibold mb-2">Cannot Replay</h3>
          <p>This story must be completed before it can be replayed.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Replay Story</h3>
          <p className="text-sm text-gray-600 capitalize">
            {storyRun.genre} • {storyRun.length} • {storyRun.challenge}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleQuickRestart}
            disabled={isQuickRestarting || isStartingReplay}
            className="flex items-center"
          >
            {isQuickRestarting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting...
              </>
            ) : (
              <>
                <span className="mr-2">🔄</span>
                Restart from Beginning
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Start over with fresh personality traits and different choice suggestions
        </p>
      </div>

      {/* Advanced Replay Options */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Advanced Options</h4>
        
        {/* Starting Point Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start from:
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="startPoint"
                value={1}
                checked={selectedStartPoint === 1}
                onChange={(e) => setSelectedStartPoint(parseInt(e.target.value))}
                className="mr-2"
              />
              <span>Beginning (Step 1)</span>
            </label>
            
            {replayData.suggestedStartPoints.map((point) => (
              <label key={point.stepNumber} className="flex items-center">
                <input
                  type="radio"
                  name="startPoint"
                  value={point.stepNumber}
                  checked={selectedStartPoint === point.stepNumber}
                  onChange={(e) => setSelectedStartPoint(parseInt(e.target.value))}
                  className="mr-2"
                />
                <div className="flex-1">
                  <span>Step {point.stepNumber}</span>
                  <p className="text-xs text-gray-500 ml-4">
                    {point.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Replay Settings */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={replaySettings.withDifferentChoices}
              onChange={(e) => setReplaySettings(prev => ({
                ...prev,
                withDifferentChoices: e.target.checked
              }))}
              className="mr-2"
            />
            <div>
              <span className="text-sm font-medium">Suggest different choices</span>
              <p className="text-xs text-gray-500">
                Shuffle choice order to encourage exploring new paths
              </p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={replaySettings.preservePersonality}
              onChange={(e) => setReplaySettings(prev => ({
                ...prev,
                preservePersonality: e.target.checked
              }))}
              className="mr-2"
            />
            <div>
              <span className="text-sm font-medium">Keep personality traits</span>
              <p className="text-xs text-gray-500">
                Start with your personality from the original playthrough
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Story Information */}
      {storyRun.ending_title && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-sm mb-1">Original Ending</h5>
          <p className="text-sm text-gray-700">{storyRun.ending_title}</p>
          {storyRun.ending_rarity && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              storyRun.ending_rarity === 'ultra-rare' ? 'bg-purple-100 text-purple-800' :
              storyRun.ending_rarity === 'rare' ? 'bg-yellow-100 text-yellow-800' :
              storyRun.ending_rarity === 'uncommon' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {storyRun.ending_rarity === 'ultra-rare' ? '💎' :
               storyRun.ending_rarity === 'rare' ? '⭐' :
               storyRun.ending_rarity === 'uncommon' ? '🔹' : '⚪'
              }
              <span className="ml-1 capitalize">
                {storyRun.ending_rarity.replace('_', ' ')}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleStartReplay}
          disabled={isStartingReplay || isQuickRestarting}
          className="flex items-center"
        >
          {isStartingReplay ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Starting Replay...
            </>
          ) : (
            <>
              <span className="mr-2">▶️</span>
              Start Replay
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

interface QuickReplayButtonProps {
  storyRunId: string
  onReplayStarted?: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function QuickReplayButton({ 
  storyRunId, 
  onReplayStarted, 
  disabled,
  size = 'md' 
}: QuickReplayButtonProps) {
  const { quickRestart, isQuickRestarting } = useSaveReplay({
    onReplayStarted: () => onReplayStarted?.()
  })

  const handleQuickReplay = () => {
    quickRestart(storyRunId)
  }

  return (
    <Button
      size={size}
      onClick={handleQuickReplay}
      disabled={disabled || isQuickRestarting}
      className="flex items-center"
    >
      {isQuickRestarting ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
          {size === 'sm' ? 'Starting...' : 'Starting Replay...'}
        </>
      ) : (
        <>
          <span className="mr-1">🔄</span>
          {size === 'sm' ? 'Replay' : 'Play Again'}
        </>
      )}
    </Button>
  )
}