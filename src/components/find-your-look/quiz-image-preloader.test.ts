import assert from 'node:assert/strict'
import test from 'node:test'
import type { LashStyle, QuizPhoto } from './types'
import { getQuizImageLoadPlan, getQuizImageSrcSet } from './quiz-image-preloader'

function photo(style: LashStyle, assetId: string, enabled = true): QuizPhoto {
  return {
    id: assetId,
    assetId,
    lashStyle: style,
    cropData: null,
    cropUrl: null,
    isEnabled: enabled,
    sortOrder: 0,
    filePath: `https://pub-b6624c485ec245d68de72be196a72d75.r2.dev/uploads/${assetId}.jpg`,
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

  assert.match(srcSet, /lashpop-img\.experial\.workers\.dev\/uploads\/classic-first\.jpg\?w=384&q=90 384w/)
  assert.match(srcSet, /lashpop-img\.experial\.workers\.dev\/uploads\/classic-first\.jpg\?w=600&q=90 600w/)
})
