import { pgEnum, pgTable, text, timestamp, uuid, integer, jsonb, boolean } from "drizzle-orm/pg-core"
import { tagCategories } from "./tag_categories"
import { authUser } from "./auth_user"

export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "generating_brief",
  "brief_ready",
  "generating_assets",
  "quality_check",
  "refining",
  "review",
  "approved",
  "scheduled",
  "live",
  "completed",
  "archived"
])

export const campaignObjective = pgEnum("campaign_objective", [
  "product_launch",
  "seasonal",
  "brand_awareness",
  "event",
  "engagement",
  "conversion",
  "custom"
])

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic information
  name: text("name").notNull(),
  description: text("description"),
  objective: campaignObjective("objective").notNull(),
  status: campaignStatus("status").notNull().default("draft"),

  // Associated collection (campaigns extend collections)
  collectionTagCategoryId: uuid("collection_tag_category_id")
    .references(() => tagCategories.id, { onDelete: "set null" }),

  // Creator
  createdBy: uuid("created_by")
    .references(() => authUser.id, { onDelete: "set null" }),

  // User-selected inputs
  brandAssets: jsonb("brand_assets").$type<{
    logos?: string[]           // Asset IDs
    colors?: string[]          // Color palette asset IDs
    typography?: string[]      // Font asset IDs
    guidelines?: string[]      // Brand guideline document IDs
  }>(),

  inspiration: jsonb("inspiration").$type<{
    photos?: string[]          // Inspiration photo asset IDs
    styleReferences?: string[] // Reference image asset IDs
    moodBoards?: string[]      // Collection IDs
    competitors?: string[]     // Competitor example asset IDs
  }>(),

  requirements: jsonb("requirements").$type<{
    platforms?: Array<{
      name: string
      types: string[]
    }>
    deliverables?: string[]
    constraints?: string[]
    budget?: number
    targetAudience?: string
    timeline?: {
      startDate?: string
      endDate?: string
      phases?: Array<{
        name: string
        duration: string
        postCount: number
      }>
    }
  }>(),

  // AI-generated creative brief
  creativeBrief: jsonb("creative_brief").$type<{
    visualDirection?: {
      colorPalette?: {
        primary: string
        secondary: string
        accent: string
        rationale: string
      }
      composition?: {
        style: string
        layout: string
        lighting: string
      }
      mood?: {
        primary: string
        secondary: string
        avoid: string[]
      }
      productPlacement?: {
        prominence: string
        context: string
        angle: string
      }
    }
    copyDirection?: {
      tone: string
      voice: string
      keywords: string[]
      avoid: string[]
    }
    technicalSpecs?: {
      resolution: string
      format: string
      colorSpace: string
      safeZones: string
    }
    brandCompliance?: {
      requiredElements: string[]
      prohibitedElements: string[]
      qualityThresholds: {
        brandAlignment: number
        visualQuality: number
        accessibility: string
      }
    }
  }>(),

  // Generation metadata
  generationMetadata: jsonb("generation_metadata").$type<{
    totalAssets?: number
    generatedAssets?: number
    failedAssets?: number
    refinedAssets?: number
    totalCost?: number
    totalTime?: number
    iterations?: number
    conductor?: {
      model: string
      timestamp: string
    }
  }>(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  completedAt: timestamp("completed_at")
})

export type InsertCampaign = typeof campaigns.$inferInsert
export type SelectCampaign = typeof campaigns.$inferSelect
