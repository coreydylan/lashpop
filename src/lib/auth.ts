/**
 * BetterAuth Server Configuration
 *
 * Simple session-only auth - phone verification handled via custom API routes
 * NOTE: Uses lazy initialization to avoid DATABASE_URL errors during build
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '@/db'

// Lazy-initialized auth instance
let _auth: ReturnType<typeof betterAuth> | null = null

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: {
        user: 'user',
        session: 'session',
        verification: 'verification'
      }
    }),

    // Base URL for the app
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',

    // Secret for signing tokens
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60 // Cache for 5 minutes
      }
    },

    // Email configuration (disabled - using phone only)
    emailAndPassword: {
      enabled: false
    }
  })
}

// Export auth getter function for direct use
export function getAuth(): ReturnType<typeof betterAuth> {
  if (!_auth) {
    _auth = createAuth()
  }
  return _auth
}

// Export auth as a getter that lazily initializes (for backwards compatibility)
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    const instance = getAuth()
    const value = (instance as any)[prop]
    // Bind functions to the instance to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  }
})

// Export types for use in API routes
export type Auth = ReturnType<typeof createAuth>
