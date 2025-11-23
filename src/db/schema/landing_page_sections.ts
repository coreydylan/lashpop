import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from "drizzle-orm/pg-core"

/**
 * Landing Page Sections Configuration
 * Controls which sections are visible and their order on landing-v2
 */
export const landingPageSections = pgTable("landing_page_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionKey: text("section_key").notNull().unique(), // e.g., 'hero', 'grid_scroller', 'team', etc.
  sectionName: text("section_name").notNull(), // Display name in admin
  isVisible: boolean("is_visible").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),

  // Generic settings that can apply to any section
  settings: jsonb("settings").$type<Record<string, any>>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertLandingPageSection = typeof landingPageSections.$inferInsert
export type SelectLandingPageSection = typeof landingPageSections.$inferSelect
