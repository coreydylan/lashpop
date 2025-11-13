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
import { createProfile, matchAndLinkVagaroCustomer } from '@/actions/profiles'

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otp } = await req.json()

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    // Convert to E.164 format
    const formattedPhone = toE164(phoneNumber)

    // Verify OTP via Twilio Verify
    const isValid = await verifyOTPCode(formattedPhone, otp)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Find or create user
    let [user] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.phoneNumber, formattedPhone))
      .limit(1)

    if (!user) {
      // Create new user
      const [newUser] = await db
        .insert(userSchema)
        .values({
          id: nanoid(),
          phoneNumber: formattedPhone,
          phoneNumberVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()

      user = newUser

      // Create profile and try Vagaro matching
      try {
        await createProfile(user.id)
        await matchAndLinkVagaroCustomer(user.id)
      } catch (error) {
        console.error('Post-signup flow error:', error)
        // Don't fail auth if profile creation fails
      }
    } else {
      // Update phone verified status
      await db
        .update(userSchema)
        .set({
          phoneNumberVerified: true,
          updatedAt: new Date()
        })
        .where(eq(userSchema.id, user.id))
    }

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
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify code' },
      { status: 500 }
    )
  }
}
