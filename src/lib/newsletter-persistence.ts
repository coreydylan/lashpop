export type NewsletterPersistenceOutcome = 'new' | 'existing' | 'reactivated'

export interface NewsletterPersistenceStore {
  findByEmail(email: string): Promise<{ id: string; status: string } | null>
  insertActive(email: string, now: Date): Promise<void>
  reactivate(id: string, now: Date): Promise<void>
}

/**
 * Persist one normalized footer signup without erasing consent history.
 * The adapter boundary keeps the actual D1 write path regression-testable.
 */
export async function persistNewsletterSubscription(
  store: NewsletterPersistenceStore,
  email: string,
  now = new Date(),
): Promise<NewsletterPersistenceOutcome> {
  const existing = await store.findByEmail(email)
  if (!existing) {
    await store.insertActive(email, now)
    return 'new'
  }

  if (existing.status === 'active') return 'existing'

  await store.reactivate(existing.id, now)
  return 'reactivated'
}
