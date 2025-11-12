import { seedTags } from "./seed-tags"
import { seedCollections } from "./seed-collections"

async function seedAll() {
  console.log("========================================")
  console.log("Starting complete database seeding...")
  console.log("========================================\n")

  try {
    // First seed regular tags
    await seedTags()

    console.log("\n")

    // Then seed collections (won't overwrite regular tags)
    await seedCollections()

    console.log("\n========================================")
    console.log("All seeding completed successfully!")
    console.log("========================================")
  } catch (error) {
    console.error("Error during seeding:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log("\nDone!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\nSeeding failed:", error)
      process.exit(1)
    })
}

export { seedAll }
