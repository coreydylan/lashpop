import assert from 'node:assert/strict'
import test from 'node:test'
import {
  publicServiceCategoryLabel,
  publicServiceSubtitle,
  publicTeamServiceCategoryLabel,
} from './public-service-presentation'

test('presents the approved Tiny Tattoos label without changing the stable slug', () => {
  assert.equal(
    publicServiceCategoryLabel('fine-line-tattoos', 'Fine Line Tattoos'),
    'Tiny Tattoos',
  )
  assert.equal(
    publicServiceCategoryLabel('fine-line-tattoos', 'FINE LINE TATTOOS'),
    'TINY TATTOOS',
  )
  assert.equal(publicTeamServiceCategoryLabel('Fine Line Tattoos'), 'Tiny Tattoos')
  assert.equal(publicServiceCategoryLabel('brows', 'Brows'), 'Brows')
})

test('removes only the six approved lash-fill subtitles', () => {
  for (const name of [
    'Classic Fill',
    'Classic Mini Fill',
    'Hybrid Fill',
    'Hybrid Mini Fill',
    'Wet/Angel Fill',
    'Wet/Angel Mini Fill',
  ]) {
    assert.equal(publicServiceSubtitle(name, 'Secondary descriptor'), null)
  }

  assert.equal(publicServiceSubtitle('Classic Full Set', 'Natural look'), 'Natural look')
})

