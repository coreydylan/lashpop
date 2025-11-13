import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source").default("vagaro").notNull(),
  sourceUrl: text("source_url").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  subject: text("subject"),
  reviewText: text("review_text").notNull(),
  rating: integer("rating").default(5).notNull(),
  reviewDate: timestamp("review_date"),
  responseText: text("response_text"),
  responseDate: timestamp("response_date"),
  rawPayload: text("raw_payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertReview = typeof reviews.$inferInsert
export type SelectReview = typeof reviews.$inferSelect
