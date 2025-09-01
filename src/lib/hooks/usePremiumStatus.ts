import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'

interface PremiumStatus {
  isActive: boolean
  expiresAt: Date | null
  daysRemaining: number
  packageType: string | null
  purchaseDate: Date | null
}

interface PremiumPurchase {
  id: string
  amount: number
  currency: string
  status: string
  is_lifetime: boolean
  purchase_date: string
  paypal_order_id: string
}

// Package type to days mapping
const PACKAGE_DAYS = {
  starter_30: 30,
  popular_60: 60,
  value_120: 120
} as const

export function usePremiumStatus() {
  const { user } = useAuth()
  const [status, setStatus] = useState<PremiumStatus>({
    isActive: false,
    expiresAt: null,
    daysRemaining: 0,
    packageType: null,
    purchaseDate: null
  })
  const [loading, setLoading] = useState(true)

  const checkPremiumStatus = async () => {
    if (!user) {
      setStatus({
        isActive: false,
        expiresAt: null,
        daysRemaining: 0,
        packageType: null,
        purchaseDate: null
      })
      setLoading(false)
      return
    }

    try {
      // Get the latest completed purchase for this user
      const { data: purchases, error } = await supabase
        .from('premium_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching premium status:', error)
        setLoading(false)
        return
      }

      if (!purchases || purchases.length === 0) {
        setStatus({
          isActive: false,
          expiresAt: null,
          daysRemaining: 0,
          packageType: null,
          purchaseDate: null
        })
        setLoading(false)
        return
      }

      const latestPurchase = purchases[0]
      const expiresAt = new Date(latestPurchase.expires_at)
      const purchaseDate = new Date(latestPurchase.created_at || '')
      
      const now = new Date()
      const isActive = expiresAt > now
      const daysRemaining = isActive 
        ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      setStatus({
        isActive,
        expiresAt: isActive ? expiresAt : null,
        daysRemaining,
        packageType: latestPurchase.package_type,
        purchaseDate
      })

    } catch (error) {
      console.error('Error checking premium status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkPremiumStatus()
  }, [user])

  const refreshStatus = () => {
    setLoading(true)
    checkPremiumStatus()
  }

  return {
    ...status,
    loading,
    refreshStatus
  }
}

export default usePremiumStatus
