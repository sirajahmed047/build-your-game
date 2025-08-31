'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { UserProfile } from '@/components/auth/UserProfile'
import { AuthButton } from '@/components/auth/AuthButton'
import { EndingsGallery } from '@/components/endings/EndingsGallery'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { PersonalityInsights } from '@/components/dashboard/PersonalityInsights'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PremiumAnalytics, SubscriptionManagement, PaywallModal } from '@/components/subscription'
import { useSubscription } from '@/lib/hooks/useSubscription'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { isPremium } = useSubscription()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'personality' | 'endings' | 'analytics' | 'subscription'>('overview')
  const [userStats, setUserStats] = useState<any>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)

  // Set initial tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'endings') {
      setActiveTab('endings')
    } else if (tab === 'personality') {
      setActiveTab('personality')
    } else if (tab === 'analytics') {
      setActiveTab('analytics')
    } else if (tab === 'subscription') {
      setActiveTab('subscription')
    }
  }, [searchParams])

  const handleAnalyticsClick = () => {
    if (isPremium) {
      setActiveTab('analytics')
    } else {
      setPaywallOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard</h2>
            <p className="text-gray-600 mb-6">
              Sign in to access your story history, personality insights, and collection progress.
            </p>
            <div className="space-y-3">
              <AuthButton mode="signin" className="w-full">
                Sign In
              </AuthButton>
              <AuthButton mode="signup" variant="secondary" className="w-full">
                Create Account
              </AuthButton>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here&apos;s your story journey overview.
          </p>
          
          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('personality')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'personality'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Personality
              </button>
              <button
                onClick={() => setActiveTab('endings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'endings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Endings Collection
              </button>
              <button
                onClick={handleAnalyticsClick}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center space-x-1 ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>Analytics</span>
                {!isPremium && (
                  <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'subscription'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subscription
              </button>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Profile */}
              <div className="lg:col-span-1">
                <UserProfile />
              </div>

              {/* Dashboard Stats */}
              <div className="lg:col-span-2">
                <DashboardStats onStatsLoaded={setUserStats} />
              </div>
            </div>
          )}

          {activeTab === 'personality' && (
            <div className="max-w-4xl mx-auto">
              {userStats?.totalChoices > 0 ? (
                <PersonalityInsights
                  traits={{
                    riskTaking: 65,
                    empathy: 78,
                    pragmatism: 45,
                    creativity: 82,
                    leadership: 56
                  }}
                  totalChoices={userStats.totalChoices}
                  userId={user.id}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="mb-6">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Personality Profile</h3>
                    <p className="text-gray-600 mb-6">
                      Complete stories to discover your unique personality traits and decision-making patterns.
                    </p>
                    <Link href="/story-demo">
                      <Button>Start Your First Story</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'endings' && (
            <EndingsGallery />
          )}

          {activeTab === 'analytics' && (
            <div className="max-w-4xl mx-auto">
              <PremiumAnalytics 
                onUpgradeClick={() => setPaywallOpen(true)}
              />
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="max-w-4xl mx-auto">
              <SubscriptionManagement />
            </div>
          )}
        </div>

        {/* Paywall Modal */}
        <PaywallModal
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          trigger="advanced_analytics"
        />
      </div>
    </div>
  )
}