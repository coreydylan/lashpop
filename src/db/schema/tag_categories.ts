import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core"

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

  // Collection-specific fields
  isCollection: boolean("is_collection").notNull().default(false), // Marks this category as a collection
  permissions: jsonb("permissions"), // Permission rules per tag value: { "tagName": { viewers: [], editors: [] } }
  defaultViewConfig: jsonb("default_view_config"), // Default view settings per tag value: { "tagName": { groupBy, hideTags, showTags } }

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertTagCategory = typeof tagCategories.$inferInsert
export type SelectTagCategory = typeof tagCategories.$inferSelect
