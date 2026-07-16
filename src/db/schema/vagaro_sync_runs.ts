import { jsonb, pgTable, text, timestamp, uuid } from "../sqlite-core"

export interface VagaroSyncStageResult {
  success: boolean
  stats?: Record<string, unknown>
  error?: string
}

/** Durable audit trail for cron and manual Vagaro syncs. */
export const vagaroSyncRuns = pgTable("vagaro_sync_runs", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  trigger: text("trigger").notNull(),
  status: text("status").default("running").notNull(),
  result: jsonb("result").$type<Record<string, VagaroSyncStageResult>>(),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type InsertVagaroSyncRun = typeof vagaroSyncRuns.$inferInsert
export type SelectVagaroSyncRun = typeof vagaroSyncRuns.$inferSelect
