import { index, integer, jsonb, pgTable, text } from '../sqlite-core'

/** Immutable snapshots captured before website-setting changes. */
export const websiteSettingVersions = pgTable('website_setting_versions', {
  id: text('id').primaryKey(),
  // Deliberately not a foreign key: deleting or archiving a live setting must
  // never erase the recovery record.
  settingId: text('setting_id').notNull(),
  section: text('section').notNull(),
  config: jsonb('config').$type<Record<string, unknown> | null>(),
  sourceOwner: text('source_owner').notNull(),
  version: integer('version').notNull(),
  updatedByUserId: text('updated_by_user_id'),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  sectionCreatedIdx: index('website_setting_versions_section_idx').on(table.section, table.createdAt),
}))

export type WebsiteSettingVersion = typeof websiteSettingVersions.$inferSelect
export type NewWebsiteSettingVersion = typeof websiteSettingVersions.$inferInsert
