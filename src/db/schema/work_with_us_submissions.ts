import { pgTable, text, integer, jsonb, timestamp, uuid, index } from "../sqlite-core"

/**
 * Work With Us Submissions
 * Persists every careers-form submission (employee application, booth rental
 * inquiry, training waitlist) so they show up in the admin Applications inbox.
 * The form ALSO emails the studio; this table is the durable record so nothing
 * gets lost in an inbox.
 */
export const workWithUsSubmissions = pgTable("work_with_us_submissions", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),

  // 'employee' | 'booth' | 'training'
  path: text("path").notNull(),

  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),

  experience: text("experience"),
  specialty: jsonb("specialty").$type<string[]>(),
  message: text("message"),
  instagram: text("instagram"),
  currentBusiness: text("current_business"),
  desiredStartDate: text("desired_start_date"),
  boothDays: integer("booth_days"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("work_with_us_submissions_created_at_idx").on(table.createdAt),
  pathIdx: index("work_with_us_submissions_path_idx").on(table.path),
}))

export type WorkWithUsSubmission = typeof workWithUsSubmissions.$inferSelect
export type NewWorkWithUsSubmission = typeof workWithUsSubmissions.$inferInsert
