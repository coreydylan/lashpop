import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"
import { tagCategories } from "./tag_categories"

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Parent category
  categoryId: uuid("category_id")
    .notNull()
    .references(() => tagCategories.id, { onDelete: "cascade" }),

  // Tag information
  name: text("name").notNull(), // Internal identifier (e.g., "c_curl")
  displayName: text("display_name").notNull(), // User-facing name (e.g., "C Curl")
  description: text("description"), // Optional description

  // Display properties
  sortOrder: integer("sort_order").notNull().default(0), // Order within category

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertTag = typeof tags.$inferInsert
export type SelectTag = typeof tags.$inferSelect
