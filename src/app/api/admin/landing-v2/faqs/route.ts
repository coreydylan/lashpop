import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { landingPageFaqs } from "@/db/schema/landing_page_faqs"
import { user as userSchema } from "@/db/schema/auth_user"
import { session as sessionSchema } from "@/db/schema/auth_session"
import { eq, and, gt } from "drizzle-orm"
import { cookies } from "next/headers"

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get("auth_token")
  if (!authToken) return false

  const db = getDb()
  const result = await db
    .select({ damAccess: userSchema.damAccess })
    .from(sessionSchema)
    .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
    .where(
      and(
        eq(sessionSchema.token, authToken.value),
        gt(sessionSchema.expiresAt, new Date())
      )
    )
    .limit(1)

  return result[0]?.damAccess || false
}

// GET - Fetch all FAQs
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const db = getDb()
    const faqs = await db
      .select()
      .from(landingPageFaqs)
      .orderBy(landingPageFaqs.displayOrder)

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 })
  }
}

// POST - Create new FAQ
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const faq = await req.json()
    const db = getDb()

    const [newFaq] = await db
      .insert(landingPageFaqs)
      .values(faq)
      .returning()

    return NextResponse.json({ faq: newFaq })
  } catch (error) {
    console.error("Error creating FAQ:", error)
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 })
  }
}
