import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"

/**
 * Work With Us Carousel Photos Table
 * Stores photos selected for the carousel on the Work With Us page
 */
export const workWithUsCarouselPhotos = pgTable("work_with_us_carousel_photos", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Reference to DAM asset
  assetId: uuid("asset_id").notNull(),

  // Display order (0 = first)
  sortOrder: integer("sort_order").notNull().default(0),

  // Whether this photo is currently enabled
  isEnabled: boolean("is_enabled").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertWorkWithUsCarouselPhoto = typeof workWithUsCarouselPhotos.$inferInsert
export type SelectWorkWithUsCarouselPhoto = typeof workWithUsCarouselPhotos.$inferSelect
