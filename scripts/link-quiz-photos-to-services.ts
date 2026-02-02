import { getDb } from "../src/db"
import { assets } from "../src/db/schema/assets"
import { assetTags } from "../src/db/schema/asset_tags"
import { tags } from "../src/db/schema/tags"
import { services } from "../src/db/schema/services"
import { serviceSubcategories } from "../src/db/schema/service_subcategories"
import { eq, and, inArray, isNotNull } from "drizzle-orm"

async function main() {
  const db = getDb()

  console.log("=== Step 1: Find quiz result photos with their lash type tags ===\n")

  // Get the quiz_result tag
  const [quizResultTag] = await db
    .select()
    .from(tags)
    .where(eq(tags.name, "quiz_result"))
    .limit(1)

  if (!quizResultTag) {
    console.error("ERROR: quiz_result tag not found!")
    process.exit(1)
  }
  console.log("Found quiz_result tag:", quizResultTag.id)

  // Get lash type tags
  const lashTypeTags = await db
    .select()
    .from(tags)
    .where(inArray(tags.name, ["lash_lift", "classic", "hybrid", "wet", "volume"]))

  console.log("Lash type tags found:", lashTypeTags.map(t => t.name).join(", "))

  // Find all assets tagged with quiz_result
  const quizResultAssetTags = await db
    .select({ assetId: assetTags.assetId })
    .from(assetTags)
    .where(eq(assetTags.tagId, quizResultTag.id))

  const quizResultAssetIds = quizResultAssetTags.map(at => at.assetId)
  console.log(`\nFound ${quizResultAssetIds.length} quiz result assets`)

  // For each quiz result asset, find its lash type tag
  const assetsByLashType: Record<string, string[]> = {
    lash_lift: [],
    classic: [],
    hybrid: [],
    wet: [],
    volume: [],
  }

  for (const assetId of quizResultAssetIds) {
    // Get all tags for this asset
    const assetTagRecords = await db
      .select({ tagId: assetTags.tagId })
      .from(assetTags)
      .where(eq(assetTags.assetId, assetId))

    const tagIds = assetTagRecords.map(at => at.tagId)

    // Find which lash type tag this asset has
    for (const lashTag of lashTypeTags) {
      if (tagIds.includes(lashTag.id)) {
        assetsByLashType[lashTag.name].push(assetId)
        break
      }
    }
  }

  console.log("\nQuiz result assets by lash type:")
  for (const [lashType, assetIds] of Object.entries(assetsByLashType)) {
    console.log(`  ${lashType}: ${assetIds.length} photos`)
  }

  console.log("\n=== Step 2: Get subcategory info ===\n")

  // Get all lash subcategories
  const subcategories = await db
    .select()
    .from(serviceSubcategories)

  console.log("Subcategories found:")
  for (const subcat of subcategories) {
    console.log(`  - ${subcat.slug}: ${subcat.name} (current keyImageAssetId: ${subcat.keyImageAssetId || "none"})`)
  }

  // Map lash types to subcategory slugs
  const lashTypeToSubcategorySlug: Record<string, string> = {
    lash_lift: "lash-enhancements",
    classic: "classic-extensions",
    wet: "wet-angel-extensions",
    hybrid: "hybrid-extensions",
    volume: "volume-extensions",
  }

  console.log("\n=== Step 3: Update subcategory key images ===\n")

  for (const [lashType, subcategorySlug] of Object.entries(lashTypeToSubcategorySlug)) {
    const assetIds = assetsByLashType[lashType]
    if (assetIds.length === 0) {
      console.log(`Skipping ${lashType} - no quiz result photos found`)
      continue
    }

    // Find the subcategory
    const subcat = subcategories.find(s => s.slug === subcategorySlug)
    if (!subcat) {
      console.log(`WARNING: Subcategory ${subcategorySlug} not found for ${lashType}`)
      continue
    }

    // Use the first asset as the key image
    const keyImageAssetId = assetIds[0]

    // Get the asset details for logging
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, keyImageAssetId))
      .limit(1)

    console.log(`Updating ${subcat.name} (${subcategorySlug}):`)
    console.log(`  Setting keyImageAssetId to: ${keyImageAssetId}`)
    console.log(`  Asset: ${asset?.fileName} - ${asset?.filePath}`)

    // Update the subcategory
    await db
      .update(serviceSubcategories)
      .set({
        keyImageAssetId,
        updatedAt: new Date()
      })
      .where(eq(serviceSubcategories.id, subcat.id))

    console.log(`  ✓ Updated!\n`)
  }

  console.log("=== Step 4: Clear placeholder images from services ===\n")

  // Find services with placeholder images (imageUrl set but not a real photo)
  // or services in lash subcategories that should use subcategory images
  const lashServices = await db
    .select()
    .from(services)
    .where(isNotNull(services.subcategoryId))

  let clearedCount = 0
  for (const service of lashServices) {
    // Check if this service is in one of our lash subcategories
    const subcat = subcategories.find(s => s.id === service.subcategoryId)
    if (!subcat) continue

    const isLashSubcategory = Object.values(lashTypeToSubcategorySlug).includes(subcat.slug)
    if (!isLashSubcategory) continue

    // Clear any imageUrl placeholder and keyImageAssetId so it falls back to subcategory image
    if (service.imageUrl || service.keyImageAssetId) {
      console.log(`Clearing placeholder from service: ${service.name}`)
      console.log(`  Was: imageUrl=${service.imageUrl}, keyImageAssetId=${service.keyImageAssetId}`)

      await db
        .update(services)
        .set({
          imageUrl: null,
          keyImageAssetId: null,
          updatedAt: new Date()
        })
        .where(eq(services.id, service.id))

      clearedCount++
    }
  }

  console.log(`\nCleared placeholders from ${clearedCount} services`)

  console.log("\n=== COMPLETE ===")
  console.log("\nSubcategories now have quiz result photos as key images.")
  console.log("Services will fall back to their subcategory's key image.")

  // Final summary
  console.log("\n=== Final State ===\n")
  const updatedSubcategories = await db
    .select()
    .from(serviceSubcategories)

  for (const subcat of updatedSubcategories) {
    if (subcat.keyImageAssetId) {
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, subcat.keyImageAssetId))
        .limit(1)

      console.log(`${subcat.name}: ${asset?.filePath || "asset not found"}`)
    } else {
      console.log(`${subcat.name}: no key image`)
    }
  }
}

main().catch(console.error)
