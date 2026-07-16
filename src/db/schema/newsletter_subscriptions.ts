import { pgTable, text, timestamp, uuid, index } from "../sqlite-core"

export const NEWSLETTER_SUBSCRIBER_STATUSES = [
  "active",
  "unsubscribed",
  "suppressed",
] as const

export type NewsletterSubscriberStatus = (typeof NEWSLETTER_SUBSCRIBER_STATUSES)[number]

/**
 * Newsletter Subscriptions Table
 * Email addresses collected from the footer "Stay Connected" signup form.
 *
 * The record is the consent ledger for the website signup form. Delivery,
 * campaign, bounce, and complaint events still belong to LashPop's approved
 * email platform; the admin status prevents inactive addresses from being
 * included in exports from this site.
 */
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),

  // Subscriber email (lowercased + trimmed before insert)
  email: text("email").notNull().unique(),

  // When they signed up
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow(),

  // Where the signup came from (e.g. 'footer_form')
  source: text("source").default("footer_form"),

  // Whether the address is eligible for an approved-platform export.
  status: text("status", { enum: NEWSLETTER_SUBSCRIBER_STATUSES })
    .default("active")
    .notNull(),

  // Optional internal context. Never exposed on the public site.
  notes: text("notes"),

  // Consent/status timestamps used by the admin directory.
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("newsletter_subscriptions_status_idx").on(table.status),
  subscribedAtIdx: index("newsletter_subscriptions_subscribed_at_idx").on(table.subscribedAt),
}))

export type InsertNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert
export type SelectNewsletterSubscription = typeof newsletterSubscriptions.$inferSelect
