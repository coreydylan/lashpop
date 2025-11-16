/**
 * Current User API Endpoint
 *
 * GET: Returns the currently authenticated user with their role and permissions
 */

import { NextResponse } from 'next/server'
import { requireAuth, UnauthorizedError } from '@/lib/server/dam-auth'
import type { AuthenticatedUser } from '@/types/permissions'

export async function GET() {
  try {
    // Get current authenticated user with permissions
    const user: AuthenticatedUser = await requireAuth()

    // Return user data
    return NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        permissions: user.permissions,
        teamMemberId: user.teamMemberId,
        isActive: user.isActive,
        phone: user.phone,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    // Handle authentication errors
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Handle unexpected errors
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
