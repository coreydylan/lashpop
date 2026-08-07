import assert from 'node:assert/strict'
import test from 'node:test'
import type { LashStyle, QuizPhoto } from './types'
import { getQuizResultFallbackImages, uniqueImageCandidates } from './quiz-result-image'

function photo(style: LashStyle, assetId: string, enabled = true): QuizPhoto {
  return {
    id: assetId,
    assetId,
    lashStyle: style,
    cropData: null,
    cropUrl: null,
    isEnabled: enabled,
    sortOrder: 0,
    filePath: `https://example.com/${assetId}.jpg`,
    fileName: `${assetId}.jpg`,
  }
}

test('keeps the canonical result first and removes empty or duplicate fallbacks', () => {
  assert.deepEqual(
    uniqueImageCandidates('result.jpg', ['', null, 'comparison.jpg', 'result.jpg']),
    ['result.jpg', 'comparison.jpg'],
  )
})

test('falls back to an enabled photo of the matched style before the booking image', () => {
  const photos = {
    classic: [photo('classic', 'disabled', false), photo('classic', 'classic-enabled')],
    wetAngel: [],
    hybrid: [],
    volume: [],
  }

  assert.deepEqual(
    getQuizResultFallbackImages('classic', photos, 'https://example.com/booking.jpg'),
    [
      'https://example.com/classic-enabled.jpg',
      'https://example.com/booking.jpg',
    ],
  )
})
