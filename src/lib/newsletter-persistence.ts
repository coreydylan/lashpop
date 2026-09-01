export type NewsletterSubscriptionOutcome = 'new' | 'already-active' | 'reactivated'

export interface NewsletterSubscriptionRecord {
  id: string
  email: string
  status: 'active' | 'unsubscribed' | 'suppressed'
  source: string
  subscribedAt: Date
  unsubscribedAt: Date | null
  updatedAt: Date
}

export interface NewsletterSubscriptionStore {
  findByEmail(email: string): Promise<Pick<NewsletterSubscriptionRecord, 'id' | 'status'> | null>
  reactivate(id: string, now: Date): Promise<void>
  insert(email: string, now: Date): Promise<void>
}

/** Idempotent consent-ledger behavior shared by the server action and tests. */
export async function persistNewsletterSubscription(
  store: NewsletterSubscriptionStore,
  email: string,
  now = new Date(),
): Promise<NewsletterSubscriptionOutcome> {
  const existing = await store.findByEmail(email)
  if (!existing) {
    await store.insert(email, now)
    return 'new'
  }
  if (existing.status === 'active') return 'already-active'

  await store.reactivate(existing.id, now)
  return 'reactivated'
}
