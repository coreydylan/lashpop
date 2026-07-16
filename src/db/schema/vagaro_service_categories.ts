import { boolean, index, integer, pgTable, text, timestamp, unique, uuid } from "../sqlite-core"

/** Raw, lossless mirror of Vagaro's service-category taxonomy. */
export const vagaroServiceCategories = pgTable("vagaro_service_categories", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  vagaroCategoryId: text("vagaro_category_id").notNull(),
  title: text("title").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  serviceCount: integer("service_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  teamLabel: text("team_label"),
  teamDisplayOrder: integer("team_display_order"),
  showOnTeam: boolean("show_on_team").default(true).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  vagaroIdUnique: unique("vagaro_service_categories_vagaro_id_unique").on(table.vagaroCategoryId),
  orderIdx: index("vagaro_service_categories_order_idx").on(table.displayOrder),
}))

export type InsertVagaroServiceCategory = typeof vagaroServiceCategories.$inferInsert
export type SelectVagaroServiceCategory = typeof vagaroServiceCategories.$inferSelect
