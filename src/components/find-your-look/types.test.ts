import assert from "node:assert/strict"
import test from "node:test"
import {
  Q1_SCORES,
  Q2_SCORES,
  applyScoreChanges,
  checkWinCondition,
  createEmptyScores,
  getPairKey,
  getUnusedStylePairs,
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
