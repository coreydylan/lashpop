import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"
import { serviceCategories } from "./service_categories"

export const serviceSubcategories = pgTable("service_subcategories", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Parent category
  categoryId: uuid("category_id")
    .notNull()
    .references(() => serviceCategories.id, { onDelete: "cascade" }),

  // Subcategory info
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),

  // Display properties
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertServiceSubcategory = typeof serviceSubcategories.$inferInsert
export type SelectServiceSubcategory = typeof serviceSubcategories.$inferSelect
