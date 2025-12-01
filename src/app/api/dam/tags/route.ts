import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { tagCategories } from "@/db/schema/tag_categories"
import { tags } from "@/db/schema/tags"
import { asc, eq, isNull } from "drizzle-orm"

// Tag type with optional children for hierarchy
interface TagWithChildren {
  id: string
  name: string
  displayName: string
  description: string | null
  sortOrder: number
  parentTagId: string | null
  serviceCategoryId: string | null
  serviceId: string | null
  categoryId: string
  createdAt: Date
  updatedAt: Date
  children?: TagWithChildren[]
}

export async function GET() {
  try {
    const db = getDb()

    // Fetch all categories ordered by sortOrder
    const categories = await db
      .select()
      .from(tagCategories)
      .orderBy(asc(tagCategories.sortOrder))

    // Fetch all tags with hierarchy info
    const allTags = await db.select().from(tags).orderBy(asc(tags.sortOrder))

    // Build hierarchical structure for tags
    const buildTagHierarchy = (categoryTags: typeof allTags): TagWithChildren[] => {
      // First, get all top-level tags (no parent)
      const topLevelTags = categoryTags.filter(tag => !tag.parentTagId)

      // Build children for each top-level tag
      return topLevelTags.map(parentTag => {
        const children = categoryTags
          .filter(tag => tag.parentTagId === parentTag.id)
          .map(childTag => ({
            ...childTag,
            children: [] // Service-level tags don't have children
          }))

        return {
          ...parentTag,
          children: children.length > 0 ? children : undefined
        }
      })
    }

    // Group tags by category with hierarchy
    const categoriesWithTags = categories.map((category) => {
      const categoryTags = allTags.filter((tag) => tag.categoryId === category.id)
      const hierarchicalTags = buildTagHierarchy(categoryTags)

      return {
        ...category,
        isCollection: category.isCollection || false,
        isRating: category.isRating || false,
        // Include both flat list (for backwards compatibility) and hierarchical
        tags: categoryTags,
        hierarchicalTags
      }
    })

    return NextResponse.json({ categories: categoriesWithTags }, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categories: updatedCategories } = body

    if (!updatedCategories || !Array.isArray(updatedCategories)) {
      return NextResponse.json(
        { error: "Categories array is required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get existing categories and tags
    const existingCategories = await db.select().from(tagCategories)
    const existingTags = await db.select().from(tags)

    const updatedCategoryIds = updatedCategories
      .filter(cat => !cat.id.startsWith('cat-'))
      .map(cat => cat.id)
    const existingCategoryIds = existingCategories.map(cat => cat.id)

    // Delete categories that were removed
    const categoriesToDelete = existingCategoryIds.filter(
      id => !updatedCategoryIds.includes(id)
    )
    if (categoriesToDelete.length > 0) {
      for (const catId of categoriesToDelete) {
        await db.delete(tagCategories).where(eq(tagCategories.id, catId))
      }
    }

    // Process each category
    for (const category of updatedCategories) {
      const isNewCategory = category.id.startsWith('cat-')

      if (isNewCategory) {
        // Check if a category with this name already exists
        const [existingCategoryByName] = await db
          .select()
          .from(tagCategories)
          .where(eq(tagCategories.name, category.name))
          .limit(1)

        let categoryId: string

        if (existingCategoryByName) {
          // Update existing category instead of creating new one
          await db.update(tagCategories)
            .set({
              displayName: category.displayName,
              color: category.color,
              sortOrder: category.sortOrder ?? existingCategoryByName.sortOrder,
              isCollection: category.isCollection ?? false,
              isRating: category.isRating ?? false,
              description: category.description,
              updatedAt: new Date()
            })
            .where(eq(tagCategories.id, existingCategoryByName.id))
          categoryId = existingCategoryByName.id
        } else {
          // Insert new category
          const [newCat] = await db.insert(tagCategories).values({
            name: category.name,
            displayName: category.displayName,
            color: category.color,
            sortOrder: category.sortOrder ?? 0,
            isCollection: category.isCollection ?? false,
            isRating: category.isRating ?? false,
            description: category.description
          }).returning()
          categoryId = newCat.id
        }

        // Handle tags for this category
        if (category.tags && category.tags.length > 0) {
          for (let i = 0; i < category.tags.length; i++) {
            const tag = category.tags[i]

            // Check if tag already exists
            const [existingTag] = await db
              .select()
              .from(tags)
              .where(eq(tags.name, tag.name))
              .limit(1)

            if (existingTag) {
              // Update existing tag
              await db.update(tags)
                .set({
                  displayName: tag.displayName,
                  sortOrder: tag.sortOrder ?? i,
                  updatedAt: new Date()
                })
                .where(eq(tags.id, existingTag.id))
            } else {
              // Insert new tag
              await db.insert(tags).values({
                categoryId,
                name: tag.name,
                displayName: tag.displayName,
                sortOrder: tag.sortOrder ?? i
              })
            }
          }
        }
      } else {
        // Update existing category
        await db.update(tagCategories)
          .set({
            displayName: category.displayName,
            color: category.color,
            updatedAt: new Date()
          })
          .where(eq(tagCategories.id, category.id))

        // Handle tags for this category
        const categoryTags = category.tags || []
        const existingCategoryTags = existingTags.filter(t => t.categoryId === category.id)

        const updatedTagIds = categoryTags
          .filter((t: any) => !t.id.startsWith('tag-'))
          .map((t: any) => t.id)
        const existingTagIds = existingCategoryTags.map(t => t.id)

        // Delete tags that were removed
        const tagsToDelete = existingTagIds.filter(id => !updatedTagIds.includes(id))
        if (tagsToDelete.length > 0) {
          for (const tagId of tagsToDelete) {
            await db.delete(tags).where(eq(tags.id, tagId))
          }
        }

        // Process each tag
        for (let i = 0; i < categoryTags.length; i++) {
          const tag = categoryTags[i]
          const isNewTag = tag.id.startsWith('tag-')

          if (isNewTag) {
            // Insert new tag
            await db.insert(tags).values({
              categoryId: category.id,
              name: tag.name,
              displayName: tag.displayName,
              sortOrder: tag.sortOrder ?? i
            })
          } else {
            // Update existing tag
            await db.update(tags)
              .set({
                displayName: tag.displayName,
                sortOrder: tag.sortOrder ?? i,
                updatedAt: new Date()
              })
              .where(eq(tags.id, tag.id))
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Categories and tags saved successfully"
    })
  } catch (error) {
    console.error("Error saving tags:", error)
    return NextResponse.json(
      { error: "Failed to save tags" },
      { status: 500 }
    )
  }
}
