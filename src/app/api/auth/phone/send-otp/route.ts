/**
 * Send OTP API Route
 *
 * Sends verification code via Twilio Verify
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendOTPCode } from '@/lib/sms-provider'
import { toE164 } from '@/lib/phone-utils'

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Convert to E.164 format
    const formattedPhone = toE164(phoneNumber)

    // Send OTP via Twilio Verify
    await sendOTPCode(formattedPhone)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent'
    })
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
