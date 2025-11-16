/**
 * Onboarding Brand Data Schema
 *
 * Stores AI-extracted brand information including colors, logo, typography,
 * and other brand assets discovered during onboarding
 */

import { pgTable, uuid, text, timestamp, json, boolean } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const onboardingBrandData = pgTable('onboarding_brand_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Logo information
  logoUrl: text('logo_url'), // URL to detected/uploaded logo
  logoS3Key: text('logo_s3_key'), // S3 storage key for logo
  logoDetectionSource: text('logo_detection_source'), // 'website', 'instagram', 'upload', etc.
  logoDetectionConfidence: text('logo_detection_confidence'), // 'high', 'medium', 'low'

  // Brand colors
  primaryColor: text('primary_color'), // Hex color (e.g., #FF5733)
  secondaryColor: text('secondary_color'),
  accentColor: text('accent_color'),
  colorPalette: json('color_palette').$type<{
    colors: string[] // Array of hex colors
    dominantColors?: string[]
    complementaryColors?: string[]
    source?: string // Where colors were extracted from
  }>(),

  // Typography (if detectable)
  primaryFont: text('primary_font'),
  secondaryFont: text('secondary_font'),
  fontPairings: json('font_pairings').$type<{
    heading?: string
    body?: string
    accent?: string
  }>(),

  // Brand style metadata
  brandKeywords: json('brand_keywords').$type<string[]>(), // Keywords describing brand aesthetic
  brandPersonality: text('brand_personality'), // AI-detected personality (e.g., 'luxurious', 'playful', 'minimalist')
  industryCategory: text('industry_category'), // Detected industry

  // AI extraction metadata
  aiExtractionStatus: text('ai_extraction_status').default('pending'), // 'pending', 'in_progress', 'completed', 'failed'
  aiExtractionError: text('ai_extraction_error'),
  aiModel: text('ai_model'), // Which AI model was used for extraction
  aiConfidenceScore: text('ai_confidence_score'), // Overall confidence in extraction

  // Raw AI response (for debugging/refinement)
  rawAiResponse: json('raw_ai_response').$type<Record<string, any>>(),

  // User modifications
  userApproved: boolean('user_approved').default(false),
  userModified: boolean('user_modified').default(false),
  lastModifiedAt: timestamp('last_modified_at'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type OnboardingBrandData = typeof onboardingBrandData.$inferSelect
export type NewOnboardingBrandData = typeof onboardingBrandData.$inferInsert
