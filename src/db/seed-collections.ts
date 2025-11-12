import { getDb } from "./index"
import { tagCategories } from "./schema/tag_categories"
import { tags } from "./schema/tags"
import { eq } from "drizzle-orm"

async function seedCollections() {
  const db = getDb()

  console.log("Starting collection category seeding...")

  // Check if collection category already exists
  const [existingCategory] = await db
    .select()
    .from(tagCategories)
    .where(eq(tagCategories.name, "collections"))
    .limit(1)

  let categoryId: string

  if (existingCategory) {
    console.log("Collection category already exists, updating...")
    await db
      .update(tagCategories)
      .set({
        isCollection: true,
        displayName: "Collections",
        description: "Curated collections of assets",
        color: "#BD8878", // terracotta
        sortOrder: 999, // Put collections at the end
        updatedAt: new Date()
      })
      .where(eq(tagCategories.id, existingCategory.id))
    categoryId = existingCategory.id
    console.log("✓ Updated collection category")
  } else {
    // Create collection category
    const [newCategory] = await db
      .insert(tagCategories)
      .values({
        name: "collections",
        displayName: "Collections",
        description: "Curated collections of assets",
        color: "#BD8878", // terracotta
        sortOrder: 999, // Put collections at the end
        isCollection: true,
        isRating: false
      })
      .returning()

    categoryId = newCategory.id
    console.log("✓ Created collection category")
  }

  // Create some default collections
  const defaultCollections = [
    { name: "portfolio", displayName: "Portfolio", description: "Best work for showcasing", sortOrder: 1 },
    { name: "instagram", displayName: "Instagram", description: "Ready to post on Instagram", sortOrder: 2 },
    { name: "website", displayName: "Website", description: "Featured on website", sortOrder: 3 },
    { name: "before_after", displayName: "Before & After", description: "Transformation shots", sortOrder: 4 }
  ]

  for (const collection of defaultCollections) {
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, collection.name))
      .limit(1)

    if (existingTag) {
      console.log(`  Collection "${collection.displayName}" already exists, skipping...`)
    } else {
      await db.insert(tags).values({
        ...collection,
        categoryId
      })
      console.log(`  ✓ Created collection: ${collection.displayName}`)
    }
  }

  console.log("Collection category seeding completed!")
}

// Run if called directly
if (require.main === module) {
  seedCollections()
    .then(() => {
      console.log("Done!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error seeding collections:", error)
      process.exit(1)
    })
}

export { seedCollections }
