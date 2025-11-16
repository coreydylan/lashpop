import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core"
import { users } from "./auth_user"

/**
 * Resource sharing table
 * Enables sharing of DAM resources (assets, sets, collections) with specific permissions
 */
export const resourceShares = pgTable(
  "resource_shares",
  {
    resourceType: text("resource_type").notNull(), // 'asset', 'set', 'collection'
    resourceId: text("resource_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(), // 'viewer', 'editor', 'owner'
    sharedBy: text("shared_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.resourceType, table.resourceId, table.userId] }),
  })
)

export type ResourceShare = typeof resourceShares.$inferSelect
export type NewResourceShare = typeof resourceShares.$inferInsert
