/**
 * Onboarding Imported Assets Schema
 *
 * Tracks images and assets imported from external sources during onboarding
 * These can be used to seed the user's DAM and generate initial examples
 */

import { pgTable, uuid, text, timestamp, integer, json, boolean } from 'drizzle-orm/pg-core'
import { user } from './auth_user'
import { onboardingConnectedAccounts } from './onboarding_connected_accounts'

export const onboardingImportedAssets = pgTable('onboarding_imported_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  sourceAccountId: uuid('source_account_id').references(() => onboardingConnectedAccounts.id, { onDelete: 'set null' }),

  // Asset source information
  sourceType: text('source_type').notNull(), // 'instagram', 'website', 'upload', etc.
  sourceUrl: text('source_url'), // Original URL of the asset
  sourceCaption: text('source_caption'), // Original caption/description
  sourceMetadata: json('source_metadata').$type<{
    postId?: string
    timestamp?: string
    likes?: number
    comments?: number
    hashtags?: string[]
    location?: string
    [key: string]: any
  }>(),

  // Imported asset storage
  s3Key: text('s3_key').notNull(), // S3 storage key
  s3Url: text('s3_url').notNull(), // Full S3 URL
  thumbnailS3Key: text('thumbnail_s3_key'),
  thumbnailS3Url: text('thumbnail_s3_url'),

  // Asset metadata
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'), // Size in bytes
  mimeType: text('mime_type'), // image/jpeg, image/png, etc.
  width: integer('width'),
  height: integer('height'),

  // AI analysis
  aiAnalysis: json('ai_analysis').$type<{
    tags?: string[]
    dominantColors?: string[]
    description?: string
    subjects?: string[]
    aestheticScore?: number
    usageSuggestions?: string[] // Suggested use cases for this image
  }>(),

  // Import status
  importStatus: text('import_status').default('pending'), // 'pending', 'importing', 'completed', 'failed'
  importError: text('import_error'),

  // Usage in example generation
  usedInExamples: boolean('used_in_examples').default(false),
  exampleGenerationData: json('example_generation_data').$type<{
    exampleType?: string
    generatedAt?: string
    metadata?: Record<string, any>
  }>(),

  // User selection for final import
  selectedForImport: boolean('selected_for_import').default(true),
  importedToDam: boolean('imported_to_dam').default(false),
  damAssetId: uuid('dam_asset_id'), // Link to final DAM asset if imported

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type OnboardingImportedAsset = typeof onboardingImportedAssets.$inferSelect
export type NewOnboardingImportedAsset = typeof onboardingImportedAssets.$inferInsert
