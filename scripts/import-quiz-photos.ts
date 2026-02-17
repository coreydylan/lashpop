import { getDb } from "../src/db"
import { tagCategories } from "../src/db/schema/tag_categories"
import { tags } from "../src/db/schema/tags"
import { assets } from "../src/db/schema/assets"
import { assetTags } from "../src/db/schema/asset_tags"
import { uploadFile, generateAssetKey } from "../src/lib/dam/r2-client"
import { eq } from "drizzle-orm"
import * as fs from "fs"
import * as path from "path"

// Photo data from iMessage conversation with Emily
const quizPhotos = [
  // Quiz Question Photos
  { msgText: "Lash Lift", file: "~/Library/Messages/Attachments/c9/09/9A32B5C1-B3EC-4B9C-8AC4-C97F46F328B0/IMG_3301.png", lashType: "lash_lift", usage: "quiz_question" },
  { msgText: "Lash Lift", file: "~/Library/Messages/Attachments/98/08/2319965E-6B6E-4EAF-B707-8FA65A526F25/IMG_1858.png", lashType: "lash_lift", usage: "quiz_question" },
  { msgText: "Classic set", file: "~/Library/Messages/Attachments/47/07/0B544678-2000-4447-B6F0-ADD0CD4764A2/IMG_7768.png", lashType: "classic", usage: "quiz_question" },
  { msgText: "Classic set", file: "~/Library/Messages/Attachments/db/11/D8837CA2-57A8-48ED-94D5-AA8946A23DB6/IMG_0070.png", lashType: "classic", usage: "quiz_question" },
  { msgText: "Classic set", file: "~/Library/Messages/Attachments/98/08/F47D1400-1A72-4FCD-A23F-8ED3B09B33D3/IMG_6758.jpeg", lashType: "classic", usage: "quiz_question" },
  { msgText: "Hybrid", file: "~/Library/Messages/Attachments/1f/15/DDD89958-B7BC-4CC5-BA65-8B288598B221/IMG_8622.png", lashType: "hybrid", usage: "quiz_question" },
  { msgText: "Hybrid", file: "~/Library/Messages/Attachments/68/08/62669F57-2775-4280-B38D-FBB640B1882D/IMG_3997.png", lashType: "hybrid", usage: "quiz_question" },
  { msgText: "Hybrid", file: "~/Library/Messages/Attachments/62/02/088158ED-EE30-44E5-9397-89DBC9B9ABEB/IMG_0975.png", lashType: "hybrid", usage: "quiz_question" },
  { msgText: "Wet/angle style", file: "~/Library/Messages/Attachments/32/02/AE8AD83D-7166-47C4-909D-7502D5C49C0B/IMG_3859.jpeg", lashType: "wet", usage: "quiz_question" },
  { msgText: "Wet/angle style", file: "~/Library/Messages/Attachments/de/14/FD43D274-32F7-44E8-8186-76DFD6A08507/IMG_5272_VSCO.jpeg", lashType: "wet", usage: "quiz_question" },
  { msgText: "Volume", file: "~/Library/Messages/Attachments/73/03/65FD63DD-126B-48B1-95A8-7C769F7CE9AE/FullSizeRender_VSCO.jpeg", lashType: "volume", usage: "quiz_question" },
  { msgText: "Volume", file: "~/Library/Messages/Attachments/0a/10/A3EA65C7-55E2-48DA-BBF6-FF95D5F973DA/IMG_3927.jpeg", lashType: "volume", usage: "quiz_question" },
  { msgText: "Volume", file: "~/Library/Messages/Attachments/89/09/02B1667F-6CE1-46CA-842F-93C46B06F119/IMG_7220_VSCO_VSCO.jpeg", lashType: "volume", usage: "quiz_question" },

  // Quiz Result Photos
  { msgText: "Lash lift result", file: "~/Library/Messages/Attachments/35/05/FF945136-2DF9-452F-A039-102E9628E813/IMG_2241.png", lashType: "lash_lift", usage: "quiz_result" },
  { msgText: "Classic result", file: "~/Library/Messages/Attachments/31/01/938ACEA3-8387-47BB-8FBC-E3855013D08B/IMG_4302.png", lashType: "classic", usage: "quiz_result" },
  { msgText: "Classic result", file: "~/Library/Messages/Attachments/43/03/864C5439-99C8-4469-ADB8-D17AE58280CB/IMG_2019.png", lashType: "classic", usage: "quiz_result" },
  { msgText: "Hybrid result", file: "~/Library/Messages/Attachments/b8/08/7F0FF44E-DD50-4EBF-A11F-33DC7E813923/IMG_0258.png", lashType: "hybrid", usage: "quiz_result" },
  { msgText: "Hybrid result", file: "~/Library/Messages/Attachments/fe/14/8A3A774D-DC4E-4897-85DF-EA1B2B600265/IMG_6119.png", lashType: "hybrid", usage: "quiz_result" },
  { msgText: "Wet/angel result", file: "~/Library/Messages/Attachments/33/03/67DE691B-2001-4D90-9C8F-BD2140ED508B/IMG_0622.png", lashType: "wet", usage: "quiz_result" },
  { msgText: "Wet/angel result", file: "~/Library/Messages/Attachments/0e/14/1DC5A040-BDEF-4C8C-A06D-8CB35E928027/IMG_7808.png", lashType: "wet", usage: "quiz_result" },
  { msgText: "Volume result", file: "~/Library/Messages/Attachments/0b/11/8D5D85ED-1386-47F4-BDEE-39CE88B68BB9/IMG_9329.png", lashType: "volume", usage: "quiz_result" },
  { msgText: "Volume result", file: "~/Library/Messages/Attachments/13/03/25220158-1ECC-4020-A426-555F5C7AEBC4/IMG_2174.png", lashType: "volume", usage: "quiz_result" },
  { msgText: "Volume result", file: "~/Library/Messages/Attachments/33/03/FC3B7502-87C1-4A08-A1A9-5AB35DF62773/IMG_8155.png", lashType: "volume", usage: "quiz_result" },
]

function expandPath(filePath: string): string {
  if (filePath.startsWith("~/")) {
    return path.join(process.env.HOME || "", filePath.slice(2))
  }
  return filePath
}

async function main() {
  const db = getDb()

  console.log("=== Step 1: Create/Find Quiz tag category ===")

  // Check if quiz category exists
  let [quizCategory] = await db
    .select()
    .from(tagCategories)
    .where(eq(tagCategories.name, "find_your_look_quiz"))
    .limit(1)

  if (!quizCategory) {
    console.log("Creating 'Find Your Look Quiz' category...")
    const [newCategory] = await db.insert(tagCategories).values({
      name: "find_your_look_quiz",
      displayName: "Find Your Look Quiz",
      description: "Tags for the Find Your Look discovery quiz",
      color: "#8B5CF6", // Purple
      sortOrder: 50,
      selectionMode: "multi"
    }).returning()
    quizCategory = newCategory
    console.log("Created category:", quizCategory.id)
  } else {
    console.log("Quiz category already exists:", quizCategory.id)
  }

  // Create quiz tags if they don't exist
  const quizTagDefs = [
    { name: "quiz_question", displayName: "Quiz Question", sortOrder: 0 },
    { name: "quiz_result", displayName: "Quiz Result", sortOrder: 1 }
  ]

  const quizTagIds: Record<string, string> = {}

  for (const tagDef of quizTagDefs) {
    let [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, tagDef.name))
      .limit(1)

    if (!existingTag) {
      console.log(`Creating tag: ${tagDef.displayName}...`)
      const [newTag] = await db.insert(tags).values({
        categoryId: quizCategory.id,
        name: tagDef.name,
        displayName: tagDef.displayName,
        sortOrder: tagDef.sortOrder
      }).returning()
      quizTagIds[tagDef.name] = newTag.id
    } else {
      console.log(`Tag exists: ${tagDef.displayName}`)
      quizTagIds[tagDef.name] = existingTag.id
    }
  }

  console.log("\n=== Step 2: Check/Create Lash Lift tag in lash_type category ===")

  // Get the lash_type category
  const [lashTypeCategory] = await db
    .select()
    .from(tagCategories)
    .where(eq(tagCategories.name, "lash_type"))
    .limit(1)

  if (!lashTypeCategory) {
    console.error("ERROR: lash_type category not found!")
    process.exit(1)
  }

  // Check if lash_lift tag exists
  let [lashLiftTag] = await db
    .select()
    .from(tags)
    .where(eq(tags.name, "lash_lift"))
    .limit(1)

  if (!lashLiftTag) {
    console.log("Creating 'Lash Lift' tag in lash_type category...")
    const [newTag] = await db.insert(tags).values({
      categoryId: lashTypeCategory.id,
      name: "lash_lift",
      displayName: "Lash Lift",
      sortOrder: 5
    }).returning()
    lashLiftTag = newTag
  }
  console.log("Lash Lift tag ID:", lashLiftTag.id)

  // Get all lash type tags
  const lashTypeTags = await db
    .select()
    .from(tags)
    .where(eq(tags.categoryId, lashTypeCategory.id))

  const lashTypeTagMap: Record<string, string> = {}
  for (const tag of lashTypeTags) {
    lashTypeTagMap[tag.name] = tag.id
  }
  console.log("Lash type tags:", Object.keys(lashTypeTagMap))

  console.log("\n=== Step 3: Upload photos and create assets ===")

  const uploadedAssets: { assetId: string; lashType: string; usage: string }[] = []

  for (const photo of quizPhotos) {
    const fullPath = expandPath(photo.file)
    const fileName = path.basename(fullPath)

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`)
      continue
    }

    console.log(`Uploading: ${fileName} (${photo.lashType}, ${photo.usage})`)

    // Read file
    const fileBuffer = fs.readFileSync(fullPath)
    const mimeType = fullPath.endsWith(".png") ? "image/png" : "image/jpeg"

    // Create a File-like object for upload
    const blob = new Blob([fileBuffer], { type: mimeType })
    const file = new File([blob], fileName, { type: mimeType })

    // Generate storage key
    const key = generateAssetKey(fileName)

    // Upload to R2
    const { url } = await uploadFile({
      file,
      key,
      contentType: mimeType
    })

    console.log(`  Uploaded to: ${url}`)

    // Create asset in DB
    const [asset] = await db.insert(assets).values({
      fileName,
      filePath: url,
      fileType: "image",
      mimeType,
      fileSize: fileBuffer.length,
      caption: `Find Your Look Quiz - ${photo.msgText}`
    }).returning()

    console.log(`  Created asset: ${asset.id}`)

    uploadedAssets.push({
      assetId: asset.id,
      lashType: photo.lashType,
      usage: photo.usage
    })
  }

  console.log(`\n=== Step 4: Tag all uploaded assets ===`)
  console.log(`Total assets to tag: ${uploadedAssets.length}`)

  for (const { assetId, lashType, usage } of uploadedAssets) {
    const tagsToApply: string[] = []

    // Add quiz usage tag
    const quizTagId = quizTagIds[usage]
    if (quizTagId) {
      tagsToApply.push(quizTagId)
    }

    // Add lash type tag
    const lashTypeTagId = lashTypeTagMap[lashType]
    if (lashTypeTagId) {
      tagsToApply.push(lashTypeTagId)
    }

    // Insert tags
    for (const tagId of tagsToApply) {
      await db.insert(assetTags).values({
        assetId,
        tagId
      }).onConflictDoNothing()
    }

    console.log(`Tagged asset ${assetId} with ${tagsToApply.length} tags (${lashType}, ${usage})`)
  }

  console.log("\n=== COMPLETE ===")
  console.log(`Uploaded and tagged ${uploadedAssets.length} photos for the Find Your Look Quiz`)
  console.log("\nSummary by lash type:")
  const byType: Record<string, number> = {}
  for (const a of uploadedAssets) {
    byType[a.lashType] = (byType[a.lashType] || 0) + 1
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count} photos`)
  }

  console.log("\nSummary by usage:")
  const byUsage: Record<string, number> = {}
  for (const a of uploadedAssets) {
    byUsage[a.usage] = (byUsage[a.usage] || 0) + 1
  }
  for (const [usage, count] of Object.entries(byUsage)) {
    console.log(`  ${usage}: ${count} photos`)
  }
}

main().catch(console.error)
