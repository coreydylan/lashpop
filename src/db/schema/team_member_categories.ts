import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core"
import { teamMembers } from "./team_members"
import { serviceCategories } from "./service_categories"

export const teamMemberCategories = pgTable("team_member_categories", {
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => serviceCategories.id, { onDelete: "cascade" })
}, (table) => ({
  pk: primaryKey({ columns: [table.teamMemberId, table.categoryId] })
}))

export type InsertTeamMemberCategory = typeof teamMemberCategories.$inferInsert
export type SelectTeamMemberCategory = typeof teamMemberCategories.$inferSelect
