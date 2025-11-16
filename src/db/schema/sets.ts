import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { teamMembers } from "./team_members"
import { user } from "./auth_user"

export const sets = pgTable("sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .references(() => user.id, { onDelete: "set null" }), // User who owns/created this set
  name: text("name"), // Optional custom name for the set

  // Sharing and visibility
  isPublic: boolean("is_public").notNull().default(false), // Whether set is publicly accessible
  visibility: text("visibility").notNull().default("private"), // 'private', 'shared', 'public'

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})
