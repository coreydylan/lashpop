import assert from 'node:assert/strict'
import test from 'node:test'
import {
  QUIZ_COMPARISON_CROP_ASPECT,
  clampQuizCropToBounds,
  getQuizCropPercentBox,
} from './quiz-crop'

test('a square source produces the widest in-bounds 3:4 portrait master', () => {
  const box = getQuizCropPercentBox(
    { x: 50, y: 50, scale: 0.5 },
    1,
    QUIZ_COMPARISON_CROP_ASPECT,
  )

  assert.equal(box.widthPercent, 71.25)
  assert.equal(box.heightPercent, 95)
  assert.equal(box.widthPercent / box.heightPercent, QUIZ_COMPARISON_CROP_ASPECT)
})

test('crop positioning stays inside every source edge', () => {
  const crop = clampQuizCropToBounds(
    { x: 100, y: 0, scale: 0.5 },
    1,
    QUIZ_COMPARISON_CROP_ASPECT,
  )
  const box = getQuizCropPercentBox(crop, 1, QUIZ_COMPARISON_CROP_ASPECT)

  assert.equal(crop.x, 100 - box.widthPercent / 2)
  assert.equal(crop.y, box.heightPercent / 2)
  assert.ok(box.widthPercent <= 95)
  assert.ok(box.heightPercent <= 95)
})

test('portrait originals retain their requested crop without aspect distortion', () => {
  const box = getQuizCropPercentBox(
    { x: 50, y: 50, scale: 1 },
    3 / 4,
    QUIZ_COMPARISON_CROP_ASPECT,
  )

  assert.equal(box.widthPercent, 70)
  assert.equal(box.heightPercent, 70)
})
