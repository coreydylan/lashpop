import { pgEnum, pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"
import { teamMembers } from "./team_members"
import { user } from "./auth_user"

export const assetType = pgEnum("asset_type", ["image", "video"])
export const lashColor = pgEnum("lash_color", ["brown", "black"])
export const lashLength = pgEnum("lash_length", ["S", "M", "L"])
export const lashCurl = pgEnum("lash_curl", ["1", "2", "3", "4"])

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
  ownerId: text("owner_id")
    .references(() => user.id, { onDelete: "set null" }), // User who owns/created this asset

  // Sharing and visibility
  isPublic: boolean("is_public").notNull().default(false), // Whether asset is publicly accessible
  visibility: text("visibility").notNull().default("private"), // 'private', 'shared', 'public'

  // Lash characteristics (tagging metadata)
  color: lashColor("color"),
  length: lashLength("length"),
  curl: lashCurl("curl"),

  // Additional metadata
  altText: text("alt_text"), // Accessibility description
  caption: text("caption"), // Optional caption/notes

  // Timestamps
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertAsset = typeof assets.$inferInsert
export type SelectAsset = typeof assets.$inferSelect
