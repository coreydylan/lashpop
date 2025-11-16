import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sharingService } from "@/lib/services/sharing-service"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('dam_auth')

    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { resourceType, resourceId, userIds, permissionLevel, expiresAt } = body

    // Validate required fields
    if (!resourceType || !resourceId || !userIds || !permissionLevel) {
      return NextResponse.json(
        { error: "resourceType, resourceId, userIds, and permissionLevel are required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds must be a non-empty array" },
        { status: 400 }
      )
    }

    // Validate resourceType
    if (!['asset', 'set', 'collection'].includes(resourceType)) {
      return NextResponse.json(
        { error: "resourceType must be 'asset', 'set', or 'collection'" },
        { status: 400 }
      )
    }

    // Validate permissionLevel
    if (!['view', 'edit', 'admin'].includes(permissionLevel)) {
      return NextResponse.json(
        { error: "permissionLevel must be 'view', 'edit', or 'admin'" },
        { status: 400 }
      )
    }

    // Share the resource
    const shares = await sharingService.shareWithMultipleUsers({
      resourceType,
      resourceId,
      userIds,
      permissionLevel,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      ownerId: 'current-user' // TODO: Get from session
    })

    return NextResponse.json({
      success: true,
      shares
    })
  } catch (error) {
    console.error("Error sharing resource:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not authorized') || error.message.includes('permission')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to share resource" },
      { status: 500 }
    )
  }
}
