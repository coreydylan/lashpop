import { pgEnum, pgTable, text, timestamp, uuid, integer, jsonb, boolean } from "drizzle-orm/pg-core"
import { campaigns } from "./campaigns"
import { assets } from "./assets"

export const assetRole = pgEnum("asset_role", [
  "hero",
  "product_shot",
  "lifestyle",
  "detail",
  "teaser",
  "cta",
  "social_variant",
  "email_header",
  "web_banner",
  "story",
  "custom"
])

export const generationStatus = pgEnum("generation_status", [
  "pending",
  "generating",
  "generated",
  "quality_check",
  "failed",
  "refining",
  "approved",
  "rejected"
])

export const campaignAssets = pgTable("campaign_assets", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Relationships
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),

  assetId: uuid("asset_id")
    .references(() => assets.id, { onDelete: "set null" }),

  // Asset specification
  role: assetRole("role").notNull(),
  purpose: text("purpose").notNull(), // What this asset is for
  platform: text("platform"),         // Target platform (instagram, tiktok, etc.)
  variant: text("variant"),           // Variant name (feed-post, story, reel-cover, etc.)

  // Asset specification from brief
  assetSpec: jsonb("asset_spec").$type<{
    ratio?: string
    composition?: string
    mood?: string
    colorEmphasis?: string
    textPlacement?: string
    requiredElements?: string[]
    technicalRequirements?: Record<string, any>
  }>(),

  // Generation details
  status: generationStatus("status").notNull().default("pending"),
  generationPrompt: text("generation_prompt"),
  generationModel: text("generation_model"),
  generationCost: integer("generation_cost"), // in cents
  generationTime: integer("generation_time"), // in milliseconds
  generationAttempts: integer("generation_attempts").default(0),

  // Quality control results
  qualityCheckResults: jsonb("quality_check_results").$type<{
    score?: number
    passed?: boolean
    checks?: Array<{
      name: string
      passed: boolean
      score: number
      details?: Record<string, any>
    }>
    feedback?: string[]
    requiresRefinement?: boolean
  }>(),

  // Refinement history
  refinementHistory: jsonb("refinement_history").$type<Array<{
    iteration: number
    changes: string[]
    strategy: string
    previousAssetId?: string
    timestamp: string
    result: {
      score: number
      passed: boolean
    }
  }>>(),

  // Approval
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: text("rejected_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),

  // Ordering
  sortOrder: integer("sort_order").notNull().default(0),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertCampaignAsset = typeof campaignAssets.$inferInsert
export type SelectCampaignAsset = typeof campaignAssets.$inferSelect
