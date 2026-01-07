/**
 * Punchlist Schema
 *
 * A collaborative task/punchlist system for tracking website items
 * with commenting and status tracking for the LP team.
 */

import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// User roles for the punchlist
export const PUNCHLIST_ROLES = ["owner", "client", "team"] as const
export type PunchlistRole = (typeof PUNCHLIST_ROLES)[number]

// Avatar colors matching the LP design system
export const PUNCHLIST_COLORS = ["sage", "dusty-rose", "ocean-mist", "golden", "terracotta"] as const
export type PunchlistColor = (typeof PUNCHLIST_COLORS)[number]

// Item statuses with clear distinctions
export const PUNCHLIST_STATUSES = ["open", "in_progress", "needs_review", "complete", "closed"] as const
export type PunchlistStatus = (typeof PUNCHLIST_STATUSES)[number]

// Priority levels
export const PUNCHLIST_PRIORITIES = ["low", "medium", "high"] as const
export type PunchlistPriority = (typeof PUNCHLIST_PRIORITIES)[number]

// Activity action types
export const PUNCHLIST_ACTIONS = ["created", "status_changed", "assigned", "commented", "closed", "reopened"] as const
export type PunchlistAction = (typeof PUNCHLIST_ACTIONS)[number]

/**
 * Punchlist Users
 * Separate from main auth - specific users with punchlist access
 */
export const punchlistUsers = pgTable("punchlist_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phoneNumber: text("phone_number").unique().notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("team"), // owner | client | team
  avatarColor: text("avatar_color").notNull().default("sage"), // matches LP color palette
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

/**
 * Punchlist Items
 * Individual tasks/items to track
 */
export const punchlistItems = pgTable("punchlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"), // Optional longer description
  status: text("status").notNull().default("open"), // open | in_progress | needs_review | complete | closed
  priority: text("priority").notNull().default("medium"), // low | medium | high
  category: text("category"), // Optional: homepage, services, dam, etc.

  // Relationships
  createdById: uuid("created_by_id").references(() => punchlistUsers.id).notNull(),
  assignedToId: uuid("assigned_to_id").references(() => punchlistUsers.id),

  // Closure tracking (separate from "complete")
  closedAt: timestamp("closed_at"),
  closedById: uuid("closed_by_id").references(() => punchlistUsers.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

/**
 * Punchlist Comments
 * Discussion thread per item
 */
export const punchlistComments = pgTable("punchlist_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").references(() => punchlistItems.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => punchlistUsers.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

/**
 * Punchlist Activity Log
 * Audit trail of all changes
 */
export const punchlistActivity = pgTable("punchlist_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").references(() => punchlistItems.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => punchlistUsers.id).notNull(),
  action: text("action").notNull(), // created | status_changed | assigned | commented | closed | reopened
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

/**
 * Punchlist Sessions
 * Simple session management for phone auth
 */
export const punchlistSessions = pgTable("punchlist_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => punchlistUsers.id, { onDelete: "cascade" }).notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

// Relations
export const punchlistUsersRelations = relations(punchlistUsers, ({ many }) => ({
  createdItems: many(punchlistItems, { relationName: "createdBy" }),
  assignedItems: many(punchlistItems, { relationName: "assignedTo" }),
  comments: many(punchlistComments),
  activity: many(punchlistActivity),
  sessions: many(punchlistSessions)
}))

export const punchlistItemsRelations = relations(punchlistItems, ({ one, many }) => ({
  createdBy: one(punchlistUsers, {
    fields: [punchlistItems.createdById],
    references: [punchlistUsers.id],
    relationName: "createdBy"
  }),
  assignedTo: one(punchlistUsers, {
    fields: [punchlistItems.assignedToId],
    references: [punchlistUsers.id],
    relationName: "assignedTo"
  }),
  closedBy: one(punchlistUsers, {
    fields: [punchlistItems.closedById],
    references: [punchlistUsers.id]
  }),
  comments: many(punchlistComments),
  activity: many(punchlistActivity)
}))

export const punchlistCommentsRelations = relations(punchlistComments, ({ one }) => ({
  item: one(punchlistItems, {
    fields: [punchlistComments.itemId],
    references: [punchlistItems.id]
  }),
  user: one(punchlistUsers, {
    fields: [punchlistComments.userId],
    references: [punchlistUsers.id]
  })
}))

export const punchlistActivityRelations = relations(punchlistActivity, ({ one }) => ({
  item: one(punchlistItems, {
    fields: [punchlistActivity.itemId],
    references: [punchlistItems.id]
  }),
  user: one(punchlistUsers, {
    fields: [punchlistActivity.userId],
    references: [punchlistUsers.id]
  })
}))

export const punchlistSessionsRelations = relations(punchlistSessions, ({ one }) => ({
  user: one(punchlistUsers, {
    fields: [punchlistSessions.userId],
    references: [punchlistUsers.id]
  })
}))

// Type exports
export type PunchlistUser = typeof punchlistUsers.$inferSelect
export type NewPunchlistUser = typeof punchlistUsers.$inferInsert
export type PunchlistItem = typeof punchlistItems.$inferSelect
export type NewPunchlistItem = typeof punchlistItems.$inferInsert
export type PunchlistComment = typeof punchlistComments.$inferSelect
export type NewPunchlistComment = typeof punchlistComments.$inferInsert
export type PunchlistActivityEntry = typeof punchlistActivity.$inferSelect
export type NewPunchlistActivityEntry = typeof punchlistActivity.$inferInsert
export type PunchlistSession = typeof punchlistSessions.$inferSelect
export type NewPunchlistSession = typeof punchlistSessions.$inferInsert
