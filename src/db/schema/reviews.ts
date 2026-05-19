import { pgTable, text, timestamp, uuid, integer, boolean, index, jsonb, smallint } from "drizzle-orm/pg-core"

import { teamMembers } from "./team_members"

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source").default("vagaro").notNull(),
  sourceUrl: text("source_url").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  subject: text("subject"),
  /**
   * Canonical link to a team member when we can resolve one. Vagaro provides
   * `serviceProviderName` natively (100% populated); Google/Yelp leave this null
   * unless we extract a mention from the review text. Keep `subject` as the raw
   * fallback so we don't lose data on staff renames.
   */
  teamMemberId: uuid("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  reviewText: text("review_text").notNull(),
  rating: integer("rating").default(5).notNull(),
  reviewDate: timestamp("review_date"),
  responseText: text("response_text"),
  responseDate: timestamp("response_date"),
  rawPayload: text("raw_payload"),

  // SEO/Schema.org visibility controls
  // showOnWebsite: Display publicly on the website
  // includeInSchema: Include in JSON-LD structured data for search engines
  // This allows reviews to be "crawlable" even if not publicly displayed
  showOnWebsite: boolean("show_on_website").default(true),
  includeInSchema: boolean("include_in_schema").default(true),

  // Auto-promote bookkeeping
  // homepageDismissed: admin explicitly removed this from the homepage — don't auto-re-add
  // hiddenReason: when set to 'stale_team_member', show_on_website was flipped automatically and can be auto-restored
  homepageDismissed: boolean("homepage_dismissed").default(false).notNull(),
  hiddenReason: text("hidden_reason"),

  // Editor-pass outputs (migration 0035)
  qualityScore: smallint("quality_score"),
  qualityScoredAt: timestamp("quality_scored_at", { withTimezone: true }),
  editorNotes: text("editor_notes"),

  // Admin override mechanism (migration 0036) — array of column names the
  // AI editor must not overwrite. e.g. ["quality_score","team_member_id"]
  adminLockedFields: jsonb("admin_locked_fields").$type<string[]>().notNull().default([]),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  teamMemberIdIdx: index("reviews_team_member_id_idx").on(table.teamMemberId),
}))

export type InsertReview = typeof reviews.$inferInsert
export type SelectReview = typeof reviews.$inferSelect
