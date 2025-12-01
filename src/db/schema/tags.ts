import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"
import { tagCategories } from "./tag_categories"
import { serviceCategories } from "./service_categories"
import { services } from "./services"

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Parent category (tag_categories table)
  categoryId: uuid("category_id")
    .notNull()
    .references(() => tagCategories.id, { onDelete: "cascade" }),

  // Parent tag (for nested hierarchy within a category)
  // e.g., "Brow Lamination" -> parent is "Brows"
  parentTagId: uuid("parent_tag_id"),
  // Note: Self-referential FK added via raw SQL migration to avoid circular reference issues

  // Tag information
  name: text("name").notNull(), // Internal identifier (e.g., "c_curl")
  displayName: text("display_name").notNull(), // User-facing name (e.g., "C Curl")
  description: text("description"), // Optional description

  // Link to service category (for top-level Service Type tags like "Lashes", "Brows")
  serviceCategoryId: uuid("service_category_id")
    .references(() => serviceCategories.id, { onDelete: "set null" }),

  // Link to individual service (for leaf-level Service Type tags like "Brow Lamination")
  serviceId: uuid("service_id")
    .references(() => services.id, { onDelete: "set null" }),

  // Display properties
  sortOrder: integer("sort_order").notNull().default(0), // Order within category/parent

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertTag = typeof tags.$inferInsert
export type SelectTag = typeof tags.$inferSelect
