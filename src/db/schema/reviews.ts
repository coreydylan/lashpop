import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"

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

  // SEO/Schema.org visibility controls
  // showOnWebsite: Display publicly on the website
  // includeInSchema: Include in JSON-LD structured data for search engines
  // This allows reviews to be "crawlable" even if not publicly displayed
  showOnWebsite: boolean("show_on_website").default(true),
  includeInSchema: boolean("include_in_schema").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertReview = typeof reviews.$inferInsert
export type SelectReview = typeof reviews.$inferSelect
