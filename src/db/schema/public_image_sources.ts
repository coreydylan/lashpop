import { integer, pgTable, text, timestamp } from "../sqlite-core"

/**
 * Public-delivery registry. Storage/admin URLs remain on their owning rows;
 * this table records which immutable Cloudflare Images object is safe to
 * expose for a stable source identity.
 */
export const publicImageSources = pgTable("public_image_sources", {
  sourceKey: text("source_key").primaryKey(),
  sourceKind: text("source_kind").notNull(),
  sourceUrl: text("source_url").notNull(),
  cloudflareImageId: text("cloudflare_image_id").notNull(),
  deliveryUrl: text("delivery_url").notNull(),
  previousCloudflareImageId: text("previous_cloudflare_image_id"),
  sourceEtag: text("source_etag"),
  sourceLastModified: text("source_last_modified"),
  sourceContentLength: integer("source_content_length"),
  sourceContentHash: text("source_content_hash"),
  status: text("status").default("ready").notNull(),
  failureCount: integer("failure_count").default(0).notNull(),
  lastError: text("last_error"),
  checkedAt: timestamp("checked_at").notNull(),
  ingestedAt: timestamp("ingested_at").notNull(),
  refreshedAt: timestamp("refreshed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type SelectPublicImageSource = typeof publicImageSources.$inferSelect
export type InsertPublicImageSource = typeof publicImageSources.$inferInsert
