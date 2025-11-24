import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core"

/**
 * Website Settings Table
 * Stores configuration for various sections of the landing page
 */
export const websiteSettings = pgTable("website_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Section identifier (e.g., 'hero', 'reviews', 'instagram')
  section: text("section").notNull().unique(),
  
  // JSON configuration for the section
  config: jsonb("config").$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

/**
 * Selected Homepage Reviews
 * Stores which reviews are selected for the homepage and their display order
 */
export const homepageReviews = pgTable("homepage_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Reference to the review
  reviewId: uuid("review_id").notNull(),
  
  // Display order (0 = first)
  displayOrder: integer("display_order").notNull().default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertWebsiteSetting = typeof websiteSettings.$inferInsert
export type SelectWebsiteSetting = typeof websiteSettings.$inferSelect
export type InsertHomepageReview = typeof homepageReviews.$inferInsert
export type SelectHomepageReview = typeof homepageReviews.$inferSelect

