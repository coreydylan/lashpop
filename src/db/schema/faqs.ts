import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"

/**
 * FAQ Categories Table
 * Groups FAQs into logical categories (e.g., "Lash Extensions", "Policies")
 */
export const faqCategories = pgTable("faq_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Category information
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  
  // Display settings
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

/**
 * FAQ Items Table
 * Individual FAQ questions and answers
 */
export const faqItems = pgTable("faq_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Category reference
  categoryId: uuid("category_id")
    .notNull()
    .references(() => faqCategories.id, { onDelete: "cascade" }),
  
  // FAQ content
  question: text("question").notNull(),
  answer: text("answer").notNull(), // HTML content supported
  
  // Display settings
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false), // For "Top FAQs"
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertFaqCategory = typeof faqCategories.$inferInsert
export type SelectFaqCategory = typeof faqCategories.$inferSelect
export type InsertFaqItem = typeof faqItems.$inferInsert
export type SelectFaqItem = typeof faqItems.$inferSelect

