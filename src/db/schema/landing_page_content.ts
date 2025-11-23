import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * Landing Page Content Sections
 * Stores HTML/text content for sections like founder letter, welcome, etc.
 */
export const landingPageContent = pgTable("landing_page_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionKey: text("section_key").notNull().unique(), // e.g., 'founder_letter', 'welcome', 'faq'

  // Content
  heading: text("heading"),
  subheading: text("subheading"),
  htmlContent: text("html_content"), // For founder letter and rich text sections
  textContent: text("text_content"), // For plain text

  // Media assets
  imageUrl: text("image_url"),
  imageAssetId: uuid("image_asset_id"), // Reference to DAM asset
  svgPath: text("svg_path"), // For SVG graphics like founder letter

  // SEO/Meta
  altText: text("alt_text"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertLandingPageContent = typeof landingPageContent.$inferInsert
export type SelectLandingPageContent = typeof landingPageContent.$inferSelect
