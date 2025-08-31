'use client'

import { useState } from 'react'
import { X, Crown, Zap, BarChart3, HeadphonesIcon, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { getPremiumFeaturesList, formatTimeUntilReset } from '@/lib/subscription/subscription-utils'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  trigger: 'daily_limit' | 'premium_genre' | 'extended_length' | 'advanced_analytics'
  genre?: string
}

const TRIGGER_MESSAGES = {
  daily_limit: {
    title: 'Daily Story Limit Reached',
    description: 'You\'ve used all your free stories for today. Upgrade to premium for unlimited stories!',
    icon: Clock
  },
  premium_genre: {
    title: 'Premium Genre',
    description: 'This genre is available exclusively for premium subscribers.',
    icon: Crown
  },
  extended_length: {
    title: 'Extended Stories',
    description: 'Longer, more immersive stories are a premium feature.',
    icon: Sparkles
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    description: 'Detailed personality insights and analytics are available with premium.',
    icon: BarChart3
  }
}

export function PaywallModal({ isOpen, onClose, trigger, genre }: PaywallModalProps) {
  const { upgrade, usageLimits, loading } = useSubscription()
  const [upgrading, setUpgrading] = useState(false)

  if (!isOpen) return null

  const triggerInfo = TRIGGER_MESSAGES[trigger]
  const IconComponent = triggerInfo.icon

  const handleUpgrade = async () => {
    try {
      setUpgrading(true)
      await upgrade()
      onClose()
      // In a real app, this would redirect to payment processor
      alert('Upgrade successful! Premium features are now available.')
    } catch (error) {
      console.error('Upgrade failed:', error)
      alert('Upgrade failed. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  const premiumFeatures = getPremiumFeaturesList()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{triggerInfo.title}</h2>
                {genre && (
                  <p className="text-sm text-gray-600 capitalize">{genre} stories</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6">{triggerInfo.description}</p>

          {/* Usage info for daily limit */}
          {trigger === 'daily_limit' && usageLimits && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Daily Usage</span>
              </div>
              <p className="text-sm text-orange-700">
                You&apos;ve used {usageLimits.storiesUsedToday} of {usageLimits.dailyLimit} free stories today.
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Resets in {formatTimeUntilReset(usageLimits.resetTime)}
              </p>
            </div>
          )}

          {/* Premium features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Crown className="w-5 h-5 text-yellow-500 mr-2" />
              Premium Features
            </h3>
            <ul className="space-y-2">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">$9.99</div>
              <div className="text-sm text-gray-600">per month</div>
              <div className="text-xs text-green-600 mt-1">Cancel anytime</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              disabled={upgrading || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
            >
              {upgrading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Upgrading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Crown className="w-5 h-5" />
                  <span>Upgrade to Premium</span>
                </div>
              )}
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Secure payment • Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PaywallModal