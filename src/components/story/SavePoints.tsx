'use client'

import { useState } from 'react'
import { useSaveReplay } from '@/lib/hooks/useSaveReplay'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { SavePoint } from '@/lib/story/save-replay'

interface SavePointsProps {
  storyRunId: string
  onRestoreProgress?: (savePoint: SavePoint) => void
  onClose?: () => void
}

export function SavePoints({ storyRunId, onRestoreProgress, onClose }: SavePointsProps) {
  const [selectedSavePoint, setSelectedSavePoint] = useState<SavePoint | null>(null)
  
  const {
    savePoints,
    isLoadingSavePoints,
    restoreProgress,
    isRestoringProgress
  } = useSaveReplay({
    onProgressRestored: (session) => {
      const savePoint = savePoints.find(sp => sp.stepNumber === session.currentStep?.step_number)
      if (savePoint) {
        onRestoreProgress?.(savePoint)
      }
      onClose?.()
    }
  })

  const handleRestoreProgress = (savePoint: SavePoint) => {
    setSelectedSavePoint(savePoint)
    restoreProgress(savePoint.storyRunId, savePoint.stepNumber)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (isLoadingSavePoints) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading save points...</span>
        </div>
      </Card>
    )
  }

  if (savePoints.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <h3 className="text-lg font-semibold mb-2">No Save Points</h3>
          <p>Your progress will be automatically saved as you play.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Save Points</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {savePoints.map((savePoint) => (
          <div
            key={savePoint.id}
            className={`p-4 border rounded-lg transition-colors ${
              selectedSavePoint?.id === savePoint.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Step {savePoint.stepNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(savePoint.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                  {savePoint.description}
                </p>
                
                {savePoint.availableChoices.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {savePoint.availableChoices.length} choice{savePoint.availableChoices.length !== 1 ? 's' : ''} available
                  </div>
                )}
              </div>
              
              <Button
                size="sm"
                onClick={() => handleRestoreProgress(savePoint)}
                disabled={isRestoringProgress}
                className="ml-3"
              >
                {isRestoringProgress && selectedSavePoint?.id === savePoint.id ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Loading...
                  </div>
                ) : (
                  'Load'
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        💡 Tip: Your progress is automatically saved at each decision point
      </div>
    </Card>
  )
}

interface SavePointIndicatorProps {
  stepNumber: number
  isCurrentStep?: boolean
  onClick?: () => void
}

export function SavePointIndicator({ stepNumber, isCurrentStep, onClick }: SavePointIndicatorProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
        isCurrentStep
          ? 'bg-green-100 text-green-800 border border-green-300'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={isCurrentStep ? 'Current position' : `Load from step ${stepNumber}`}
    >
      <span className="mr-1">💾</span>
      Step {stepNumber}
      {isCurrentStep && <span className="ml-1">📍</span>}
    </button>
  )
}