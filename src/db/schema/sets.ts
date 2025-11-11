import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { teamMembers } from "./team_members"

export const sets = pgTable("sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),
  name: text("name"), // Optional custom name for the set
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})
