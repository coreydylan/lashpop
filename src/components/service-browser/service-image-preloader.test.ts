import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SERVICE_CARD_SIZES,
  getServiceImageLoadPlan,
  getServiceImageSrcSet,
} from './service-image-preloader'
import { getImageWorkerBase } from '@/lib/cf-image-loader'

const r2Base = 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads'

test('prioritizes visible service photos, skips blanks, and de-duplicates fallbacks', () => {
  const services = [
    { imageUrl: `${r2Base}/one.jpg` },
    { imageUrl: null },
    { imageUrl: `${r2Base}/two.jpg` },
    { imageUrl: `${r2Base}/one.jpg` },
    { imageUrl: `${r2Base}/three.jpg` },
  ]

  const plan = getServiceImageLoadPlan(services, 2)

  assert.deepEqual(plan.priority.map(({ src }) => src), [
    `${r2Base}/one.jpg`,
    `${r2Base}/two.jpg`,
  ])
  assert.deepEqual(plan.background.map(({ src }) => src), [`${r2Base}/three.jpg`])
})

test('preloads the same compact responsive variants rendered by each card', () => {
  const [image] = getServiceImageLoadPlan([{ imageUrl: `${r2Base}/classic.jpg` }], 1).priority
  const srcSet = getServiceImageSrcSet(image)

  assert.equal(image.sizes, SERVICE_CARD_SIZES)
  assert.ok(srcSet.includes(`${getImageWorkerBase()}/uploads/classic.jpg?w=320&q=90 320w`))
  assert.ok(srcSet.includes(`${getImageWorkerBase()}/uploads/classic.jpg?w=600&q=90 600w`))
})
