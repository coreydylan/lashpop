import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Check password against environment variable
    const correctPassword = process.env.DAM_PASSWORD

    if (!correctPassword) {
      return NextResponse.json(
        { error: "DAM authentication not configured" },
        { status: 500 }
      )
    }

    if (password === correctPassword) {
      // Set HTTP-only cookie that expires in 30 days
      const cookieStore = await cookies()
      cookieStore.set("dam_auth", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}
