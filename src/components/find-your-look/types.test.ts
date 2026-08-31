import assert from "node:assert/strict"
import test from "node:test"
import {
  Q1_SCORES,
  Q2_SCORES,
  applyScoreChanges,
  applySkippedPair,
  checkWinCondition,
  createEmptyScores,
  getPairKey,
  getQuestionnaireScores,
  getResultRankedStyles,
  getUnusedStylePairs,
  pickQuizPhoto,
  type QuizPhoto,
} from "./types"

test("questionnaire answers are immediately reflected in quiz scores", () => {
  const afterQ1 = applyScoreChanges(createEmptyScores(), Q1_SCORES.B)
  const afterQ2 = applyScoreChanges(afterQ1, Q2_SCORES.B)

  assert.deepEqual(afterQ2, {
    classic: 2,
    hybrid: 0,
    wetAngel: 2,
    volume: 0,
  })
})

test('every questionnaire button pair maps to exactly its current answers', () => {
  const answers = ['A', 'B', 'C', 'D'] as const

  for (const q1 of answers) {
    for (const q2 of answers) {
      const expected = applyScoreChanges(
        applyScoreChanges(createEmptyScores(), Q1_SCORES[q1]),
        Q2_SCORES[q2],
      )
      assert.deepEqual(getQuestionnaireScores(q1, q2), expected)
    }
  }

  assert.deepEqual(getQuestionnaireScores('C', 'D'), {
    classic: 0,
    hybrid: 0,
    wetAngel: 0,
    volume: 4,
  })
  assert.deepEqual(getQuestionnaireScores('A', 'A'), {
    classic: 4,
    hybrid: 0,
    wetAngel: 0,
    volume: 0,
  })
})

test('skipping a photo pair does not change any preference scores', () => {
  const scores = { classic: 3, wetAngel: 2, hybrid: 1, volume: 0 }

  assert.deepEqual(applySkippedPair(scores), scores)
})

test("four styles produce six unique comparisons without recycling a pair", () => {
  const scores = createEmptyScores()
  const usedPairs = new Set<string>()

  for (let round = 0; round < 6; round++) {
    const [pair] = getUnusedStylePairs(scores, usedPairs, round === 0)
    assert.ok(pair)
    usedPairs.add(getPairKey(pair[0], pair[1]))
  }

  assert.equal(usedPairs.size, 6)
  assert.equal(getUnusedStylePairs(scores, usedPairs).length, 0)
})

test("the final selected style wins a tied final score", () => {
  const scores = {
    classic: 3,
    hybrid: 1,
    wetAngel: 3,
    volume: 1,
  }

  assert.equal(checkWinCondition(scores, 6, "wetAngel"), "wetAngel")
})

test('labeled photo choices outrank a contradictory questionnaire result', () => {
  const classicQuestionnaire = getQuestionnaireScores('A', 'A')

  assert.equal(
    getResultRankedStyles(
      { classic: 0, wetAngel: 0, hybrid: 3, volume: 0 },
      classicQuestionnaire,
      'hybrid',
    )[0],
    'hybrid',
  )
  assert.equal(
    getResultRankedStyles(
      { classic: 0, wetAngel: 3, hybrid: 0, volume: 0 },
      classicQuestionnaire,
      'wetAngel',
    )[0],
    'wetAngel',
  )
})

test('questionnaire supplies the result when every photo comparison is skipped', () => {
  const volumeQuestionnaire = getQuestionnaireScores('C', 'D')

  assert.equal(
    getResultRankedStyles(createEmptyScores(), volumeQuestionnaire)[0],
    'volume',
  )
})

test('each decisive photo leader can finish after three completed comparisons', () => {
  const baseline = createEmptyScores()

  for (const style of ['classic', 'wetAngel', 'hybrid', 'volume'] as const) {
    const photoScores = { ...createEmptyScores(), [style]: 2 }

    assert.equal(checkWinCondition(photoScores, 2, style, baseline), null)
    assert.equal(checkWinCondition(photoScores, 3, style, baseline), style)
  }
})

test('every unique two-to-one photo majority finishes after three comparisons', () => {
  const baseline = createEmptyScores()

  for (const style of ['classic', 'wetAngel', 'hybrid', 'volume'] as const) {
    const runnerUp = style === 'classic' ? 'volume' : 'classic'
    const photoScores = {
      ...createEmptyScores(),
      [style]: 2,
      [runnerUp]: 1,
    }

    assert.equal(checkWinCondition(photoScores, 3, style, baseline), style)
  }
})

test('an ambiguous path keeps all six comparisons before the questionnaire tie-break', () => {
  const photoScores = { classic: 1, wetAngel: 1, hybrid: 1, volume: 1 }
  const volumeQuestionnaire = getQuestionnaireScores('C', 'D')

  assert.equal(checkWinCondition(photoScores, 3, undefined, volumeQuestionnaire), null)
  assert.equal(checkWinCondition(photoScores, 5, undefined, volumeQuestionnaire), null)
  assert.equal(checkWinCondition(photoScores, 6, undefined, volumeQuestionnaire), 'volume')
})

test("questionnaire preference resolves a skipped final tie", () => {
  const scores = {
    classic: 3,
    hybrid: 1,
    wetAngel: 3,
    volume: 1,
  }
  const baseline = {
    classic: 1,
    hybrid: 0,
    wetAngel: 2,
    volume: 0,
  }

  assert.equal(checkWinCondition(scores, 6, undefined, baseline), "wetAngel")
})

test("the first comparison uses the same sorted photos that were preloaded", () => {
  const photos = [
    { assetId: "first", isEnabled: true },
    { assetId: "second", isEnabled: true },
  ] as QuizPhoto[]

  assert.equal(pickQuizPhoto(photos, new Set(), true)?.assetId, "first")
  assert.equal(pickQuizPhoto(photos, new Set(["first"]), true)?.assetId, "second")
})
