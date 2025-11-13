/**
 * BetterAuth Server Configuration
 *
 * Main authentication configuration with phone number plugin
 */

/**
 * BetterAuth Server Configuration
 *
 * Simple session-only auth - phone verification handled via custom API routes
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '@/db'

export const auth = betterAuth({
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

// Export types for use in API routes
export type Auth = typeof auth
