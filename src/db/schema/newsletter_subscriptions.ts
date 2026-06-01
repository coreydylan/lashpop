import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * Newsletter Subscriptions Table
 * Email addresses collected from the footer "Stay Connected" signup form.
 *
 * NOTE: This table was originally created directly in Supabase and only
 * codified here later. The column defaults below mirror the live table
 * (gen_random_uuid / now() / 'footer_form'). `email` carries a unique
 * constraint — duplicate inserts raise Postgres 23505, which the
 * subscribeToNewsletter action treats as "already subscribed".
 */
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Subscriber email (lowercased + trimmed before insert)
  email: text("email").notNull().unique(),

  // When they signed up
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow(),

  // Where the signup came from (e.g. 'footer_form')
  source: text("source").default("footer_form"),
})

export type InsertNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert
export type SelectNewsletterSubscription = typeof newsletterSubscriptions.$inferSelect
