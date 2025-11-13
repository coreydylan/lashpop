import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getDb } from "@/db"
import { session as sessionSchema } from "@/db/schema/auth_session"
import { eq } from "drizzle-orm"

export async function POST() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get("auth_token")

  // Delete session from database if it exists
  if (authToken) {
    try {
      const db = getDb()
      await db
        .delete(sessionSchema)
        .where(eq(sessionSchema.token, authToken.value))
    } catch (error) {
      console.error("Error deleting session:", error)
      // Continue with cookie deletion even if DB delete fails
    }
  }

  // Delete auth cookie
  cookieStore.delete("auth_token")

  return NextResponse.json({ success: true })
}
