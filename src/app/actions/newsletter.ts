'use server'

import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { newsletterSubscriptions } from '@/db/schema/newsletter_subscriptions'
import { requireAdmin } from '@/lib/admin/auth'
import { headers } from 'next/headers'
import { consumeRateLimit, requestIp } from '@/lib/request-rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Public signup writes through the Cloudflare D1 data path. An address that
 * previously opted out can explicitly opt in again from the footer; repeat
 * submissions from an active address remain idempotent.
 */
export async function subscribeToNewsletter(email: string) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || trimmed.length > 320 || !EMAIL_RE.test(trimmed)) {
    return { success: false, message: 'Please enter a valid email.' }
  }

  try {
    const requestHeaders = await headers()
    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit({
        scope: 'newsletter-ip',
        identity: requestIp(requestHeaders),
        limit: 30,
        windowMs: 60 * 60 * 1_000,
      }),
      consumeRateLimit({
        scope: 'newsletter-email',
        identity: trimmed,
        limit: 5,
        windowMs: 24 * 60 * 60 * 1_000,
      }),
    ])
    if (!ipLimit.allowed || !emailLimit.allowed) {
      return { success: false, message: 'Too many signup attempts. Please try again later.' }
    }

    const db = getDb()
    const [existing] = await db
      .select({ id: newsletterSubscriptions.id, status: newsletterSubscriptions.status })
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, trimmed))
      .limit(1)

    if (existing) {
      if (existing.status !== 'active') {
        const now = new Date()
        await db
          .update(newsletterSubscriptions)
          .set({
            status: 'active',
            source: 'footer_form',
            subscribedAt: now,
            unsubscribedAt: null,
            updatedAt: now,
          })
          .where(eq(newsletterSubscriptions.id, existing.id))
        return { success: true, message: 'Welcome back — you’re on the list!' }
      }

      return { success: true, message: 'Thank you — you’re already on the list!' }
    }

    const now = new Date()
    await db.insert(newsletterSubscriptions).values({
      email: trimmed,
      source: 'footer_form',
      status: 'active',
      subscribedAt: now,
      updatedAt: now,
    })
    return { success: true, message: 'Thank you — see you in your inbox!' }
  } catch (err: unknown) {
    // A concurrent repeat signup can still race the read. Treat every known
    // uniqueness variant as the same idempotent success.
    const detail = err instanceof Error ? err.message : String(err)
    if (/unique|constraint|already exists/i.test(detail)) {
      return { success: true, message: 'Thank you — you’re already on the list!' }
    }
    console.error('Newsletter subscription error:', err)
    return { success: false, message: 'Subscription failed. Please try again.' }
  }
}

/**
 * Read the complete consent ledger. This is an exported server action, so it
 * enforces admin access itself instead of relying only on the calling page.
 */
export async function listNewsletterSubscribers() {
  await requireAdmin()
  const db = getDb()
  return db
    .select({
      id: newsletterSubscriptions.id,
      email: newsletterSubscriptions.email,
      subscribedAt: newsletterSubscriptions.subscribedAt,
      source: newsletterSubscriptions.source,
      status: newsletterSubscriptions.status,
      notes: newsletterSubscriptions.notes,
      unsubscribedAt: newsletterSubscriptions.unsubscribedAt,
      updatedAt: newsletterSubscriptions.updatedAt,
    })
    .from(newsletterSubscriptions)
    .orderBy(desc(newsletterSubscriptions.subscribedAt))
}
