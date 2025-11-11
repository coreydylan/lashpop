import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core"
import { assets } from "./assets"
import { tags } from "./tags"

// Junction table for many-to-many relationship between assets and tags
// One asset can have multiple tags, one tag can be applied to multiple assets
export const assetTags = pgTable("asset_tags", {
  id: uuid("id").defaultRandom().primaryKey(),

  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id, { onDelete: "cascade" }),

  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),

  // When this tag was added
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertAssetTag = typeof assetTags.$inferInsert
export type SelectAssetTag = typeof assetTags.$inferSelect
