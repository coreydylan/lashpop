/**
 * BetterAuth API Route
 *
 * Catch-all route for all authentication requests
 * Uses lazy initialization to avoid DATABASE_URL errors during build
 */

import { NextRequest } from 'next/server'
import { handleAuthRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  return handleAuthRequest(request)
}

export async function POST(request: NextRequest) {
  return handleAuthRequest(request)
}
