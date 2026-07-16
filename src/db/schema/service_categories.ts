import { pgTable, text, timestamp, uuid, integer, boolean } from "../sqlite-core"

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  name: text("name").notNull().unique(),
  // Optional LashPop-facing label. `name` mirrors Vagaro for one-to-one
  // categories; this override lets marketing copy stay deliberate (for
  // example Vagaro "Skincare & Facials" is shown publicly as "Skincare").
  displayName: text("display_name"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  tagline: text("tagline"), // Short tagline displayed on landing page service cards (e.g., "Wake up ready.")
  icon: text("icon"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  // `vagaro`: one Vagaro category owns this row; `merged`: multiple Vagaro
  // categories map here; `manual`: LashPop owns it (for example Botox).
  sourceType: text("source_type").default("manual").notNull(),
  showInBooking: boolean("show_in_booking").default(true).notNull(),
  syncStatus: text("sync_status").default("manual").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  // Key image for category (used as fallback for subcategories and services)
  // Note: Cannot reference assets here due to circular dependency - use UUID directly
  keyImageAssetId: uuid("key_image_asset_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertServiceCategory = typeof serviceCategories.$inferInsert
export type SelectServiceCategory = typeof serviceCategories.$inferSelect
