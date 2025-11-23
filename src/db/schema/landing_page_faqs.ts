import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"

/**
 * FAQ Items for Landing Page
 * Manages frequently asked questions
 */
export const landingPageFaqs = pgTable("landing_page_faqs", {
  id: uuid("id").defaultRandom().primaryKey(),

  question: text("question").notNull(),
  answer: text("answer").notNull(),

  // Display configuration
  displayOrder: integer("display_order").default(0).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  category: text("category"), // Optional: group FAQs by category

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertLandingPageFaq = typeof landingPageFaqs.$inferInsert
export type SelectLandingPageFaq = typeof landingPageFaqs.$inferSelect
