import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// PayPal API base URL
const PAYPAL_API_BASE = process.env.PAYPAL_ENVIRONMENT === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

// Premium packages configuration
const PREMIUM_PACKAGES = {
  starter_30: { days: 30 },
  popular_60: { days: 60 },
  value_120: { days: 120 }
} as const

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, packageType, userId } = await request.json()

    if (!orderId || !packageType || !userId) {
      return NextResponse.json(
        { error: 'Order ID, package type, and user ID are required' },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    // Capture the PayPal payment
    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text()
      console.error('PayPal capture failed:', errorData)
      throw new Error('Failed to capture PayPal payment')
    }

    const captureData = await captureResponse.json()
    
    if (captureData.status !== 'COMPLETED') {
      throw new Error('Payment capture was not completed')
    }

    // Get package details
    const pkg = PREMIUM_PACKAGES[packageType as keyof typeof PREMIUM_PACKAGES]
    if (!pkg) {
      throw new Error('Invalid package type')
    }

    // Calculate premium expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + pkg.days)

    // Update the premium purchase record
    const { error: updateError } = await supabase
      .from('premium_purchases')
      .update({
        payment_status: 'completed',
        paypal_capture_id: captureData.id,
        updated_at: new Date().toISOString()
      })
      .eq('paypal_order_id', orderId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update purchase record')
    }

    // Activate premium access using the database function
    const { error: activationError } = await supabase.rpc('activate_premium', {
      user_uuid: userId,
      days: pkg.days,
      payment_uuid: orderId // We'll use order ID as reference
    })

    if (activationError) {
      console.error('Premium activation error:', activationError)
      // Don't throw here as payment is already captured
    }

    // Calculate expiry for response
    const premiumExpiresAt = new Date()
    premiumExpiresAt.setDate(premiumExpiresAt.getDate() + pkg.days)

    return NextResponse.json({
      success: true,
      paymentId: captureData.id,
      expiresAt: premiumExpiresAt.toISOString(),
      message: `Premium activated for ${pkg.days} days!`
    })

  } catch (error) {
    console.error('Capture payment error:', error)
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
