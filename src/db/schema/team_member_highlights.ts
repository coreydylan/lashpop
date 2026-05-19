import { pgTable, smallint, text, timestamp, uuid, unique } from "drizzle-orm/pg-core"

import { reviews } from "./reviews"
import { teamMembers } from "./team_members"

/**
 * Curated per-stylist highlight reels — top N reviews per active staff member.
 * Rebuilt by the weekly editor pass (workers/reviews/src/editor.ts) but
 * admins can override via /admin/team/[id]/highlights.
 */
export const teamMemberHighlights = pgTable(
  "team_member_highlights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamMemberId: uuid("team_member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
    rank: smallint("rank").notNull(),
    editorNotes: text("editor_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    uniqMember: unique().on(table.teamMemberId, table.reviewId),
    uniqRank: unique().on(table.teamMemberId, table.rank),
  }),
)

export type SelectTeamMemberHighlight = typeof teamMemberHighlights.$inferSelect
export type InsertTeamMemberHighlight = typeof teamMemberHighlights.$inferInsert
