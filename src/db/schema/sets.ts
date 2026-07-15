import { pgTable, uuid, text, timestamp } from "../sqlite-core"
import { teamMembers } from "./team_members"

export const sets = pgTable("sets", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),
  name: text("name"), // Optional custom name for the set
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})
