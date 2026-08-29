import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import {
  SERVICE_CARD_SIZES,
  getServiceImageLoadPlan,
  getServiceImageSrcSet,
} from './service-image-preloader'

const r2Base = 'https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads'

function directR2(source: string) {
  const key = decodeURIComponent(new URL(source).pathname.replace(/^\/+/, ''))
  const imageId = `lp/${createHash('sha256').update(`r2:${key}`).digest('hex')}`
  return `https://imagedelivery.net/zXebLwufc8AGAQU5E9oXHw/${imageId}/public`
}

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

test('preloads the same compact direct Cloudflare variants rendered by each card', () => {
  const direct = directR2(`${r2Base}/classic.jpg`)
  const [image] = getServiceImageLoadPlan([{ imageUrl: direct }], 1).priority
  const srcSet = getServiceImageSrcSet(image)

  assert.equal(image.sizes, SERVICE_CARD_SIZES)
  assert.ok(srcSet.includes('/w=320,q=90,fit=scale-down,metadata=none 320w'))
  assert.ok(srcSet.includes('/w=600,q=90,fit=scale-down,metadata=none 600w'))
  assert.equal(srcSet.includes('workers.dev'), false)
})
