import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import type { LashStyle, QuizPhoto } from './types'
import {
  getQuizImageLoadPlan,
  getQuizImageSrcSet,
  getQuizPhotoObjectFit,
  getQuizPhotoObjectPosition,
  getQuizPhotoUrl,
} from './quiz-image-preloader'

function directR2(source: string) {
  const key = decodeURIComponent(new URL(source).pathname.replace(/^\/+/, ''))
  const imageId = `lp/${createHash('sha256').update(`r2:${key}`).digest('hex')}`
  return `https://imagedelivery.net/zXebLwufc8AGAQU5E9oXHw/${imageId}/public`
}

function photo(style: LashStyle, assetId: string, enabled = true): QuizPhoto {
  return {
    id: assetId,
    assetId,
    lashStyle: style,
    cropData: null,
    cropUrl: null,
    isEnabled: enabled,
    sortOrder: 0,
    filePath: directR2(`https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads/${assetId}.jpg`),
    fileName: `${assetId}.jpg`,
  }
}

test('loads the exact Classic and Volume opening pair before every other image', () => {
  const photos = {
    classic: [photo('classic', 'classic-first'), photo('classic', 'classic-rest')],
    wetAngel: [photo('wetAngel', 'wet-first')],
    hybrid: [photo('hybrid', 'hybrid-first')],
    volume: [photo('volume', 'volume-first'), photo('volume', 'volume-rest')],
  }

  const plan = getQuizImageLoadPlan(photos, ['https://example.com/result.jpg'])

  assert.deepEqual(
    plan.priority.map((candidate) => candidate.src),
    [photos.classic[0].filePath, photos.volume[0].filePath],
  )
  assert.equal(plan.background.length, 5)
  assert.equal(new Set([...plan.priority, ...plan.background].map(({ src }) => src)).size, 7)
})

test('preloads the same optimized responsive variants used by the comparison cards', () => {
  const photos = {
    classic: [photo('classic', 'classic-first')],
    wetAngel: [],
    hybrid: [],
    volume: [photo('volume', 'volume-first')],
  }

  const [candidate] = getQuizImageLoadPlan(photos).priority
  const srcSet = getQuizImageSrcSet(candidate)

  assert.ok(srcSet.includes('/w=384,q=90,fit=scale-down,metadata=none 384w'))
  assert.ok(srcSet.includes('/w=600,q=90,fit=scale-down,metadata=none 600w'))
  assert.equal(srcSet.includes('workers.dev'), false)
})

test('legacy square crops fall back to the real source instead of being cropped twice', () => {
  const comparison = photo('classic', 'classic-first')
  comparison.cropData = { x: 62, y: 48, scale: 1.2 }
  comparison.cropUrl = 'https://example.com/IMG_6439-square-20260827-canonical-v1.jpg'

  assert.equal(getQuizPhotoUrl(comparison), comparison.filePath)
  assert.equal(getQuizPhotoObjectPosition(comparison), '62% 48%')
  assert.equal(getQuizPhotoObjectFit(comparison), 'contain')
})

test('legacy classification survives replacement of the R2 URL with a delivery URL', () => {
  const comparison = photo('classic', 'classic-first')
  comparison.cropData = { x: 62, y: 48, scale: 1.2 }
  comparison.cropUrl = directR2('https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/quiz-crops/legacy.jpg')
  comparison.cropVariant = 'legacy-square'

  assert.equal(getQuizPhotoUrl(comparison), comparison.filePath)
  assert.equal(getQuizPhotoObjectPosition(comparison), '62% 48%')
  assert.equal(getQuizPhotoObjectFit(comparison), 'contain')
})

test('new portrait-safe admin crops are used directly by the comparison card', () => {
  const comparison = photo('classic', 'classic-first')
  comparison.cropUrl = 'https://example.com/IMG_6439-portrait-safe-20260827.jpg'

  assert.equal(getQuizPhotoUrl(comparison), comparison.cropUrl)
  assert.equal(getQuizPhotoObjectPosition(comparison), undefined)
  assert.equal(getQuizPhotoObjectFit(comparison), 'cover')
})
