import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // Key image for category (used as fallback for subcategories and services)
  // Note: Cannot reference assets here due to circular dependency - use UUID directly
  keyImageAssetId: uuid("key_image_asset_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertServiceCategory = typeof serviceCategories.$inferInsert
export type SelectServiceCategory = typeof serviceCategories.$inferSelect
