import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"

export const tagCategories = pgTable("tag_categories", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Category information
  name: text("name").notNull().unique(), // Internal identifier (e.g., "lash_type")
  displayName: text("display_name").notNull(), // User-facing name (e.g., "Lash Type")
  description: text("description"), // Optional description

  // Display properties
  color: text("color"), // Hex color for the category
  icon: text("icon"), // Optional icon identifier
  sortOrder: integer("sort_order").notNull().default(0), // Order in which to display

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertTagCategory = typeof tagCategories.$inferInsert
export type SelectTagCategory = typeof tagCategories.$inferSelect
