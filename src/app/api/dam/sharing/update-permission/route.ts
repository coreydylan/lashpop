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
    const { shareId, permissionLevel } = body

    // Validate required fields
    if (!shareId || !permissionLevel) {
      return NextResponse.json(
        { error: "shareId and permissionLevel are required" },
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

    // Update permission
    const updatedShare = await sharingService.updatePermission({
      shareId,
      newPermissionLevel: permissionLevel,
      requesterId: 'current-user' // TODO: Get from session
    })

    return NextResponse.json({
      success: true,
      share: updatedShare
    })
  } catch (error) {
    console.error("Error updating permission:", error)

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
      { error: "Failed to update permission" },
      { status: 500 }
    )
  }
}
