import { pgTable, uuid, timestamp } from "../sqlite-core"
import { assets } from "./assets"
import { services } from "./services"

// Junction table for many-to-many relationship between assets and services
// One asset can showcase multiple service types
export const assetServices = pgTable("asset_services", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),

  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id, { onDelete: "cascade" }),

  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),

  // When this tag was added
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertAssetService = typeof assetServices.$inferInsert
export type SelectAssetService = typeof assetServices.$inferSelect
