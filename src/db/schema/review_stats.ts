import { pgTable, text, timestamp, uuid, decimal, integer } from "../sqlite-core"

export const reviewStats = pgTable("review_stats", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  source: text("source").notNull().unique(), // yelp, google, vagaro
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type ReviewStat = typeof reviewStats.$inferSelect
export type InsertReviewStat = typeof reviewStats.$inferInsert

