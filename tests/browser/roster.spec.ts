import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { preparePublicHome } from './helpers'

// Roster coverage lives here as assertions, not as pixels.
//
// The team screenshot masks the card interiors, because a stylist joining or
// leaving is a content change and should not turn the visual baseline red. The
// rule that actually matters - who is published and who is not - is checked
// against the same seeded roster the page is rendered from.

type Member = {
  id: string
  name: string
  imageUrl: string
  serviceCategories?: string[]
  isActive: boolean
  showOnWebsite: boolean
}

const scenario = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/test-fixtures/roster-scenario.json'), 'utf8'),
) as { members: Member[] }

const published = scenario.members.filter((member) => member.isActive && member.showOnWebsite)
const unpublished = scenario.members.filter((member) => !(member.isActive && member.showOnWebsite))

test.beforeEach(async ({ page }) => {
  await preparePublicHome(page)
})

test('the grid publishes exactly the roster the data says is published', async ({ page }) => {
  expect(published.length, 'the seeded roster needs published members').toBeGreaterThan(0)
  expect(unpublished.length, 'the seeded roster needs a hidden member to prove absence').toBeGreaterThan(0)

  const team = page.locator('section[data-section-id="team"]')
  await team.scrollIntoViewIfNeeded()
  const cards = team.locator('[data-team-card]')
  await expect(cards).toHaveCount(published.length)

  const rendered = await cards.evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.memberName ?? ''))
  expect(rendered.slice().sort()).toEqual(published.map((member) => member.name).sort())

  const sectionText = (await team.innerText()).toLowerCase()
  for (const member of unpublished) {
    expect(sectionText, `${member.name} is not published and must not appear`).not.toContain(member.name.toLowerCase())
    await expect(team.locator(`[data-team-card][data-member-name="${member.name}"]`)).toHaveCount(0)
  }
})

test('every published card renders a real photo and its chips', async ({ page }) => {
  const team = page.locator('section[data-section-id="team"]')
  await team.scrollIntoViewIfNeeded()

  for (const member of published) {
    // Cards are matched by name: the page maps fixture rows through a view
    // model, so the DOM id is not the fixture id.
    const card = team.locator(`[data-team-card][data-member-name="${member.name}"]`)
    await expect(card, `${member.name} should have a card`).toHaveCount(1)
    await card.scrollIntoViewIfNeeded()

    const image = card.locator('[data-roster-photo] img')
    await expect(image).toHaveCount(1)
    const loaded = await image.evaluate(async (element) => {
      const img = element as HTMLImageElement
      img.loading = 'eager'
      if (!img.complete || img.naturalWidth === 0) {
        try {
          await img.decode()
        } catch {
          return { width: 0, src: img.currentSrc || img.src }
        }
      }
      return { width: img.naturalWidth, src: img.currentSrc || img.src }
    })
    expect(loaded.width, `${member.name}'s photo did not load: ${loaded.src}`).toBeGreaterThan(0)

    const expectedChips = member.serviceCategories?.length ?? 0
    if (expectedChips > 0) {
      const chips = card.locator('[data-roster-chips] span')
      expect(await chips.count(), `${member.name} should show her service chips`).toBeGreaterThan(0)
    }
  }
})
