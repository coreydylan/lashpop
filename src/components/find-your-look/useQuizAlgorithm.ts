import { useState, useCallback, useMemo, useRef } from "react"
import {
  type LashStyle,
  type StyleScores,
  type QuizPhoto,
  type PhotoPair,
  type Q1Answer,
  type Q2Answer,
  createEmptyScores,
  getPairKey,
  getResultRankedStyles,
  getUnusedStylePairs,
  checkWinCondition,
  applySkippedPair,
  getQuestionnaireScores,
  pickQuizPhoto,
} from "./types"

interface UseQuizAlgorithmProps {
  photosByStyle: Record<LashStyle, QuizPhoto[]>
}

interface UseQuizAlgorithmReturn {
  scores: StyleScores
  roundNumber: number
  result: LashStyle | null
  resultPhoto: QuizPhoto | null
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
  const [resultPhoto, setResultPhoto] = useState<QuizPhoto | null>(null)
  const [currentPair, setCurrentPair] = useState<PhotoPair | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Event handlers in the modal apply questionnaire points and start the photo
  // phase in the same tick. Refs keep those calculations synchronous while the
  // mirrored React state drives rendering.
  const scoresRef = useRef<StyleScores>(emptyScores)
  const photoScoresRef = useRef<StyleScores>(emptyScores)
  const baselineScoresRef = useRef<StyleScores>(emptyScores)
  const q1AnswerRef = useRef<Q1Answer | null>(null)
  const q2AnswerRef = useRef<Q2Answer | null>(null)
  const roundNumberRef = useRef(0)
  const currentPairRef = useRef<PhotoPair | null>(null)
  const usedPairsRef = useRef<Set<string>>(new Set())
  const usedAssetIdsRef = useRef<Set<string>>(new Set())
  const selectedPhotosByStyleRef = useRef<Partial<Record<LashStyle, QuizPhoto>>>({})

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
    q1AnswerRef.current = answer
    const next = getQuestionnaireScores(answer, q2AnswerRef.current)
    baselineScoresRef.current = { ...next }
    commitScores(next)
  }, [commitScores])

  const applyQ2Answer = useCallback((answer: Q2Answer) => {
    q2AnswerRef.current = answer
    const next = getQuestionnaireScores(q1AnswerRef.current, answer)
    baselineScoresRef.current = { ...next }
    commitScores(next)
  }, [commitScores])

  const getRandomPhoto = useCallback((
    style: LashStyle,
    excludedAssetIds: Set<string>,
    preferFirst = false,
  ): QuizPhoto | null => {
    return pickQuizPhoto(
      photosByStyle[style] ?? [],
      excludedAssetIds,
      preferFirst,
    )
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

    const preferPreloadedFirstPair = completedRounds === 0

    for (const [style1, style2] of candidates) {
      const photo1 = getRandomPhoto(
        style1,
        usedAssetIdsRef.current,
        preferPreloadedFirstPair,
      )
      if (!photo1) continue

      const secondPhotoExclusions = new Set(usedAssetIdsRef.current)
      secondPhotoExclusions.add(photo1.assetId)
      const photo2 = getRandomPhoto(
        style2,
        secondPhotoExclusions,
        preferPreloadedFirstPair,
      )
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
    currentPhotoScores: StyleScores,
    tieBreakStyle?: LashStyle,
  ) => {
    const winner = getResultRankedStyles(
      currentPhotoScores,
      baselineScoresRef.current,
      tieBreakStyle,
    )[0]
    currentPairRef.current = null
    setCurrentPair(null)
    setResultPhoto(selectedPhotosByStyleRef.current[winner] ?? null)
    setResult(winner)
  }, [])

  const startPhotoComparison = useCallback((): PhotoPair | null => {
    const questionnaireScores = getQuestionnaireScores(
      q1AnswerRef.current,
      q2AnswerRef.current,
    )
    baselineScoresRef.current = { ...questionnaireScores }
    roundNumberRef.current = 0
    currentPairRef.current = null
    usedPairsRef.current = new Set()
    usedAssetIdsRef.current = new Set()
    selectedPhotosByStyleRef.current = {}
    photoScoresRef.current = createEmptyScores()
    setRoundNumber(0)
    setCurrentPair(null)
    setResult(null)
    setResultPhoto(null)
    commitScores(questionnaireScores)

    const pair = createPhotoPair(questionnaireScores, 0)

    if (!pair) {
      finish(photoScoresRef.current)
      return null
    }

    roundNumberRef.current = 1
    setRoundNumber(1)
    commitPair(pair)
    return pair
  }, [commitPair, commitScores, createPhotoPair, finish])

  const advanceAfterRound = useCallback((
    nextCombinedScores: StyleScores,
    nextPhotoScores: StyleScores,
    tieBreakStyle?: LashStyle,
  ) => {
    const completedRounds = roundNumberRef.current
    const winner = checkWinCondition(
      nextPhotoScores,
      completedRounds,
      tieBreakStyle,
      baselineScoresRef.current,
    )

    if (winner) {
      currentPairRef.current = null
      setCurrentPair(null)
      setResultPhoto(selectedPhotosByStyleRef.current[winner] ?? null)
      setResult(winner)
      return
    }

    const nextPair = createPhotoPair(nextCombinedScores, completedRounds)
    if (!nextPair) {
      finish(nextPhotoScores, tieBreakStyle)
      return
    }

    const nextRound = completedRounds + 1
    roundNumberRef.current = nextRound
    setRoundNumber(nextRound)
    commitPair(nextPair)
  }, [commitPair, createPhotoPair, finish])

  const selectPhoto = useCallback((selectedStyle: LashStyle) => {
    const pair = currentPairRef.current
    if (!pair) return

    const selectedPhoto = pair.leftStyle === selectedStyle ? pair.left : pair.right
    selectedPhotosByStyleRef.current = {
      ...selectedPhotosByStyleRef.current,
      [selectedStyle]: selectedPhoto,
    }
    const nextScores = {
      ...scoresRef.current,
      [selectedStyle]: scoresRef.current[selectedStyle] + 1,
    }
    const nextPhotoScores = {
      ...photoScoresRef.current,
      [selectedStyle]: photoScoresRef.current[selectedStyle] + 1,
    }
    photoScoresRef.current = nextPhotoScores
    commitScores(nextScores)
    advanceAfterRound(nextScores, nextPhotoScores, selectedStyle)
  }, [advanceAfterRound, commitScores])

  const skipPair = useCallback(() => {
    const pair = currentPairRef.current
    if (!pair) return

    const nextScores = applySkippedPair(scoresRef.current)
    commitScores(nextScores)
    advanceAfterRound(nextScores, photoScoresRef.current)
  }, [advanceAfterRound, commitScores])

  const reset = useCallback(() => {
    const nextScores = createEmptyScores()
    scoresRef.current = nextScores
    photoScoresRef.current = nextScores
    baselineScoresRef.current = nextScores
    q1AnswerRef.current = null
    q2AnswerRef.current = null
    roundNumberRef.current = 0
    currentPairRef.current = null
    usedPairsRef.current = new Set()
    usedAssetIdsRef.current = new Set()
    selectedPhotosByStyleRef.current = {}

    setScores(nextScores)
    setRoundNumber(0)
    setResult(null)
    setResultPhoto(null)
    setCurrentPair(null)
    setIsLoading(false)
  }, [])

  return {
    scores,
    roundNumber,
    result,
    resultPhoto,
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
