import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core"

/**
 * Instagram Carousel Configuration
 * Controls which images from DAM appear in the IG carousel
 */
export const landingPageInstagram = pgTable("landing_page_instagram", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Configuration
  maxImages: integer("max_images").default(10).notNull(), // Maximum number of images to display
  autoScrollSpeed: integer("auto_scroll_speed").default(3000), // Milliseconds between scrolls

  // Tag filter for pulling images from DAM
  damTagFilter: text("dam_tag_filter").default("ig_carousel"), // Which tag to use from DAM

  // Advanced settings
  settings: jsonb("settings").$type<{
    enableAutoplay?: boolean
    enableLoop?: boolean
    enableDots?: boolean
    transitionDuration?: number
  }>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertLandingPageInstagram = typeof landingPageInstagram.$inferInsert
export type SelectLandingPageInstagram = typeof landingPageInstagram.$inferSelect
