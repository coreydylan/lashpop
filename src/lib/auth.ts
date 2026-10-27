/**
 * BetterAuth Server Configuration
 *
 * Simple session-only auth - phone verification handled via custom API routes
 * NOTE: Uses lazy initialization to avoid DATABASE_URL errors during build
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '@/db'
import { user } from '@/db/schema/auth_user'
import { session } from '@/db/schema/auth_session'
import { verification } from '@/db/schema/auth_verification'
import { account } from '@/db/schema/auth_account'
import { bridgePhoneSessionHeaders, clearPhoneSessionCookie } from './auth-session'

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: 'sqlite',
      schema: {
        user,
        session,
        verification,
        account,
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
      // Match the admin's D1-backed session checks: revocation must take effect
      // immediately, including after a legacy phone cookie is bridged.
      cookieCache: { enabled: false }
    },

    user: {
      additionalFields: {
        phoneNumber: { type: 'string', required: false, input: false },
        phoneNumberVerified: { type: 'boolean', required: false, input: false },
      }
    },

    // Email configuration (disabled - using phone only)
    emailAndPassword: {
      enabled: false
    }
  })
}

type AuthInstance = ReturnType<typeof createAuth>

// Lazy-initialized auth instance
let _auth: AuthInstance | null = null

// Export auth getter function for direct use
export function getAuth(): AuthInstance {
  if (!_auth) {
    _auth = createAuth()
  }
  return _auth
}

/** Session lookup used by server routes that receive the phone-login cookie. */
export async function getSessionFromHeaders(headers: Headers) {
  const instance = getAuth()
  const context = await instance.$context
  return instance.api.getSession({
    headers: await bridgePhoneSessionHeaders(headers, context.authCookies.sessionToken.name, context.secret),
  })
}

/** Keep HTTP client hooks and server-side session reads on the same policy. */
export async function handleAuthRequest(request: Request): Promise<Response> {
  const instance = getAuth()
  const context = await instance.$context
  const headers = await bridgePhoneSessionHeaders(request.headers, context.authCookies.sessionToken.name, context.secret)
  const response = await instance.handler(new Request(request, { headers }))
  if (request.method === 'POST' && new URL(request.url).pathname === '/api/auth/sign-out' && response.ok) {
    clearPhoneSessionCookie(response, context.authCookies.sessionToken.attributes.secure === true)
  }
  return response
}

// Export auth as a getter that lazily initializes (for backwards compatibility)
export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop) {
    const instance = getAuth()
    const value = Reflect.get(instance as object, prop)
    // Bind functions to the instance to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  }
})

// Export types for use in API routes
export type Auth = AuthInstance
