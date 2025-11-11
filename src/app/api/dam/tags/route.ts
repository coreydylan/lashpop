import { NextResponse } from "next/server"
import { getDb } from "@/db"
import { tagCategories } from "@/db/schema/tag_categories"
import { tags } from "@/db/schema/tags"
import { asc, eq } from "drizzle-orm"

export async function GET() {
  try {
    const db = getDb()

    // Fetch all categories ordered by sortOrder
    const categories = await db
      .select()
      .from(tagCategories)
      .orderBy(asc(tagCategories.sortOrder))

    // Fetch all tags
    const allTags = await db.select().from(tags).orderBy(asc(tags.sortOrder))

    // Group tags by category
    const categoriesWithTags = categories.map((category) => ({
      ...category,
      tags: allTags.filter((tag) => tag.categoryId === category.id)
    }))

    return NextResponse.json({ categories: categoriesWithTags })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}
