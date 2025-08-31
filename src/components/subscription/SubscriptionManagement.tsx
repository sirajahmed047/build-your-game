'use client'

import { useState } from 'react'
import { Crown, Check, X, CreditCard, Calendar, Zap, BarChart3, HeadphonesIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useAuth } from '@/components/auth/AuthProvider'
import { getPremiumFeaturesList, formatTimeUntilReset } from '@/lib/subscription/subscription-utils'

export function SubscriptionManagement() {
  const { user } = useAuth()
  const { status, usageLimits, isPremium, upgrade, downgrade, loading } = useSubscription()
  const [actionLoading, setActionLoading] = useState<'upgrade' | 'downgrade' | null>(null)

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
        <p className="text-gray-600">Please sign in to manage your subscription.</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </Card>
      </div>
    )
  }

  const handleUpgrade = async () => {
    try {
      setActionLoading('upgrade')
      await upgrade()
      alert('Successfully upgraded to Premium! All features are now available.')
    } catch (error) {
      console.error('Upgrade failed:', error)
      alert('Upgrade failed. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDowngrade = async () => {
    if (!confirm('Are you sure you want to downgrade to the free tier? You will lose access to premium features.')) {
      return
    }

    try {
      setActionLoading('downgrade')
      await downgrade()
      alert('Successfully downgraded to free tier.')
    } catch (error) {
      console.error('Downgrade failed:', error)
      alert('Downgrade failed. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const premiumFeatures = getPremiumFeaturesList()

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className={`p-6 ${isPremium ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isPremium ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-500'}`}>
              {isPremium ? (
                <Crown className="w-6 h-6 text-white" />
              ) : (
                <Clock className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </h2>
              <p className="text-sm text-gray-600">
                {isPremium ? 'All features unlocked' : 'Basic features included'}
              </p>
            </div>
          </div>
          {isPremium && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">$9.99</div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        {usageLimits && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Usage This Month</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">{usageLimits.storiesUsedToday}</div>
                <div className="text-sm text-gray-600">Stories today</div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">{usageLimits.dailyLimit}</div>
                <div className="text-sm text-gray-600">Daily limit</div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTimeUntilReset(usageLimits.resetTime)}
                </div>
                <div className="text-sm text-gray-600">Until reset</div>
              </div>
            </div>
          </div>
        )}

        {/* Plan Actions */}
        <div className="flex space-x-3">
          {isPremium ? (
            <Button
              onClick={handleDowngrade}
              disabled={actionLoading === 'downgrade'}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              {actionLoading === 'downgrade' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <span>Downgrading...</span>
                </div>
              ) : (
                'Downgrade to Free'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleUpgrade}
              disabled={actionLoading === 'upgrade'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {actionLoading === 'upgrade' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Upgrading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Premium</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Feature Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Feature Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Feature</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Free</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 px-4 text-gray-700">Daily Stories</td>
                <td className="py-3 px-4 text-center">10</td>
                <td className="py-3 px-4 text-center">100</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Core Genres</td>
                <td className="py-3 px-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Premium Genres (Horror, Romance, Thriller)</td>
                <td className="py-3 px-4 text-center">
                  <X className="w-5 h-5 text-red-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Extended Story Length</td>
                <td className="py-3 px-4 text-center">
                  <X className="w-5 h-5 text-red-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Advanced Analytics</td>
                <td className="py-3 px-4 text-center">
                  <X className="w-5 h-5 text-red-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Priority Support</td>
                <td className="py-3 px-4 text-center">
                  <X className="w-5 h-5 text-red-500 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Premium Benefits */}
      {!isPremium && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Premium Features</h3>
            <p className="text-gray-600">Get the most out of your storytelling experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { icon: Zap, title: 'Extended Stories', desc: 'Up to 45-minute immersive narratives' },
              { icon: Crown, title: 'Premium Genres', desc: 'Horror, Romance, and Thriller stories' },
              { icon: BarChart3, title: 'Advanced Analytics', desc: 'Detailed personality insights' },
              { icon: HeadphonesIcon, title: 'Priority Support', desc: 'Get help when you need it' }
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 bg-white bg-opacity-50 rounded-lg p-4">
                <feature.icon className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={handleUpgrade}
              disabled={actionLoading === 'upgrade'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
            >
              {actionLoading === 'upgrade' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Upgrading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5" />
                  <span>Upgrade for $9.99/month</span>
                </div>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2">Cancel anytime • 30-day money-back guarantee</p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SubscriptionManagement