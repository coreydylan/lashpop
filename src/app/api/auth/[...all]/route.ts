/**
 * BetterAuth API Route
 *
 * Catch-all route for all authentication requests
 */

import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
