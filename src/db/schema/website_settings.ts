import { pgTable, text, timestamp, uuid, integer, jsonb, boolean } from "../sqlite-core"

/**
 * Website Settings Table
 * Stores configuration for various sections of the landing page
 */
export const websiteSettings = pgTable("website_settings", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  
  // Section identifier (e.g., 'hero', 'reviews', 'instagram')
  section: text("section").notNull().unique(),
  
  // JSON configuration for the section
  config: jsonb("config").$type<Record<string, unknown>>(),

  // Publishing metadata used for ownership labels, history, and optimistic
  // concurrency. Existing writers can omit these fields safely.
  sourceOwner: text("source_owner").default("lashpop").notNull(),
  version: integer("version").default(1).notNull(),
  updatedByUserId: text("updated_by_user_id"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

/**
 * Selected Homepage Reviews
 * Stores which reviews are selected for the homepage and their display order
 */
export const homepageReviews = pgTable("homepage_reviews", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  
  // Reference to the review
  reviewId: uuid("review_id").notNull(),

  // Display order (0 = first)
  displayOrder: integer("display_order").notNull().default(0),

  // Admin-pinned rows survive auto-rotation. Auto-promoted rows are deleted
  // and re-inserted every Worker tick.
  isPinned: boolean("is_pinned").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertWebsiteSetting = typeof websiteSettings.$inferInsert
export type SelectWebsiteSetting = typeof websiteSettings.$inferSelect
export type InsertHomepageReview = typeof homepageReviews.$inferInsert
export type SelectHomepageReview = typeof homepageReviews.$inferSelect
