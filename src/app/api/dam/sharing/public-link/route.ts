import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sharingService } from "@/lib/services/sharing-service"

export const dynamic = 'force-dynamic'

// Create public link
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
    const { resourceType, resourceId, expiresAt, password, maxViews } = body

    // Validate required fields
    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: "resourceType and resourceId are required" },
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

    // Create public link
    const link = await sharingService.createPublicLink({
      resourceType,
      resourceId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      password,
      maxViews,
      createdBy: 'current-user' // TODO: Get from session
    })

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const url = `${baseUrl}/public/share/${link.token}`

    return NextResponse.json({
      link: {
        ...link,
        url
      }
    })
  } catch (error) {
    console.error("Error creating public link:", error)

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
      { error: "Failed to create public link" },
      { status: 500 }
    )
  }
}

// Get existing public link for resource
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

    // TODO: Implement getPublicLink method in service or query directly
    // For now, return null - this endpoint needs implementation
    const link = null

    if (!link) {
      return NextResponse.json({ link: null })
    }

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const url = `${baseUrl}/public/share/${link.token}`

    return NextResponse.json({
      link: {
        ...link,
        url
      }
    })
  } catch (error) {
    console.error("Error fetching public link:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not authorized') || error.message.includes('permission')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch public link" },
      { status: 500 }
    )
  }
}

// Revoke public link
export async function DELETE(request: NextRequest) {
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
    const { linkId } = body

    // Validate required fields
    if (!linkId) {
      return NextResponse.json(
        { error: "linkId is required" },
        { status: 400 }
      )
    }

    // Revoke public link
    await sharingService.revokePublicLink({
      linkId,
      requesterId: 'current-user' // TODO: Get from session
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error("Error revoking public link:", error)

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
      { error: "Failed to revoke public link" },
      { status: 500 }
    )
  }
}
