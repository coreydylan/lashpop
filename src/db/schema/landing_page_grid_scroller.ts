import { pgTable, timestamp, uuid, integer, jsonb, text } from "drizzle-orm/pg-core"

/**
 * Grid Scroller Configuration
 * Controls the grid scroller section settings
 */
export const landingPageGridScroller = pgTable("landing_page_grid_scroller", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Tag filter for pulling images from DAM
  damTagFilter: text("dam_tag_filter").default("website/grid-scroller"), // Which tag to use from DAM
  maxImages: integer("max_images").default(20).notNull(), // Maximum number of images to display

  // Layout settings
  targetRowHeight: integer("target_row_height").default(300), // Target height for justified layout
  rowPadding: integer("row_padding").default(8), // Padding between rows

  // Animation settings
  settings: jsonb("settings").$type<{
    enableParallax?: boolean
    scrollSpeed?: number
    enableLazyLoad?: boolean
    containerMaxWidth?: number
  }>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertLandingPageGridScroller = typeof landingPageGridScroller.$inferInsert
export type SelectLandingPageGridScroller = typeof landingPageGridScroller.$inferSelect
