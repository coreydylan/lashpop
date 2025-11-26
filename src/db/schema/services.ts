import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core"
import { serviceCategories } from "./service_categories"
import { serviceSubcategories } from "./service_subcategories"

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Vagaro Integration - Source of truth for core service data
  vagaroServiceId: text("vagaro_service_id").unique(), // Links to Vagaro service
  vagaroParentServiceId: text("vagaro_parent_service_id"), // Links to parent category in Vagaro
  vagaroWidgetUrl: text("vagaro_widget_url"), // Vagaro embed script URL (from Vagaro's "Embed Code" > copy the script src URL)
  vagaroData: jsonb("vagaro_data").$type<any>(), // Store full Vagaro response for reference

  // Local enrichment fields (not in Vagaro)
  categoryId: uuid("category_id")
    .references(() => serviceCategories.id, { onDelete: "set null" }),
  subcategoryId: uuid("subcategory_id")
    .references(() => serviceSubcategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  priceStarting: integer("price_starting").notNull(), // Store in cents
  imageUrl: text("image_url"),
  color: text("color"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // Additional categorization fields (required by database)
  mainCategory: text("main_category").notNull(), // "Lash Services", "Brow Services", etc.
  subCategory: text("sub_category"), // "Classic Extensions", "Volume Extensions", etc.
  displayTitle: text("display_title"), // Short display name like "Fill", "Full Set", etc.

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at") // Track when last synced from Vagaro
})

export type InsertService = typeof services.$inferInsert
export type SelectService = typeof services.$inferSelect
