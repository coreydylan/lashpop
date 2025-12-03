/**
 * BetterAuth Client
 *
 * Client-side authentication utilities
 */

'use client'

import { createAuthClient } from 'better-auth/react'

// Determine base URL: use env var if set, otherwise detect from browser in production
function getBaseURL(): string {
  // Server-side or env var explicitly set
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  // Client-side: use current origin (works in production)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Fallback for SSR during dev
  return 'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: getBaseURL()
})

// Export hooks and utilities
export const {
  useSession,
  signIn,
  signOut
} = authClient

// Phone number auth methods
export const phoneNumberAuth = {
  sendOtp: async ({ phoneNumber }: { phoneNumber: string }) => {
    const response = await fetch('/api/auth/phone/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send OTP')
    }

    return response.json()
  },

  verifyOtp: async ({ phoneNumber, otp }: { phoneNumber: string; otp: string }) => {
    const response = await fetch('/api/auth/phone/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to verify OTP')
    }

    return response.json()
  }
}

// Custom hook for phone auth
export function usePhoneAuth() {
  const { data: session, isPending } = useSession()

  return {
    user: session?.user as any,
    session,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    phoneNumber: (session?.user as any)?.phoneNumber
  }
}
