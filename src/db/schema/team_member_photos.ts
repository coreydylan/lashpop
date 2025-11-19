import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core"
import { teamMembers } from "./team_members"

export const teamMemberPhotos = pgTable("team_member_photos", {
  id: uuid("id").defaultRandom().primaryKey(),

  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),

  // File information
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(), // URL or path to stored file

  // Is this the primary headshot?
  isPrimary: boolean("is_primary").default(false).notNull(),

  // Crop positions for different formats (stored as percentages)
  // Each format stores: { x: number, y: number, scale: number }
  cropFullVertical: jsonb("crop_full_vertical").$type<{
    x: number
    y: number
    scale: number
  }>(),
  cropFullHorizontal: jsonb("crop_full_horizontal").$type<{
    x: number
    y: number
    scale: number
  }>(),
  cropMediumCircle: jsonb("crop_medium_circle").$type<{
    x: number
    y: number
    scale: number
  }>(),
  cropCloseUpCircle: jsonb("crop_close_up_circle").$type<{
    x: number
    y: number
    scale: number
  }>(),
  cropSquare: jsonb("crop_square").$type<{
    x: number
    y: number
    scale: number
  }>(),

  // Static cropped image URLs
  cropFullVerticalUrl: text("crop_full_vertical_url"),
  cropFullHorizontalUrl: text("crop_full_horizontal_url"),
  cropMediumCircleUrl: text("crop_medium_circle_url"),
  cropCloseUpCircleUrl: text("crop_close_up_circle_url"),
  cropSquareUrl: text("crop_square_url"),

  // Timestamps
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertTeamMemberPhoto = typeof teamMemberPhotos.$inferInsert
export type SelectTeamMemberPhoto = typeof teamMemberPhotos.$inferSelect
