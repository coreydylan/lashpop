import { NextRequest, NextResponse } from "next/server"
import { sharingService } from "@/lib/services/sharing-service"

export const dynamic = 'force-dynamic'

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Rate limiting for public endpoints
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { token } = params
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')

    // Validate token
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // Get client info for logging
    const userAgent = request.headers.get('user-agent') || undefined

    // Validate public link and get resource
    const result = await sharingService.validatePublicLink({
      token,
      password: password || undefined,
      ipAddress: ip,
      userAgent
    })

    if (!result.isValid) {
      // Return specific error messages
      const errorMessage = result.error || "Invalid or expired link"

      if (errorMessage.includes("not found")) {
        return NextResponse.json(
          { error: "Link not found or has been revoked" },
          { status: 404 }
        )
      }
      if (errorMessage.includes("expired")) {
        return NextResponse.json(
          { error: "This link has expired" },
          { status: 410 }
        )
      }
      if (errorMessage.includes("Password is required")) {
        return NextResponse.json(
          { error: "Password is required to access this resource" },
          { status: 401 }
        )
      }
      if (errorMessage.includes("Invalid password")) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        )
      }
      if (errorMessage.includes("maximum views")) {
        return NextResponse.json(
          { error: "This link has reached its maximum number of views" },
          { status: 410 }
        )
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      )
    }

    // Return resource data
    const link = result.link!
    return NextResponse.json({
      resourceType: link.resourceType,
      resourceId: link.resourceId,
      metadata: {
        expiresAt: link.expiresAt,
        viewsRemaining: link.maxViews ? link.maxViews - link.viewCount : null,
        createdAt: link.createdAt
      }
    })
  } catch (error) {
    console.error("Error accessing public share:", error)

    return NextResponse.json(
      { error: "Failed to access shared resource" },
      { status: 500 }
    )
  }
}
