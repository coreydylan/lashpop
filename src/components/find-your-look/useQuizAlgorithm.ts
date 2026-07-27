import { useState, useCallback, useMemo, useRef } from "react"
import {
  type LashStyle,
  type StyleScores,
  type QuizPhoto,
  type PhotoPair,
  type Q1Answer,
  type Q2Answer,
  Q1_SCORES,
  Q2_SCORES,
  createEmptyScores,
  getPairKey,
  getRankedStyles,
  getUnusedStylePairs,
  checkWinCondition,
  applyScoreChanges,
} from "./types"

interface UseQuizAlgorithmProps {
  photosByStyle: Record<LashStyle, QuizPhoto[]>
}

interface UseQuizAlgorithmReturn {
  scores: StyleScores
  roundNumber: number
  result: LashStyle | null
  currentPair: PhotoPair | null
  isLoading: boolean
  applyQ1Answer: (answer: Q1Answer) => void
  applyQ2Answer: (answer: Q2Answer) => void
  selectPhoto: (selectedStyle: LashStyle) => void
  skipPair: () => void
  startPhotoComparison: () => PhotoPair | null
  reset: () => void
  canStartQuiz: boolean
}

export function useQuizAlgorithm({
  photosByStyle,
}: UseQuizAlgorithmProps): UseQuizAlgorithmReturn {
  const emptyScores = useMemo(() => createEmptyScores(), [])
  const [scores, setScores] = useState<StyleScores>(emptyScores)
  const [roundNumber, setRoundNumber] = useState(0)
  const [result, setResult] = useState<LashStyle | null>(null)
  const [currentPair, setCurrentPair] = useState<PhotoPair | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Event handlers in the modal apply questionnaire points and start the photo
  // phase in the same tick. Refs keep those calculations synchronous while the
  // mirrored React state drives rendering.
  const scoresRef = useRef<StyleScores>(emptyScores)
  const baselineScoresRef = useRef<StyleScores>(emptyScores)
  const roundNumberRef = useRef(0)
  const currentPairRef = useRef<PhotoPair | null>(null)
  const usedPairsRef = useRef<Set<string>>(new Set())
  const usedAssetIdsRef = useRef<Set<string>>(new Set())

  const canStartQuiz = useMemo(() => {
    return Object.values(photosByStyle).every((photos) => {
      const enabledAssetIds = new Set(
        photos.filter((photo) => photo.isEnabled).map((photo) => photo.assetId),
      )
      return enabledAssetIds.size >= 2
    })
  }, [photosByStyle])

  const commitScores = useCallback((next: StyleScores) => {
    scoresRef.current = next
    setScores(next)
  }, [])

  const applyQ1Answer = useCallback((answer: Q1Answer) => {
    commitScores(applyScoreChanges(scoresRef.current, Q1_SCORES[answer]))
  }, [commitScores])

  const applyQ2Answer = useCallback((answer: Q2Answer) => {
    const next = applyScoreChanges(scoresRef.current, Q2_SCORES[answer])
    baselineScoresRef.current = { ...next }
    commitScores(next)
  }, [commitScores])

  const getRandomPhoto = useCallback((
    style: LashStyle,
    excludedAssetIds: Set<string>,
  ): QuizPhoto | null => {
    const available = (photosByStyle[style] ?? []).filter(
      (photo) => photo.isEnabled && !excludedAssetIds.has(photo.assetId),
    )
    if (available.length === 0) return null
    return available[Math.floor(Math.random() * available.length)]
  }, [photosByStyle])

  const createPhotoPair = useCallback((
    currentScores: StyleScores,
    completedRounds: number,
  ): PhotoPair | null => {
    const candidates = getUnusedStylePairs(
      currentScores,
      usedPairsRef.current,
      completedRounds === 0,
    )

    for (const [style1, style2] of candidates) {
      const photo1 = getRandomPhoto(style1, usedAssetIdsRef.current)
      if (!photo1) continue

      const secondPhotoExclusions = new Set(usedAssetIdsRef.current)
      secondPhotoExclusions.add(photo1.assetId)
      const photo2 = getRandomPhoto(style2, secondPhotoExclusions)
      if (!photo2) continue

      return Math.random() > 0.5
        ? { left: photo2, right: photo1, leftStyle: style2, rightStyle: style1 }
        : { left: photo1, right: photo2, leftStyle: style1, rightStyle: style2 }
    }

    return null
  }, [getRandomPhoto])

  const commitPair = useCallback((pair: PhotoPair) => {
    const nextPairs = new Set(usedPairsRef.current)
    nextPairs.add(getPairKey(pair.leftStyle, pair.rightStyle))
    usedPairsRef.current = nextPairs

    const nextAssets = new Set(usedAssetIdsRef.current)
    nextAssets.add(pair.left.assetId)
    nextAssets.add(pair.right.assetId)
    usedAssetIdsRef.current = nextAssets

    currentPairRef.current = pair
    setCurrentPair(pair)
  }, [])

  const finish = useCallback((
    currentScores: StyleScores,
    tieBreakStyle?: LashStyle,
  ) => {
    const winner = getRankedStyles(
      currentScores,
      tieBreakStyle,
      baselineScoresRef.current,
    )[0]
    currentPairRef.current = null
    setCurrentPair(null)
    setResult(winner)
  }, [])

  const startPhotoComparison = useCallback((): PhotoPair | null => {
    baselineScoresRef.current = { ...scoresRef.current }
    const pair = createPhotoPair(scoresRef.current, 0)

    if (!pair) {
      finish(scoresRef.current)
      return null
    }

    roundNumberRef.current = 1
    setRoundNumber(1)
    commitPair(pair)
    return pair
  }, [commitPair, createPhotoPair, finish])

  const advanceAfterRound = useCallback((
    nextScores: StyleScores,
    tieBreakStyle?: LashStyle,
  ) => {
    const completedRounds = roundNumberRef.current
    const winner = checkWinCondition(
      nextScores,
      completedRounds,
      tieBreakStyle,
      baselineScoresRef.current,
    )

    if (winner) {
      currentPairRef.current = null
      setCurrentPair(null)
      setResult(winner)
      return
    }

    const nextPair = createPhotoPair(nextScores, completedRounds)
    if (!nextPair) {
      finish(nextScores, tieBreakStyle)
      return
    }

    const nextRound = completedRounds + 1
    roundNumberRef.current = nextRound
    setRoundNumber(nextRound)
    commitPair(nextPair)
  }, [commitPair, createPhotoPair, finish])

  const selectPhoto = useCallback((selectedStyle: LashStyle) => {
    const nextScores = {
      ...scoresRef.current,
      [selectedStyle]: scoresRef.current[selectedStyle] + 1,
    }
    commitScores(nextScores)
    advanceAfterRound(nextScores, selectedStyle)
  }, [advanceAfterRound, commitScores])

  const skipPair = useCallback(() => {
    const pair = currentPairRef.current
    if (!pair) return

    const nextScores = {
      ...scoresRef.current,
      [pair.leftStyle]: Math.max(0, scoresRef.current[pair.leftStyle] - 1),
      [pair.rightStyle]: Math.max(0, scoresRef.current[pair.rightStyle] - 1),
    }
    commitScores(nextScores)
    advanceAfterRound(nextScores)
  }, [advanceAfterRound, commitScores])

  const reset = useCallback(() => {
    const nextScores = createEmptyScores()
    scoresRef.current = nextScores
    baselineScoresRef.current = nextScores
    roundNumberRef.current = 0
    currentPairRef.current = null
    usedPairsRef.current = new Set()
    usedAssetIdsRef.current = new Set()

    setScores(nextScores)
    setRoundNumber(0)
    setResult(null)
    setCurrentPair(null)
    setIsLoading(false)
  }, [])

  return {
    scores,
    roundNumber,
    result,
    currentPair,
    isLoading,
    applyQ1Answer,
    applyQ2Answer,
    selectPhoto,
    skipPair,
    startPhotoComparison,
    reset,
    canStartQuiz,
  }
}
