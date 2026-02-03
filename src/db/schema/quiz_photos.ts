import { pgEnum, pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core"
import { assets } from "./assets"

// Lash styles for the quiz (excluding lashLift which was removed)
export const quizLashStyle = pgEnum("quiz_lash_style", ["classic", "hybrid", "wetAngel", "volume"])

// Crop data structure for square crops
export interface QuizPhotoCropData {
  x: number      // 0-100 percentage (center point)
  y: number      // 0-100 percentage (center point)
  scale: number  // zoom multiplier (higher = tighter crop)
}

export const quizPhotos = pgTable("quiz_photos", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Reference to DAM asset
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id, { onDelete: "cascade" }),

  // Lash style this photo represents
  lashStyle: quizLashStyle("lash_style").notNull(),

  // Square crop data for quiz display
  cropData: jsonb("crop_data").$type<QuizPhotoCropData>(),

  // Pre-generated cropped image URL (optional, for performance)
  cropUrl: text("crop_url"),

  // Whether this photo is active in the quiz
  isEnabled: boolean("is_enabled").default(true).notNull(),

  // Display order within the style group (for admin sorting)
  sortOrder: integer("sort_order").default(0).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertQuizPhoto = typeof quizPhotos.$inferInsert
export type SelectQuizPhoto = typeof quizPhotos.$inferSelect

// Result page settings for each lash style
export const quizResultSettings = pgTable("quiz_result_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Lash style this setting is for (unique per style)
  lashStyle: quizLashStyle("lash_style").notNull().unique(),

  // Result image (optional - references DAM asset)
  resultImageAssetId: uuid("result_image_asset_id")
    .references(() => assets.id, { onDelete: "set null" }),

  // Square crop data for result image
  resultImageCropData: jsonb("result_image_crop_data").$type<QuizPhotoCropData>(),

  // Pre-generated cropped result image URL
  resultImageCropUrl: text("result_image_crop_url"),

  // Display name shown on results (e.g., "Classic Lashes")
  displayName: text("display_name").notNull(),

  // Description paragraph
  description: text("description").notNull(),

  // "Best for" bullet points (stored as JSON array)
  bestFor: jsonb("best_for").$type<string[]>().default([]).notNull(),

  // Recommended service name
  recommendedService: text("recommended_service").notNull(),

  // Booking button label
  bookingLabel: text("booking_label").notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertQuizResultSettings = typeof quizResultSettings.$inferInsert
export type SelectQuizResultSettings = typeof quizResultSettings.$inferSelect
