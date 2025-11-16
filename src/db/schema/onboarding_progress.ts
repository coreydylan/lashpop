/**
 * Onboarding Progress Schema
 *
 * Tracks user's progress through the onboarding flow
 * Enables resume functionality and analytics
 */

import { pgTable, uuid, text, timestamp, integer, json, boolean } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const onboardingProgress = pgTable('onboarding_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Onboarding state
  currentStep: integer('current_step').default(0), // Current step number
  totalSteps: integer('total_steps').default(7), // Total steps in flow
  status: text('status').default('not_started'), // 'not_started', 'in_progress', 'completed', 'skipped'

  // Step completion tracking
  stepsCompleted: json('steps_completed').$type<{
    welcome?: boolean
    connectAccounts?: boolean
    importData?: boolean
    brandExtraction?: boolean
    colorScheme?: boolean
    logoSetup?: boolean
    exampleGeneration?: boolean
    finalReview?: boolean
  }>(),

  // Step data
  stepData: json('step_data').$type<{
    [stepName: string]: any
  }>(),

  // Time tracking
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  lastActiveAt: timestamp('last_active_at'),
  timeSpentSeconds: integer('time_spent_seconds').default(0),

  // User actions
  skippedSteps: json('skipped_steps').$type<string[]>(),
  revisitedSteps: json('revisited_steps').$type<string[]>(),

  // Analytics
  sourceReferrer: text('source_referrer'), // How they arrived at onboarding
  deviceType: text('device_type'), // 'desktop', 'mobile', 'tablet'
  completionPercentage: integer('completion_percentage').default(0),

  // Feature usage during onboarding
  connectedAccountsCount: integer('connected_accounts_count').default(0),
  importedAssetsCount: integer('imported_assets_count').default(0),
  generatedExamplesCount: integer('generated_examples_count').default(0),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type OnboardingProgress = typeof onboardingProgress.$inferSelect
export type NewOnboardingProgress = typeof onboardingProgress.$inferInsert
