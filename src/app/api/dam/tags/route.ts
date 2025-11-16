import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { tagCategories } from "@/db/schema/tag_categories"
import { tags } from "@/db/schema/tags"
import { asc, eq, inArray } from "drizzle-orm"
import { getCurrentUserId, getAccessibleResources, checkPermission } from "@/lib/permissions"

export async function GET() {
  try {
    // Get current user and their accessible collections
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const accessibleCollectionIds = await getAccessibleResources(userId, "collection")

    const db = getDb()

    // Fetch accessible categories ordered by sortOrder
    const categories = accessibleCollectionIds.length > 0
      ? await db
          .select()
          .from(tagCategories)
          .where(inArray(tagCategories.id, accessibleCollectionIds))
          .orderBy(asc(tagCategories.sortOrder))
      : []

    // Fetch all tags
    const allTags = await db.select().from(tags).orderBy(asc(tags.sortOrder))

    // Group tags by category, ensuring boolean fields are included
    const categoriesWithTags = categories.map((category) => ({
      ...category,
      isCollection: category.isCollection || false,
      isRating: category.isRating || false,
      tags: allTags.filter((tag) => tag.categoryId === category.id)
    }))

    return NextResponse.json({ categories: categoriesWithTags })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

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
          // Check if user has permission to edit this existing category
          const canEdit = await checkPermission(userId, "collection", existingCategoryByName.id, "editor")
          if (!canEdit) {
            return NextResponse.json(
              { error: `Forbidden - You don't have permission to edit category "${category.displayName}"` },
              { status: 403 }
            )
          }

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
          // Insert new category with current user as owner
          const [newCat] = await db.insert(tagCategories).values({
            name: category.name,
            displayName: category.displayName,
            color: category.color,
            sortOrder: category.sortOrder ?? 0,
            isCollection: category.isCollection ?? false,
            isRating: category.isRating ?? false,
            description: category.description,
            ownerId: userId, // Set current user as owner
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
        // Check if user has permission to edit this category
        const canEdit = await checkPermission(userId, "collection", category.id, "editor")
        if (!canEdit) {
          return NextResponse.json(
            { error: `Forbidden - You don't have permission to edit category "${category.displayName}"` },
            { status: 403 }
          )
        }

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
