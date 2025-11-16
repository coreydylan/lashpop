import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sharingService } from "@/lib/services/sharing-service"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resourceType')
    const resourceId = searchParams.get('resourceId')

    // Validate required parameters
    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: "resourceType and resourceId query parameters are required" },
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

    // Get shared users
    const shares = await sharingService.getSharedUsers({
      resourceType,
      resourceId
    })

    return NextResponse.json({
      shares
    })
  } catch (error) {
    console.error("Error fetching shares:", error)

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
      { error: "Failed to fetch shares" },
      { status: 500 }
    )
  }
}
