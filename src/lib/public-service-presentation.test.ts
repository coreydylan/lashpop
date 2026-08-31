import assert from 'node:assert/strict'
import test from 'node:test'

import {
  presentPublicService,
  presentPublicServiceCategory,
  publicServiceLabels,
} from './public-service-presentation'

test('renames the legacy tattoo category only on customer-facing surfaces', () => {
  assert.equal(
    presentPublicServiceCategory({ name: 'Fine Line Tattoos', slug: 'fine-line-tattoos' }).name,
    'Tiny Tattoos',
  )
  assert.deepEqual(
    publicServiceLabels(['Lashes', 'Fine Line Tattoos', 'Brows']),
    ['Lashes', 'Tiny Tattoos', 'Brows'],
  )
})

test('removes the six requested fill subtitles without touching other services', () => {
  for (const [slug, name] of [
    ['classic-fill', 'Classic Fill'],
    ['classic-mini', 'Classic Mini Fill'],
    ['hybrid-fill', 'Hybrid Fill'],
    ['hybrid-mini', 'Hybrid Mini Fill'],
    ['angel-fill', 'Wet/Angel Fill'],
    ['angel-mini', 'Wet/Angel Mini Fill'],
  ] as const) {
    assert.equal(
      presentPublicService({ slug, name, subtitle: 'Legacy pink subtitle' }).subtitle,
      null,
    )
  }

  assert.equal(
    presentPublicService({
      slug: 'classic-full-set',
      name: 'Classic Full Set',
      subtitle: 'Natural definition',
    }).subtitle,
    'Natural definition',
  )
})
