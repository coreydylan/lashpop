import { pgTable, text, timestamp, uuid, decimal, integer } from "drizzle-orm/pg-core"

export const reviewStats = pgTable("review_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source").notNull().unique(), // yelp, google, vagaro
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type ReviewStat = typeof reviewStats.$inferSelect
export type InsertReviewStat = typeof reviewStats.$inferInsert

