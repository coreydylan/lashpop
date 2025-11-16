/**
 * Onboarding Connected Accounts Schema
 *
 * Stores user's connected social media accounts and websites
 * for brand data extraction during onboarding
 */

import { pgTable, uuid, text, timestamp, boolean, json } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const onboardingConnectedAccounts = pgTable('onboarding_connected_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Account type and identifier
  accountType: text('account_type').notNull(), // 'instagram', 'website', 'facebook', 'tiktok', 'pinterest', etc.
  accountIdentifier: text('account_identifier').notNull(), // username, URL, etc.

  // Connection metadata
  displayName: text('display_name'), // Friendly display name
  profileUrl: text('profile_url'), // Full URL to the profile/website
  avatarUrl: text('avatar_url'), // Profile picture if available

  // Scraping status
  scrapingStatus: text('scraping_status').default('pending'), // 'pending', 'in_progress', 'completed', 'failed'
  scrapingError: text('scraping_error'), // Error message if scraping failed
  lastScrapedAt: timestamp('last_scraped_at'),

  // Extracted data preview
  extractedData: json('extracted_data').$type<{
    imageCount?: number
    colorsPalette?: string[]
    hasLogo?: boolean
    bio?: string
    followerCount?: number
    metadata?: Record<string, any>
  }>(),

  // Metadata
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type OnboardingConnectedAccount = typeof onboardingConnectedAccounts.$inferSelect
export type NewOnboardingConnectedAccount = typeof onboardingConnectedAccounts.$inferInsert
