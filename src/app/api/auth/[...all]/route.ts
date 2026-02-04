/**
 * BetterAuth API Route
 *
 * Catch-all route for all authentication requests
 * Uses lazy initialization to avoid DATABASE_URL errors during build
 */

import { NextRequest } from 'next/server'
import { getAuth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Lazy handler cache
let _handler: ReturnType<typeof toNextJsHandler> | null = null

function getHandler() {
  if (!_handler) {
    _handler = toNextJsHandler(getAuth())
  }
  return _handler
}

export async function GET(request: NextRequest) {
  return getHandler().GET(request)
}

export async function POST(request: NextRequest) {
  return getHandler().POST(request)
}
