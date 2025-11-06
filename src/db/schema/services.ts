import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"
import { serviceCategories } from "./service_categories"

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => serviceCategories.id, { onDelete: "cascade" }),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertService = typeof services.$inferInsert
export type SelectService = typeof services.$inferSelect
