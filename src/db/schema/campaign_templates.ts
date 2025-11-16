import { pgTable, text, timestamp, uuid, integer, jsonb, boolean } from "drizzle-orm/pg-core"
import { campaignObjective } from "./campaigns"
import { authUser } from "./auth_user"

export const campaignTemplates = pgTable("campaign_templates", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic information
  name: text("name").notNull(),
  description: text("description"),
  category: campaignObjective("category").notNull(),

  // Template structure
  structure: jsonb("structure").$type<{
    phases?: Array<{
      name: string
      duration: string
      postCount: number
      description?: string
    }>
    timeline?: {
      totalDuration: string
      milestones: string[]
    }
    deliverables?: Array<{
      name: string
      quantity: number
      role: string
      platform?: string
    }>
  }>(),

  // Variable slots (to be filled by user)
  variables: jsonb("variables").$type<{
    brandAssets?: {
      required: boolean
      types: string[]
      description?: string
    }
    colors?: {
      required: boolean
      count: number
      description?: string
    }
    inspiration?: {
      required: boolean
      minCount: number
      description?: string
    }
    products?: {
      required: boolean
      minCount: number
      description?: string
    }
  }>(),

  // AI instructions
  instructions: jsonb("instructions").$type<{
    visualDirection?: string
    copyDirection?: string
    brandConsiderations?: string
    technicalRequirements?: string
    platformGuidelines?: Record<string, string>
  }>(),

  // Template metadata
  isPublic: boolean("is_public").notNull().default(false),
  isSystem: boolean("is_system").notNull().default(false), // System templates cannot be deleted
  usageCount: integer("usage_count").notNull().default(0),

  // Creator
  createdBy: uuid("created_by")
    .references(() => authUser.id, { onDelete: "set null" }),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertCampaignTemplate = typeof campaignTemplates.$inferInsert
export type SelectCampaignTemplate = typeof campaignTemplates.$inferSelect
