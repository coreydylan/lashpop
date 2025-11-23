import { pgTable, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"
import { reviews } from "./reviews"

/**
 * Landing Page Review Display
 * Controls which reviews appear on the homepage and their order
 */
export const landingPageReviews = pgTable("landing_page_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),

  // Display configuration
  displayOrder: integer("display_order").default(0).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(), // Pin to top or highlight

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertLandingPageReview = typeof landingPageReviews.$inferInsert
export type SelectLandingPageReview = typeof landingPageReviews.$inferSelect
