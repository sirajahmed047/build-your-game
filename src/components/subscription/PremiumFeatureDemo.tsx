'use client'

import { useState } from 'react'
import { Crown, Lock, Zap, BarChart3, Clock, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useSubscription } from '@/lib/hooks/useSubscription'
import PaywallModal from './PaywallModal'

interface PremiumFeatureDemoProps {
  onUpgradeClick?: () => void
}

export function PremiumFeatureDemo({ onUpgradeClick }: PremiumFeatureDemoProps) {
  const { isPremium, usageLimits, status } = useSubscription()
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallTrigger, setPaywallTrigger] = useState<'daily_limit' | 'premium_genre' | 'extended_length' | 'advanced_analytics'>('premium_genre')
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  const features = [
    {
      id: 'extended_length',
      name: 'Extended Stories',
      description: 'Immersive 45-minute narratives with deeper character development',
      icon: Clock,
      premium: true,
      demo: {
        title: 'Extended Fantasy Adventure',
        content: 'Experience rich, detailed storytelling with 12-18 decision points, complex character relationships, and multiple story arcs that weave together for an epic conclusion.',
        stats: '45 min • 15+ choices • Deep character development'
      }
    },
    {
      id: 'premium_genres',
      name: 'Premium Genres',
      description: 'Horror, Romance, and Thriller stories exclusively for premium users',
      icon: Star,
      premium: true,
      demo: {
        title: 'Horror: The Haunted Manor',
        content: 'A psychological horror experience that builds tension through atmospheric storytelling, supernatural encounters, and choices that determine your sanity.',
        stats: 'Horror • Psychological tension • Multiple endings'
      }
    },
    {
      id: 'advanced_analytics',
      name: 'Advanced Analytics',
      description: 'Detailed personality insights, choice pattern analysis, and global comparisons',
      icon: BarChart3,
      premium: true,
      demo: {
        title: 'Personality Evolution Tracking',
        content: 'See how your personality traits change over time, analyze your decision patterns, and compare your choices with global statistics.',
        stats: 'Trait evolution • Pattern analysis • Global comparison'
      }
    },
    {
      id: 'unlimited_stories',
      name: 'Unlimited Stories',
      description: 'No daily limits - create as many stories as you want',
      icon: Zap,
      premium: true,
      demo: {
        title: 'Unlimited Creative Freedom',
        content: 'Generate unlimited stories across all genres without waiting for daily resets. Perfect for exploring different narrative paths.',
        stats: '100 stories/day • No waiting • All genres'
      }
    }
  ]

  const handleFeatureClick = (feature: any) => {
    if (feature.premium && !isPremium) {
      setPaywallTrigger(feature.id === 'premium_genres' ? 'premium_genre' : 
                       feature.id === 'extended_length' ? 'extended_length' :
                       feature.id === 'advanced_analytics' ? 'advanced_analytics' : 'daily_limit')
      setPaywallOpen(true)
      return
    }
    
    setSelectedFeature(selectedFeature === feature.id ? null : feature.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Features</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Unlock the full potential of interactive storytelling with advanced features designed for serious story enthusiasts.
        </p>
      </div>

      {/* Current Status */}
      {isPremium ? (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Premium Active</h3>
                <p className="text-sm text-gray-600">All features unlocked</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">$9.99/month</div>
              <div className="text-xs text-gray-600">Next billing: Jan 15</div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Free Tier</h3>
                <p className="text-sm text-gray-600">
                  {usageLimits ? `${usageLimits.remainingStories} stories remaining today` : 'Limited features'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setPaywallOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </Card>
      )}

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const IconComponent = feature.icon
          const isSelected = selectedFeature === feature.id
          const hasAccess = !feature.premium || isPremium

          return (
            <Card 
              key={feature.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-md'
              } ${!hasAccess ? 'opacity-75' : ''}`}
              onClick={() => handleFeatureClick(feature)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      hasAccess 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                        : 'bg-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                      {feature.premium && !isPremium && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Lock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Premium Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {hasAccess && (
                    <div className="text-green-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>

                {/* Demo Content */}
                {isSelected && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{feature.demo.title}</h4>
                    <p className="text-sm text-gray-700 mb-3">{feature.demo.content}</p>
                    <div className="text-xs text-gray-500 font-medium">{feature.demo.stats}</div>
                  </div>
                )}

                {!hasAccess && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-800">Try Premium</span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFeatureClick(feature)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
                      >
                        Unlock
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Comparison Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                <td className="py-3 px-4 text-gray-700">Story Length</td>
                <td className="py-3 px-4 text-center">15-30 min</td>
                <td className="py-3 px-4 text-center">15-45 min</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Genres</td>
                <td className="py-3 px-4 text-center">3 core</td>
                <td className="py-3 px-4 text-center">6 total</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Analytics</td>
                <td className="py-3 px-4 text-center">Basic</td>
                <td className="py-3 px-4 text-center">Advanced</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Support</td>
                <td className="py-3 px-4 text-center">Community</td>
                <td className="py-3 px-4 text-center">Priority</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Testimonials */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What Premium Users Say</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              &ldquo;The extended stories are incredible! The depth and character development you get in 45 minutes is amazing.&rdquo;
            </p>
            <p className="text-xs text-gray-500">- Sarah M., Premium User</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              &ldquo;The horror stories are genuinely scary! And the analytics help me understand my decision-making patterns.&rdquo;
            </p>
            <p className="text-xs text-gray-500">- Mike R., Premium User</p>
          </div>
        </div>
      </Card>

      {/* CTA */}
      {!isPremium && (
        <Card className="p-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h3 className="text-xl font-bold mb-2">Ready to Unlock Premium?</h3>
          <p className="mb-4 opacity-90">
            Join thousands of storytellers enjoying unlimited creative freedom
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <div className="text-2xl font-bold">$9.99/month</div>
            <Button
              onClick={() => setPaywallOpen(true)}
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 py-2"
            >
              <Crown className="w-4 h-4 mr-2" />
              Start Premium Trial
            </Button>
          </div>
          <p className="text-xs mt-2 opacity-75">Cancel anytime • 30-day money-back guarantee</p>
        </Card>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger={paywallTrigger}
      />
    </div>
  )
}

export default PremiumFeatureDemo