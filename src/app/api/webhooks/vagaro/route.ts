import { NextRequest, NextResponse } from 'next/server'

/**
 * Vagaro Webhook Endpoint
 *
 * This endpoint receives webhook events from Vagaro.
 * The Business ID will be included in the webhook payload.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🎣 Vagaro Webhook Received!')
    console.log('📦 Full Payload:', JSON.stringify(body, null, 2))

    // Extract Business ID if present
    if (body.businessId) {
      console.log('🎯 BUSINESS ID FOUND:', body.businessId)
      console.log('\n💾 Add this to your .env.local:')
      console.log(`VAGARO_BUSINESS_ID=${body.businessId}`)
    }

    // Extract Customer ID if present
    if (body.customerId) {
      console.log('👤 Customer ID:', body.customerId)
    }

    // Log event type
    if (body.eventType) {
      console.log('📌 Event Type:', body.eventType)
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Also handle GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Vagaro webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
