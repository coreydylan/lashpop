/**
 * Onboarding Custom Themes Schema
 *
 * Stores user's custom color schemes and theme preferences
 * Applied throughout the UX to personalize their experience
 */

import { pgTable, uuid, text, timestamp, json, boolean } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const onboardingCustomThemes = pgTable('onboarding_custom_themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Theme metadata
  themeName: text('theme_name').default('My Brand Theme'),
  themeDescription: text('theme_description'),
  generationSource: text('generation_source'), // 'ai_generated', 'user_selected', 'manual'

  // Color scheme
  primaryColor: text('primary_color').notNull(), // Main brand color
  secondaryColor: text('secondary_color'),
  accentColor: text('accent_color'),
  backgroundColor: text('background_color'),
  surfaceColor: text('surface_color'),
  textColor: text('text_color'),
  textSecondaryColor: text('text_secondary_color'),

  // Extended palette
  colorPalette: json('color_palette').$type<{
    sage?: string
    dustyRose?: string
    warmSand?: string
    golden?: string
    terracotta?: string
    oceanMist?: string
    cream?: string
    dune?: string
    // Custom brand colors
    custom1?: string
    custom2?: string
    custom3?: string
    custom4?: string
    custom5?: string
  }>(),

  // Color harmonies
  colorHarmony: text('color_harmony'), // 'complementary', 'analogous', 'triadic', 'monochromatic'
  colorTemperature: text('color_temperature'), // 'warm', 'cool', 'neutral'

  // UI customization
  borderRadius: text('border_radius').default('24px'), // Arch shape by default
  buttonStyle: text('button_style').default('rounded'), // 'rounded', 'sharp', 'pill'
  cardStyle: text('card_style').default('glass'), // 'glass', 'solid', 'outlined'

  // Typography preferences
  headingFont: text('heading_font'),
  bodyFont: text('body_font'),
  fontScale: text('font_scale').default('normal'), // 'small', 'normal', 'large'

  // Brand assets
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  ogImageUrl: text('og_image_url'),

  // Advanced customization
  cssVariables: json('css_variables').$type<Record<string, string>>(), // Custom CSS variables
  customStyles: text('custom_styles'), // Custom CSS if user wants to add more

  // Application scope
  applyToNavigation: boolean('apply_to_navigation').default(true),
  applyToButtons: boolean('apply_to_buttons').default(true),
  applyToCards: boolean('apply_to_cards').default(true),
  applyToChips: boolean('apply_to_chips').default(true),
  applyToBackgrounds: boolean('apply_to_backgrounds').default(false),

  // Theme state
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),

  // User modifications
  userApproved: boolean('user_approved').default(false),
  lastAppliedAt: timestamp('last_applied_at'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type OnboardingCustomTheme = typeof onboardingCustomThemes.$inferSelect
export type NewOnboardingCustomTheme = typeof onboardingCustomThemes.$inferInsert
