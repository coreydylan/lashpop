import { pgEnum, pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"
import { teamMembers } from "./team_members"

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
