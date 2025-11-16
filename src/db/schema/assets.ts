import { pgEnum, pgTable, text, timestamp, uuid, integer, boolean, jsonb, real, index } from "drizzle-orm/pg-core"
import { teamMembers } from "./team_members"

export const assetType = pgEnum("asset_type", ["image", "video"])
export const lashColor = pgEnum("lash_color", ["brown", "black"])
export const lashLength = pgEnum("lash_length", ["S", "M", "L"])
export const lashCurl = pgEnum("lash_curl", ["1", "2", "3", "4"])

// Social media platform enum
export const socialPlatform = pgEnum("social_platform", [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "youtube",
  "pinterest",
  "tiktok"
])

// Crop strategy enum
export const cropStrategy = pgEnum("crop_strategy", [
  "smart_crop",
  "center_crop",
  "letterbox",
  "extend"
])

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),

  // File information
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(), // URL or path to stored file
  fileType: assetType("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  width: integer("width"),
  height: integer("height"),

  // Relationships
  teamMemberId: uuid("team_member_id")
    .references(() => teamMembers.id, { onDelete: "set null" }),

  // Lash characteristics (tagging metadata)
  color: lashColor("color"),
  length: lashLength("length"),
  curl: lashCurl("curl"),

  // Additional metadata
  altText: text("alt_text"), // Accessibility description
  caption: text("caption"), // Optional caption/notes

  // Social media variant fields (nullable for backward compatibility)
  sourceAssetId: uuid("source_asset_id")
    .references(() => assets.id, { onDelete: "cascade" }), // Self-reference to source asset
  platform: socialPlatform("platform"), // Target social media platform
  variant: text("variant"), // Variant name (e.g., "feed", "story", "reel")
  ratio: text("ratio"), // Aspect ratio (e.g., "1:1", "9:16", "16:9")
  cropStrategy: cropStrategy("crop_strategy"), // Cropping strategy used
  cropData: jsonb("crop_data"), // Crop coordinates and safe zones
  letterboxData: jsonb("letterbox_data"), // Letterbox method and settings
  validationScore: real("validation_score"), // Quality/validation score (0-100)
  validationWarnings: jsonb("validation_warnings"), // Array of warning strings
  exported: boolean("exported").default(false), // Export status
  exportedAt: timestamp("exported_at"), // When exported
  exportedTo: text("exported_to"), // Export destination/path

  // Timestamps
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  // Indexes for efficient querying
  sourceAssetIdIdx: index("assets_source_asset_id_idx").on(table.sourceAssetId),
  platformIdx: index("assets_platform_idx").on(table.platform),
  exportedIdx: index("assets_exported_idx").on(table.exported),
}))

export type InsertAsset = typeof assets.$inferInsert
export type SelectAsset = typeof assets.$inferSelect
