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
    const { shareId } = body

    // Validate required fields
    if (!shareId) {
      return NextResponse.json(
        { error: "shareId is required" },
        { status: 400 }
      )
    }

    // Revoke access
    await sharingService.revokeAccess({
      shareId,
      requesterId: 'current-user' // TODO: Get from session
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error("Error revoking access:", error)

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
      { error: "Failed to revoke access" },
      { status: 500 }
    )
  }
}
