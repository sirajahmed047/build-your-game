import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// PayPal API base URL
const PAYPAL_API_BASE = process.env.PAYPAL_ENVIRONMENT === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

// Premium packages configuration
const PREMIUM_PACKAGES = {
  starter_30: {
    price: 3.00,
    days: 30,
    name: 'Starter Package',
    description: '30 days of premium access'
  },
  popular_60: {
    price: 5.00,
    days: 60,
    name: 'Popular Package',
    description: '60 days of premium access'
  },
  value_120: {
    price: 8.00,
    days: 120,
    name: 'Best Value Package',
    description: '120 days of premium access'
  }
} as const

type PackageType = keyof typeof PREMIUM_PACKAGES

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
    const { packageType, userId } = await request.json()

    if (!packageType || !userId) {
      return NextResponse.json(
        { error: 'Package type and user ID are required' },
        { status: 400 }
      )
    }

    if (!(packageType in PREMIUM_PACKAGES)) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      )
    }

    const pkg = PREMIUM_PACKAGES[packageType as PackageType]
    const accessToken = await getPayPalAccessToken()

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: pkg.price.toFixed(2)
            },
            description: pkg.description,
            custom_id: `${userId}_${packageType}_${Date.now()}`
          }
        ],
        application_context: {
          brand_name: 'Interactive Story Generator',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`
        }
      })
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text()
      console.error('PayPal order creation failed:', errorData)
      throw new Error('Failed to create PayPal order')
    }

    const orderData = await orderResponse.json()

    // Store pending purchase in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + pkg.days)

    const { error: dbError } = await supabase
      .from('premium_purchases')
      .insert({
        user_id: userId,
        payment_id: orderData.id,
        package_type: packageType,
        days_purchased: pkg.days,
        amount_paid: pkg.price,
        currency: 'USD',
        payment_status: 'pending',
        paypal_order_id: orderData.id,
        expires_at: expiresAt.toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to store purchase record')
    }

    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl: orderData.links.find((link: any) => link.rel === 'approve')?.href
    })

  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
