import assert from 'node:assert/strict'
import test from 'node:test'
import manifest from './vagaro-widget-manifest.json'
import { hasBookingConfiguration } from './booking-health'

test('contains one unique verified widget mapping for every active Vagaro service', () => {
  assert.equal(manifest.version, 1)
  assert.equal(manifest.mappings.length, manifest.mappingCount)
  assert.ok(manifest.mappingCount >= 50)

  const databaseIds = new Set<string>()
  const vagaroServiceIds = new Set<string>()
  const encryptedServiceIds = new Set<string>()
  const widgetUrls = new Set<string>()

  for (const mapping of manifest.mappings) {
    assert.ok(mapping.databaseServiceId)
    assert.ok(mapping.vagaroServiceId)
    assert.ok(mapping.name)
    assert.ok(mapping.category)
    assert.ok(mapping.encryptedServiceId)
    assert.ok(mapping.encryptedParentServiceId)
    assert.equal(
      hasBookingConfiguration({
        vagaroServiceId: mapping.vagaroServiceId,
        vagaroWidgetUrl: mapping.widgetUrl,
      }),
      true,
      `${mapping.category} / ${mapping.name}`,
    )

    assert.equal(databaseIds.has(mapping.databaseServiceId), false)
    assert.equal(vagaroServiceIds.has(mapping.vagaroServiceId), false)
    assert.equal(encryptedServiceIds.has(mapping.encryptedServiceId), false)
    assert.equal(widgetUrls.has(mapping.widgetUrl), false)

    databaseIds.add(mapping.databaseServiceId)
    vagaroServiceIds.add(mapping.vagaroServiceId)
    encryptedServiceIds.add(mapping.encryptedServiceId)
    widgetUrls.add(mapping.widgetUrl)
  }
})

test('duplicate titles in different Vagaro categories have different loaders', () => {
  const duplicatedTitles = new Map<string, typeof manifest.mappings>()

  for (const mapping of manifest.mappings) {
    const matches = duplicatedTitles.get(mapping.name) || []
    matches.push(mapping)
    duplicatedTitles.set(mapping.name, matches)
  }

  const duplicates = Array.from(duplicatedTitles.values()).filter(
    mappings => mappings.length > 1,
  )
  assert.ok(duplicates.length > 0)

  for (const mappings of duplicates) {
    assert.equal(
      new Set(mappings.map(mapping => mapping.category)).size,
      mappings.length,
    )
    assert.equal(
      new Set(mappings.map(mapping => mapping.widgetUrl)).size,
      mappings.length,
    )
  }
})

test('Brows and Permanent Makeup Microblading duplicates keep exact parent identities', () => {
  const firstAppointments = manifest.mappings.filter(
    mapping => mapping.name === 'Microblading (1st Appointment)',
  )

  assert.deepEqual(
    firstAppointments.map(({ vagaroServiceId, category }) => ({ vagaroServiceId, category })),
    [
      { vagaroServiceId: '39547580', category: 'Brows' },
      {
        vagaroServiceId: '23862411',
        category: 'Permanent Makeup (Microblading/Nanobrows/Freckles/Lip Blushing)',
      },
    ],
  )
  assert.equal(new Set(firstAppointments.map(mapping => mapping.encryptedParentServiceId)).size, 2)
  assert.equal(new Set(firstAppointments.map(mapping => mapping.widgetUrl)).size, 2)
})

test('a valid loader assigned to the wrong service fails closed', () => {
  const [first, second] = manifest.mappings
  assert.ok(first)
  assert.ok(second)
  assert.equal(
    hasBookingConfiguration({
      vagaroServiceId: first.vagaroServiceId,
      vagaroWidgetUrl: second.widgetUrl,
    }),
    false,
  )
})

test('keeps the renamed Tiny Tattoos service on its verified loader', () => {
  const tinyTattoos = manifest.mappings.find(
    mapping => mapping.vagaroServiceId === '35729654',
  )

  assert.ok(tinyTattoos)
  assert.equal(tinyTattoos.name, 'Tiny Tattoos')
  assert.equal(tinyTattoos.category, 'Tiny Tattoos')
  assert.equal(
    hasBookingConfiguration({
      vagaroServiceId: tinyTattoos.vagaroServiceId,
      vagaroWidgetUrl: tinyTattoos.widgetUrl,
      serviceName: 'Tiny Tattoos',
      serviceCategory: 'Tiny Tattoos',
    }),
    true,
  )
})
