/**
 * Send OTP API Route
 *
 * Sends verification code via Twilio Verify
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendOTPCode } from '@/lib/sms-provider'
import { toE164 } from '@/lib/phone-utils'
import { consumeRateLimit, requestIp } from '@/lib/request-rate-limit'
import { getDb } from '@/db'
import { user as userSchema } from '@/db/schema/auth_user'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => null)
    const phoneNumber = body && typeof body === 'object' && 'phoneNumber' in body
      ? (body as { phoneNumber?: unknown }).phoneNumber
      : null

    if (typeof phoneNumber !== 'string' || phoneNumber.length > 32) {
      return NextResponse.json(
        { error: 'A valid phone number is required' },
        { status: 400 }
      )
    }

    // Convert to E.164 format
    const formattedPhone = toE164(phoneNumber)

    const [ipLimit, phoneLimit] = await Promise.all([
      consumeRateLimit({
        scope: 'otp-send-ip',
        identity: requestIp(req.headers),
        limit: 5,
        windowMs: 15 * 60 * 1_000,
      }),
      consumeRateLimit({
        scope: 'otp-send-phone',
        identity: formattedPhone,
        limit: 3,
        windowMs: 15 * 60 * 1_000,
      }),
    ])
    const blocked = !ipLimit.allowed ? ipLimit : !phoneLimit.allowed ? phoneLimit : null
    if (blocked) {
      return NextResponse.json(
        { error: 'Too many verification requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': String(blocked.retryAfterSeconds),
          },
        }
      )
    }

    // Phone auth is the admin login mechanism, not a public customer signup.
    // Return the same response for unknown numbers to avoid account discovery,
    // but do not spend a Twilio verification on them.
    const db = getDb()
    const [adminUser] = await db
      .select({ adminRole: userSchema.adminRole, damAccess: userSchema.damAccess })
      .from(userSchema)
      .where(eq(userSchema.phoneNumber, formattedPhone))
      .limit(1)
    if (!adminUser?.adminRole && !adminUser?.damAccess) {
      return NextResponse.json({
        success: true,
        message: 'If this number is authorized, a verification code was sent',
      }, {
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    // Send OTP via Twilio Verify
    await sendOTPCode(formattedPhone)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent'
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error: unknown) {
    console.error('Send OTP failed', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    )
  }
}
