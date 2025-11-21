/**
 * Send OTP API Route
 *
 * Sends verification code via Twilio Verify
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendOTPCode } from '@/lib/sms-provider'
import { toE164 } from '@/lib/phone-utils'

export async function POST(req: NextRequest) {
  console.log('=== SEND OTP REQUEST START ===')
  try {
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))

    const { phoneNumber } = body

    if (!phoneNumber) {
      console.log('ERROR: Phone number is missing')
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    console.log('Raw phone number:', phoneNumber)

    // Convert to E.164 format
    const formattedPhone = toE164(phoneNumber)
    console.log('Formatted phone (E.164):', formattedPhone)

    // Check environment variables
    console.log('Twilio Account SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...')
    console.log('Twilio Auth Token exists:', !!process.env.TWILIO_AUTH_TOKEN)
    console.log('Twilio Verify Service SID:', process.env.TWILIO_VERIFY_SERVICE_SID)

    // Send OTP via Twilio Verify
    console.log('Calling sendOTPCode...')
    await sendOTPCode(formattedPhone)
    console.log('sendOTPCode completed successfully')

    console.log('=== SEND OTP REQUEST SUCCESS ===')
    return NextResponse.json({
      success: true,
      message: 'Verification code sent'
    })
  } catch (error: any) {
    console.error('=== SEND OTP REQUEST FAILED ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)
    console.error('Full error:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
