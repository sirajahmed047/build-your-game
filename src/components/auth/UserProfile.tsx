'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthProvider'
import { UserProfileQueries } from '@/lib/supabase/queries'
import type { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export function UserProfile() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const userProfile = await UserProfileQueries.getOrCreate(user.id)
      setProfile(userProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user, loadProfile])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out')
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
        <button
          onClick={loadProfile}
          className="mt-3 text-blue-600 hover:text-blue-500 text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Sign Out
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="text-gray-900">{user.email}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Subscription</label>
          <p className="text-gray-900 capitalize">
            {profile?.subscription_tier || 'free'}
            {profile?.subscription_tier === 'free' && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Free Tier
              </span>
            )}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Stories Completed</label>
          <p className="text-gray-900">{profile?.total_choices || 0} choices made</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Member Since</label>
          <p className="text-gray-900">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>

      {profile?.subscription_tier === 'free' && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-md border border-purple-200">
          <h4 className="text-sm font-medium text-purple-900 mb-1">Upgrade to Premium</h4>
          <p className="text-xs text-purple-700 mb-2">
            Unlock longer stories, exclusive genres, and advanced personality insights
          </p>
          <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
            Learn More
          </button>
        </div>
      )}
    </div>
  )
}