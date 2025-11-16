import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core"

/**
 * Tracks export operations for social variants
 * Maintains history of what was exported, when, and by whom
 */
export const exportHistory = pgTable("export_history", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Export details
  assetIds: jsonb("asset_ids").notNull(), // Array of social variant IDs included in export
  exportedBy: text("exported_by").notNull(), // User ID or email who initiated export

  // Export configuration
  format: text("format"), // 'original', 'jpg', 'png'
  quality: integer("quality"), // 0-100 for JPEG quality
  organization: text("organization"), // 'flat', 'by-platform', 'by-variant', 'by-source'
  includeMetadata: jsonb("include_metadata"), // Boolean, whether metadata JSON files were included
  includeSourceImages: jsonb("include_source_images"), // Boolean, whether source images were included

  // Export results
  fileCount: integer("file_count"),
  totalSize: integer("total_size"), // Total size in bytes
  downloadUrl: text("download_url"), // S3 presigned URL (expires after 24h)
  urlExpiresAt: timestamp("url_expires_at"),

  // Manifest
  manifest: jsonb("manifest"), // { files: [{ path, size, originalAssetId }], ... }

  // Additional metadata
  metadata: jsonb("metadata"), // Flexible field for additional export metadata

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertExportHistory = typeof exportHistory.$inferInsert
export type SelectExportHistory = typeof exportHistory.$inferSelect
