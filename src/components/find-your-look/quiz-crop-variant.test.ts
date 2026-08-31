import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyQuizCropVariant } from '@/lib/quiz-crop-variant'

test('classifies the legacy square masters before public URL normalization hides their filenames', () => {
  assert.equal(
    classifyQuizCropVariant('https://r2.example/IMG_6439-square-20260827-canonical-v1.jpg'),
    'legacy-square',
  )
  assert.equal(
    classifyQuizCropVariant('https://r2.example/IMG_6439-portrait-safe-20260831.jpg'),
    'portrait-safe',
  )
  assert.equal(classifyQuizCropVariant(null), 'none')
})
