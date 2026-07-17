/**
 * Verify OTP API Route
 *
 * Verifies OTP code and creates/updates user session
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyOTPCode } from '@/lib/sms-provider'
import { toE164 } from '@/lib/phone-utils'
import { getDb } from '@/db'
import { user as userSchema } from '@/db/schema/auth_user'
import { session as sessionSchema } from '@/db/schema/auth_session'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { consumeRateLimit, requestIp } from '@/lib/request-rate-limit'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => null)
    const phoneNumber = body && typeof body === 'object' && 'phoneNumber' in body
      ? (body as { phoneNumber?: unknown }).phoneNumber
      : null
    const otp = body && typeof body === 'object' && 'otp' in body
      ? (body as { otp?: unknown }).otp
      : null

    if (
      typeof phoneNumber !== 'string' || phoneNumber.length > 32 ||
      typeof otp !== 'string' || !/^\d{4,10}$/.test(otp)
    ) {
      return NextResponse.json(
        { error: 'A valid phone number and verification code are required' },
        { status: 400 }
      )
    }

    // Convert to E.164 format
    const formattedPhone = toE164(phoneNumber)

    const [ipLimit, phoneLimit] = await Promise.all([
      consumeRateLimit({
        scope: 'otp-verify-ip',
        identity: requestIp(req.headers),
        limit: 15,
        windowMs: 15 * 60 * 1_000,
      }),
      consumeRateLimit({
        scope: 'otp-verify-phone',
        identity: formattedPhone,
        limit: 8,
        windowMs: 15 * 60 * 1_000,
      }),
    ])
    const blocked = !ipLimit.allowed ? ipLimit : !phoneLimit.allowed ? phoneLimit : null
    if (blocked) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': String(blocked.retryAfterSeconds),
          },
        }
      )
    }

    const db = getDb()
    const [user] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.phoneNumber, formattedPhone))
      .limit(1)
    if (!user || (!user.adminRole && !user.damAccess)) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Verify OTP only after confirming this is an existing admin account.
    const isValid = await verifyOTPCode(formattedPhone, otp)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    await db
      .update(userSchema)
      .set({
        phoneNumberVerified: true,
        updatedAt: new Date()
      })
      .where(eq(userSchema.id, user.id))

    // Create session
    const sessionToken = nanoid(32)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.insert(sessionSchema).values({
      id: nanoid(),
      userId: user.id,
      token: sessionToken,
      expiresAt,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      createdAt: new Date()
    })

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email
      }
    })

    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    return response
  } catch (error: unknown) {
    console.error('Verify OTP failed', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json(
      { error: 'Failed to verify code. Please try again.' },
      { status: 500 }
    )
  }
}
