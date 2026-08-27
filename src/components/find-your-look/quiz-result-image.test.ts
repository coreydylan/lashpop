import assert from 'node:assert/strict'
import test from 'node:test'
import type { LashStyle, QuizPhoto } from './types'
import { getQuizResultImageCandidates, uniqueImageCandidates } from './quiz-result-image'

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

test('keeps the admin-configured result crop first, ahead of every fallback', () => {
  const photos = {
    classic: [photo('classic', 'disabled', false), photo('classic', 'classic-enabled')],
    wetAngel: [],
    hybrid: [],
    volume: [],
  }

  assert.deepEqual(
    getQuizResultImageCandidates({
      style: 'classic',
      configuredImage: 'https://example.com/admin-result-crop.jpg',
      selectedPhoto: photo('classic', 'classic-selected'),
      photosByStyle: photos,
      bookingImage: 'https://example.com/booking.jpg',
      legacyFallbackImage: 'https://example.com/legacy-placeholder.jpg',
    }),
    [
      'https://example.com/admin-result-crop.jpg',
      'https://example.com/classic-selected.jpg',
      'https://example.com/classic-enabled.jpg',
      'https://example.com/booking.jpg',
      'https://example.com/legacy-placeholder.jpg',
    ],
  )
})

test('uses current same-style photos before the legacy placeholder when admin has no result image', () => {
  const photos = {
    classic: [photo('classic', 'classic-enabled')],
    wetAngel: [],
    hybrid: [],
    volume: [],
  }

  assert.deepEqual(
    getQuizResultImageCandidates({
      style: 'classic',
      configuredImage: null,
      selectedPhoto: photo('classic', 'classic-selected'),
      photosByStyle: photos,
      bookingImage: 'https://example.com/booking.jpg',
      legacyFallbackImage: 'https://example.com/legacy-placeholder.jpg',
    }),
    [
      'https://example.com/classic-selected.jpg',
      'https://example.com/classic-enabled.jpg',
      'https://example.com/booking.jpg',
      'https://example.com/legacy-placeholder.jpg',
    ],
  )
})
