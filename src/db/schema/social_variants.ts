import { pgTable, text, timestamp, uuid, integer, jsonb, boolean } from "drizzle-orm/pg-core"
import { assets } from "./assets"

/**
 * Social media variant assets generated from source images
 * These are optimized versions of source assets for specific platforms and formats
 */
export const socialVariants = pgTable("social_variants", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Reference to source asset
  sourceAssetId: uuid("source_asset_id")
    .references(() => assets.id, { onDelete: "cascade" })
    .notNull(),

  // Variant information
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(), // S3 URL
  fileSize: integer("file_size").notNull(), // in bytes
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  mimeType: text("mime_type").notNull(),

  // Platform and format metadata
  platform: text("platform").notNull(), // 'instagram', 'facebook', 'twitter', 'linkedin', etc.
  variant: text("variant").notNull(), // 'square-post', 'story', 'reel', 'link-preview', etc.
  ratio: text("ratio").notNull(), // '1:1', '9:16', '16:9', '4:5', etc.
  dimensions: text("dimensions").notNull(), // '1080x1080', '1080x1920', etc.

  // Crop and processing metadata
  cropStrategy: text("crop_strategy"), // 'smart-crop', 'manual', 'center', 'face-detection'
  cropData: jsonb("crop_data"), // { x, y, width, height, focal_point, etc. }

  // Quality and validation
  validationScore: integer("validation_score"), // 0-100, quality/compliance score
  validationWarnings: jsonb("validation_warnings"), // Array of warning messages

  // Export tracking
  exported: boolean("exported").default(false),
  exportedAt: timestamp("exported_at"),
  exportCount: integer("export_count").default(0),

  // Additional metadata
  metadata: jsonb("metadata"), // Flexible field for additional data
  altText: text("alt_text"),
  caption: text("caption"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertSocialVariant = typeof socialVariants.$inferInsert
export type SelectSocialVariant = typeof socialVariants.$inferSelect
