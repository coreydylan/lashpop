import { test, expect } from '@playwright/test'

/**
 * Inline admin — optimistic-concurrency guard (API-level).
 *
 * The hero-copy PUT route compares the client-sent `baseUpdatedAt` to the stored
 * row's `updatedAt`. A mismatch means someone else saved in between, so the route
 * returns 409 with { conflict: true } instead of clobbering. This drives that
 * contract directly:
 *   1. GET to read current content + updatedAt.
 *   2. PUT with a deliberately STALE baseUpdatedAt → expect 409 + { conflict: true }.
 *   3. PUT with the correct baseUpdatedAt → expect 200.
 *
 * Uses the admin storageState so the route guard is satisfied. Non-destructive:
 * step 3 writes the heading back to exactly what it read in step 1.
 */

const HERO = '/api/admin/website/hero-copy'
const STALE = '2000-01-01T00:00:00.000Z'

test.describe('inline admin: stale-write conflict', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' })

  test('409 on stale baseUpdatedAt, 200 on the current one', async ({ page }) => {
    // 1. Read current content + updatedAt.
    const getRes = await page.request.get(HERO, { failOnStatusCode: false })
    expect(getRes.ok()).toBeTruthy()
    const { content } = await getRes.json()
    expect(content).toBeTruthy()
    const originalHeading: string = content.heading
    const currentStamp: string | undefined = content.updatedAt

    // 2. PUT with a stale baseUpdatedAt → 409 conflict.
    //    (Only meaningful if the row already carries an updatedAt; the route
    //    allows the write when there's no prior stamp. We assert against that.)
    const staleRes = await page.request.put(HERO, {
      data: { heading: `${originalHeading} ✦conflict`, baseUpdatedAt: STALE },
      failOnStatusCode: false,
    })

    if (currentStamp) {
      expect(staleRes.status()).toBe(409)
      const staleBody = await staleRes.json()
      expect(staleBody.conflict).toBe(true)
    } else {
      // No prior stamp on the row — the route legitimately allows the write.
      // Tolerate that edge and ensure we don't leave a bogus heading behind.
      expect([200, 409]).toContain(staleRes.status())
    }

    // 3. PUT with the correct baseUpdatedAt → 200. Re-read first in case step 2
    //    actually wrote (the no-stamp edge), so we send a fresh basis.
    const fresh = await page.request.get(HERO, { failOnStatusCode: false }).then(r => r.json())
    const okRes = await page.request.put(HERO, {
      data: { heading: originalHeading, baseUpdatedAt: fresh.content.updatedAt },
      failOnStatusCode: false,
    })
    expect(okRes.status()).toBe(200)
    const okBody = await okRes.json()
    expect(okBody.content.heading).toBe(originalHeading)
  })
})
