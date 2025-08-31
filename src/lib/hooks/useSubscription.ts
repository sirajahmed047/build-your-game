import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getSubscriptionStatus,
  getUsageLimits,
  canAccessPremiumContent,
  canUseExtendedLength,
  canAccessGenre,
  hasReachedDailyLimit,
  upgradeToPremium,
  downgradeToFree,
  type SubscriptionStatus,
  type UsageLimits
} from '@/lib/subscription/subscription-utils'

export function useSubscription() {
  const { user } = useAuth()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSubscriptionData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const [subscriptionStatus, limits] = await Promise.all([
        getSubscriptionStatus(user.id),
        getUsageLimits(user.id)
      ])

      setStatus(subscriptionStatus)
      setUsageLimits(limits)
    } catch (err) {
      console.error('Error loading subscription data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const refreshUsageLimits = async () => {
    if (!user) return

    try {
      const limits = await getUsageLimits(user.id)
      setUsageLimits(limits)
    } catch (err) {
      console.error('Error refreshing usage limits:', err)
    }
  }

  const checkPremiumAccess = async (): Promise<boolean> => {
    if (!user) return false
    return canAccessPremiumContent(user.id)
  }

  const checkExtendedLength = async (): Promise<boolean> => {
    if (!user) return false
    return canUseExtendedLength(user.id)
  }

  const checkGenreAccess = async (genre: string): Promise<boolean> => {
    if (!user) return false
    return canAccessGenre(user.id, genre)
  }

  const checkDailyLimit = async (): Promise<boolean> => {
    if (!user) return true
    return hasReachedDailyLimit(user.id)
  }

  const upgrade = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      await upgradeToPremium(user.id)
      await loadSubscriptionData() // Refresh data
    } catch (err) {
      console.error('Error upgrading subscription:', err)
      throw err
    }
  }

  const downgrade = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      await downgradeToFree(user.id)
      await loadSubscriptionData() // Refresh data
    } catch (err) {
      console.error('Error downgrading subscription:', err)
      throw err
    }
  }

  return {
    status,
    usageLimits,
    loading,
    error,
    isPremium: status?.tier === 'premium',
    isActive: status?.isActive ?? false,
    features: status?.features,
    refreshUsageLimits,
    checkPremiumAccess,
    checkExtendedLength,
    checkGenreAccess,
    checkDailyLimit,
    upgrade,
    downgrade,
    reload: loadSubscriptionData
  }
}

export function useUsageLimits() {
  const { user } = useAuth()
  const [limits, setLimits] = useState<UsageLimits | null>(null)
  const [loading, setLoading] = useState(true)

  const loadLimits = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const usageLimits = await getUsageLimits(user.id)
      setLimits(usageLimits)
    } catch (err) {
      console.error('Error loading usage limits:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setLimits(null)
      setLoading(false)
      return
    }

    loadLimits()
  }, [user, loadLimits])

  const refresh = async () => {
    await loadLimits()
  }

  return {
    limits,
    loading,
    refresh,
    hasReachedLimit: limits ? limits.remainingStories <= 0 : false,
    remainingStories: limits?.remainingStories ?? 0
  }
}