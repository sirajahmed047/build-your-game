'use client'

import { Clock, Crown, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { formatTimeUntilReset } from '@/lib/subscription/subscription-utils'

interface UsageLimitsDisplayProps {
  onUpgradeClick?: () => void
  compact?: boolean
}

export function UsageLimitsDisplay({ onUpgradeClick, compact = false }: UsageLimitsDisplayProps) {
  const { status, usageLimits, isPremium, loading } = useSubscription()

  if (loading || !usageLimits) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </Card>
    )
  }

  const progressPercentage = (usageLimits.storiesUsedToday / usageLimits.dailyLimit) * 100
  const isNearLimit = progressPercentage >= 80
  const hasReachedLimit = usageLimits.remainingStories <= 0

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          {isPremium ? (
            <Crown className="w-4 h-4 text-yellow-500" />
          ) : (
            <Clock className="w-4 h-4 text-gray-500" />
          )}
          <span className={`font-medium ${hasReachedLimit ? 'text-red-600' : 'text-gray-700'}`}>
            {usageLimits.remainingStories} left today
          </span>
        </div>
        {!isPremium && hasReachedLimit && (
          <Button
            size="sm"
            onClick={onUpgradeClick}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs px-2 py-1"
          >
            Upgrade
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isPremium ? (
            <Crown className="w-5 h-5 text-yellow-500" />
          ) : (
            <Clock className="w-5 h-5 text-gray-500" />
          )}
          <h3 className="font-semibold text-gray-900">
            {isPremium ? 'Premium Account' : 'Daily Stories'}
          </h3>
        </div>
        {isPremium && (
          <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-2 py-1 rounded-full font-medium">
            Premium
          </span>
        )}
      </div>

      {isPremium ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Unlimited stories • Premium genres • Extended length
          </p>
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <Zap className="w-4 h-4" />
            <span>All features unlocked</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Stories used today</span>
              <span className={`font-medium ${hasReachedLimit ? 'text-red-600' : 'text-gray-900'}`}>
                {usageLimits.storiesUsedToday} / {usageLimits.dailyLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  hasReachedLimit
                    ? 'bg-red-500'
                    : isNearLimit
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Status message */}
          <div className="text-sm">
            {hasReachedLimit ? (
              <div className="text-red-600">
                <p className="font-medium">Daily limit reached</p>
                <p>Resets in {formatTimeUntilReset(usageLimits.resetTime)}</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <p>{usageLimits.remainingStories} stories remaining</p>
                <p>Resets in {formatTimeUntilReset(usageLimits.resetTime)}</p>
              </div>
            )}
          </div>

          {/* Upgrade button */}
          {(hasReachedLimit || isNearLimit) && (
            <Button
              onClick={onUpgradeClick}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="sm"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade for Unlimited Stories
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default UsageLimitsDisplay