import { getDb } from "./index"
import { tagCategories } from "./schema/tag_categories"
import { tags } from "./schema/tags"
import { eq } from "drizzle-orm"

const TAG_SEED_DATA = [
  {
    category: {
      name: "lash_type",
      displayName: "Lash Type",
      description: "The style of lash extension service",
      color: "#CD9E9E", // dusty-rose
      sortOrder: 1
    },
    tags: [
      { name: "classic", displayName: "Classic", sortOrder: 1 },
      { name: "volume", displayName: "Volume", sortOrder: 2 },
      { name: "mega_volume", displayName: "Mega Volume", sortOrder: 3 },
      { name: "hybrid", displayName: "Hybrid", sortOrder: 4 },
      { name: "wet", displayName: "Wet", sortOrder: 5 }
    ]
  },
  {
    category: {
      name: "curl",
      displayName: "Curl",
      description: "The curl pattern of the lashes",
      color: "#D4AF75", // golden
      sortOrder: 2
    },
    tags: [
      { name: "j_curl", displayName: "J Curl", sortOrder: 1 },
      { name: "b_curl", displayName: "B Curl", sortOrder: 2 },
      { name: "c_curl", displayName: "C Curl", sortOrder: 3 },
      { name: "d_curl", displayName: "D Curl", sortOrder: 4 },
      { name: "l_curl", displayName: "L Curl", sortOrder: 5 },
      { name: "m_curl", displayName: "M Curl", sortOrder: 6 }
    ]
  },
  {
    category: {
      name: "length",
      displayName: "Length",
      description: "The length of the lash extensions",
      color: "#A19781", // sage
      sortOrder: 3
    },
    tags: [
      { name: "short", displayName: "Short (6-9mm)", sortOrder: 1 },
      { name: "medium", displayName: "Medium (10-12mm)", sortOrder: 2 },
      { name: "long", displayName: "Long (13-15mm)", sortOrder: 3 },
      { name: "extra_long", displayName: "Extra Long (16mm+)", sortOrder: 4 }
    ]
  },
  {
    category: {
      name: "color",
      displayName: "Color",
      description: "The color of the lash extensions",
      color: "#8A7C69", // dune
      sortOrder: 4
    },
    tags: [
      { name: "black", displayName: "Black", sortOrder: 1 },
      { name: "brown", displayName: "Brown", sortOrder: 2 },
      { name: "mixed", displayName: "Mixed", sortOrder: 3 },
      { name: "colored", displayName: "Colored", sortOrder: 4 }
    ]
  },
  {
    category: {
      name: "distance",
      displayName: "Distance",
      description: "How close the photo was taken",
      color: "#BCC9C2", // ocean-mist
      sortOrder: 5
    },
    tags: [
      { name: "close_up", displayName: "Close-Up", sortOrder: 1 },
      { name: "medium", displayName: "Medium", sortOrder: 2 },
      { name: "full_face", displayName: "Full Face", sortOrder: 3 },
      { name: "full_body", displayName: "Full Body", sortOrder: 4 }
    ]
  },
  {
    category: {
      name: "angle",
      displayName: "Angle",
      description: "The angle from which the photo was taken",
      color: "#BD8878", // terracotta
      sortOrder: 6
    },
    tags: [
      { name: "front", displayName: "Front", sortOrder: 1 },
      { name: "side", displayName: "Side", sortOrder: 2 },
      { name: "three_quarter", displayName: "3/4 View", sortOrder: 3 },
      { name: "top_down", displayName: "Top-Down", sortOrder: 4 },
      { name: "profile", displayName: "Profile", sortOrder: 5 }
    ]
  },
  {
    category: {
      name: "lighting",
      displayName: "Lighting",
      description: "The type of lighting used",
      color: "#EBE0CB", // warm-sand
      sortOrder: 7
    },
    tags: [
      { name: "natural", displayName: "Natural Light", sortOrder: 1 },
      { name: "studio", displayName: "Studio", sortOrder: 2 },
      { name: "ring_light", displayName: "Ring Light", sortOrder: 3 },
      { name: "backlit", displayName: "Backlit", sortOrder: 4 }
    ]
  },
  {
    category: {
      name: "style",
      displayName: "Style",
      description: "The overall aesthetic style",
      color: "#CD9E9E", // dusty-rose
      sortOrder: 8
    },
    tags: [
      { name: "natural", displayName: "Natural", sortOrder: 1 },
      { name: "glamorous", displayName: "Glamorous", sortOrder: 2 },
      { name: "dramatic", displayName: "Dramatic", sortOrder: 3 },
      { name: "wispy", displayName: "Wispy", sortOrder: 4 },
      { name: "cat_eye", displayName: "Cat Eye", sortOrder: 5 },
      { name: "doll_eye", displayName: "Doll Eye", sortOrder: 6 }
    ]
  },
  {
    category: {
      name: "occasion",
      displayName: "Occasion",
      description: "The intended use or occasion",
      color: "#D4AF75", // golden
      sortOrder: 9
    },
    tags: [
      { name: "everyday", displayName: "Everyday", sortOrder: 1 },
      { name: "bridal", displayName: "Bridal", sortOrder: 2 },
      { name: "special_event", displayName: "Special Event", sortOrder: 3 },
      { name: "editorial", displayName: "Editorial", sortOrder: 4 }
    ]
  },
  {
    category: {
      name: "timeline",
      displayName: "Timeline",
      description: "When in the service process",
      color: "#A19781", // sage
      sortOrder: 10
    },
    tags: [
      { name: "before", displayName: "Before", sortOrder: 1 },
      { name: "during", displayName: "During", sortOrder: 2 },
      { name: "after", displayName: "After", sortOrder: 3 },
      { name: "touch_up", displayName: "Touch-Up", sortOrder: 4 }
    ]
  },
  {
    category: {
      name: "eye_state",
      displayName: "Eye State",
      description: "Whether eyes are open or closed",
      color: "#BCC9C2", // ocean-mist
      sortOrder: 11
    },
    tags: [
      { name: "open", displayName: "Eyes Open", sortOrder: 1 },
      { name: "closed", displayName: "Eyes Closed", sortOrder: 2 }
    ]
  }
]

export async function seedTags() {
  const db = getDb()

  console.log("Starting tag seeding...")

  for (const categoryData of TAG_SEED_DATA) {
    // Check if category already exists
    const [existingCategory] = await db
      .select()
      .from(tagCategories)
      .where(eq(tagCategories.name, categoryData.category.name))
      .limit(1)

    let categoryId: string

    if (existingCategory) {
      console.log(`Category "${categoryData.category.displayName}" already exists, skipping...`)
      categoryId = existingCategory.id
    } else {
      // Insert category (with isCollection and isRating defaulting to false)
      const [newCategory] = await db
        .insert(tagCategories)
        .values({
          ...categoryData.category,
          isCollection: false,
          isRating: false
        })
        .returning()

      categoryId = newCategory.id
      console.log(`✓ Created category: ${categoryData.category.displayName}`)
    }

    // Insert tags
    for (const tagData of categoryData.tags) {
      const [existingTag] = await db
        .select()
        .from(tags)
        .where(eq(tags.name, tagData.name))
        .limit(1)

      if (existingTag) {
        console.log(`  Tag "${tagData.displayName}" already exists, skipping...`)
      } else {
        await db.insert(tags).values({
          ...tagData,
          categoryId
        })
        console.log(`  ✓ Created tag: ${tagData.displayName}`)
      }
    }
  }

  console.log("Tag seeding completed!")
}

// Run if called directly
if (require.main === module) {
  seedTags()
    .then(() => {
      console.log("Done!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error seeding tags:", error)
      process.exit(1)
    })
}
