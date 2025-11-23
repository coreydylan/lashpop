import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core"

/**
 * Hero Section Configuration
 * Manages the arch image, positioning, and hero content
 */
export const landingPageHero = pgTable("landing_page_hero", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Hero arch image from DAM
  archAssetId: uuid("arch_asset_id"), // References assets table
  archImageUrl: text("arch_image_url"), // Fallback if not using DAM

  // Image positioning within the arch (for virtual crop editor)
  imagePosition: jsonb("image_position").$type<{
    x: number // X offset as percentage
    y: number // Y offset as percentage
    scale: number // Scale factor
    rotation?: number // Optional rotation
  }>(),

  // Hero text content
  heading: text("heading"),
  tagline: text("tagline"),
  description: text("description"),
  location: text("location"),

  // Trust indicators/stats
  trustIndicators: jsonb("trust_indicators").$type<Array<{
    label: string
    value: string
    icon?: string
  }>>(),

  // CTA buttons
  primaryCta: jsonb("primary_cta").$type<{
    text: string
    url: string
    variant?: string
  }>(),
  secondaryCta: jsonb("secondary_cta").$type<{
    text: string
    url: string
    variant?: string
  }>(),

  // Background effects
  backgroundSettings: jsonb("background_settings").$type<{
    enableParallax?: boolean
    overlayOpacity?: number
    overlayColor?: string
  }>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertLandingPageHero = typeof landingPageHero.$inferInsert
export type SelectLandingPageHero = typeof landingPageHero.$inferSelect
