'use server'

import { desc } from 'drizzle-orm'
import { getDb } from '@/db'
import { newsletterSubscriptions } from '@/db/schema/newsletter_subscriptions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Previously used @supabase/supabase-js with NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY env vars that aren't set in Vercel — the
 * resulting createClient(undefined!, undefined!) returned a client whose
 * fetch hung forever. That's what was leaving the footer spinner stuck on
 * "Subscribing..." with no error visible. The rest of the app already
 * connects via DATABASE_URL + Drizzle, so route this through the same
 * pool. Admin reads stay locked down (no SELECT policy exposed here).
 */
export async function subscribeToNewsletter(email: string) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !EMAIL_RE.test(trimmed)) {
    return { success: false, message: 'Please enter a valid email.' }
  }

  try {
    const db = getDb()
    await db
      .insert(newsletterSubscriptions)
      .values({ email: trimmed, source: 'footer_form' })
    return { success: true, message: 'Thank you — see you in your inbox!' }
  } catch (err: unknown) {
    // Unique violation = already on the list, treat as a win.
    const code = (err as { code?: string }).code
    if (code === '23505') {
      return { success: true, message: 'Thank you — you’re already on the list!' }
    }
    console.error('Newsletter subscription error:', err)
    return { success: false, message: 'Subscription failed. Please try again.' }
  }
}

/**
 * Read all subscribers (admin only — called from the admin overview /
 * dashboard pages). Returns email + signup timestamp + source.
 */
export async function listNewsletterSubscribers() {
  const db = getDb()
  return db
    .select({
      email: newsletterSubscriptions.email,
      subscribedAt: newsletterSubscriptions.subscribedAt,
      source: newsletterSubscriptions.source,
    })
    .from(newsletterSubscriptions)
    .orderBy(desc(newsletterSubscriptions.subscribedAt))
}
