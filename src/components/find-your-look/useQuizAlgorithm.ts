import { useState, useCallback, useMemo } from "react"
import {
  type LashStyle,
  type StyleScores,
  type QuizPhoto,
  type PhotoPair,
  type Q1Answer,
  type Q2Answer,
  Q1_SCORES,
  Q2_SCORES,
  QUIZ_CONFIG,
  createEmptyScores,
  getPairKey,
  getTopTwoStyles,
  checkWinCondition,
} from "./types"

interface UseQuizAlgorithmProps {
  photosByStyle: Record<LashStyle, QuizPhoto[]>
}

interface UseQuizAlgorithmReturn {
  // State
  scores: StyleScores
  roundNumber: number
  result: LashStyle | null
  currentPair: PhotoPair | null
  isLoading: boolean

  // Actions
  applyQ1Answer: (answer: Q1Answer) => void
  applyQ2Answer: (answer: Q2Answer) => void
  selectPhoto: (selectedStyle: LashStyle) => void
  startPhotoComparison: () => PhotoPair | null
  reset: () => void

  // Computed
  canStartQuiz: boolean
}

export function useQuizAlgorithm({
  photosByStyle,
}: UseQuizAlgorithmProps): UseQuizAlgorithmReturn {
  // State
  const [scores, setScores] = useState<StyleScores>(createEmptyScores())
  const [roundNumber, setRoundNumber] = useState(0)
  const [usedPairs, setUsedPairs] = useState<Set<string>>(new Set())
  const [usedPhotoIds, setUsedPhotoIds] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<LashStyle | null>(null)
  const [currentPair, setCurrentPair] = useState<PhotoPair | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check if we have enough photos to run the quiz
  const canStartQuiz = useMemo(() => {
    const hasEnoughPhotos = Object.values(photosByStyle).every(
      (photos) => photos.filter((p) => p.isEnabled).length >= 2
    )
    return hasEnoughPhotos
  }, [photosByStyle])

  // Apply Q1 answer scores
  const applyQ1Answer = useCallback((answer: Q1Answer) => {
    const scoreChanges = Q1_SCORES[answer]
    setScores((prev) => {
      const next = { ...prev }
      Object.entries(scoreChanges).forEach(([style, points]) => {
        if (points) {
          next[style as LashStyle] += points
        }
      })
      return next
    })
  }, [])

  // Apply Q2 answer scores
  const applyQ2Answer = useCallback((answer: Q2Answer) => {
    const scoreChanges = Q2_SCORES[answer]
    setScores((prev) => {
      const next = { ...prev }
      Object.entries(scoreChanges).forEach(([style, points]) => {
        if (points) {
          next[style as LashStyle] += points
        }
      })
      return next
    })
  }, [])

  // Get a random photo for a style, avoiding recently used ones
  const getRandomPhoto = useCallback(
    (style: LashStyle): QuizPhoto | null => {
      const availablePhotos = photosByStyle[style].filter(
        (p) => p.isEnabled && !usedPhotoIds.has(p.id)
      )

      // If all photos have been used, reset and use any enabled photo
      if (availablePhotos.length === 0) {
        const allEnabled = photosByStyle[style].filter((p) => p.isEnabled)
        if (allEnabled.length === 0) return null
        return allEnabled[Math.floor(Math.random() * allEnabled.length)]
      }

      return availablePhotos[Math.floor(Math.random() * availablePhotos.length)]
    },
    [photosByStyle, usedPhotoIds]
  )

  // Select the next pair of styles to compare
  const selectNextStylePair = useCallback((): [LashStyle, LashStyle] | null => {
    // Round 1 is always Classic vs Volume (extremes of spectrum)
    if (roundNumber === 0) {
      const pairKey = getPairKey("classic", "volume")
      if (!usedPairs.has(pairKey)) {
        return ["classic", "volume"]
      }
    }

    // Subsequent rounds: compare top 2 scoring styles
    const [top1, top2] = getTopTwoStyles(scores)
    const preferredPairKey = getPairKey(top1, top2)

    // If this pair hasn't been used, use it
    if (!usedPairs.has(preferredPairKey)) {
      return [top1, top2]
    }

    // Otherwise, find any unused pair from the top 3 styles
    const sortedStyles = (Object.entries(scores) as [LashStyle, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([style]) => style)

    for (let i = 0; i < sortedStyles.length; i++) {
      for (let j = i + 1; j < sortedStyles.length; j++) {
        const pairKey = getPairKey(sortedStyles[i], sortedStyles[j])
        if (!usedPairs.has(pairKey)) {
          return [sortedStyles[i], sortedStyles[j]]
        }
      }
    }

    // All pairs used - pick a random pair (shouldn't happen with 4-8 rounds)
    const allStyles: LashStyle[] = ["classic", "hybrid", "wetAngel", "volume"]
    const shuffled = allStyles.sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }, [roundNumber, scores, usedPairs])

  // Start photo comparison phase (called after Q2)
  const startPhotoComparison = useCallback((): PhotoPair | null => {
    const stylePair = selectNextStylePair()
    if (!stylePair) return null

    const [style1, style2] = stylePair
    const photo1 = getRandomPhoto(style1)
    const photo2 = getRandomPhoto(style2)

    if (!photo1 || !photo2) {
      console.error("Not enough photos for comparison")
      return null
    }

    // Randomly assign left/right
    const isSwapped = Math.random() > 0.5
    const pair: PhotoPair = isSwapped
      ? {
          left: photo2,
          right: photo1,
          leftStyle: style2,
          rightStyle: style1,
        }
      : {
          left: photo1,
          right: photo2,
          leftStyle: style1,
          rightStyle: style2,
        }

    setCurrentPair(pair)
    setRoundNumber(1)

    // Mark pair and photos as used
    setUsedPairs((prev) => new Set(prev).add(getPairKey(style1, style2)))
    setUsedPhotoIds((prev) => {
      const next = new Set(prev)
      next.add(photo1.id)
      next.add(photo2.id)
      return next
    })

    return pair
  }, [selectNextStylePair, getRandomPhoto])

  // Handle photo selection
  const selectPhoto = useCallback(
    (selectedStyle: LashStyle) => {
      // Add 1 point to selected style
      const newScores = { ...scores, [selectedStyle]: scores[selectedStyle] + 1 }
      setScores(newScores)

      const newRoundNumber = roundNumber + 1

      // Check win condition
      const winner = checkWinCondition(newScores, newRoundNumber)
      if (winner) {
        setResult(winner)
        setCurrentPair(null)
        return
      }

      // Select next pair
      setRoundNumber(newRoundNumber)

      const stylePair = selectNextStylePair()
      if (!stylePair) {
        // Fallback: pick highest scorer
        const sortedStyles = (Object.entries(newScores) as [LashStyle, number][])
          .sort((a, b) => b[1] - a[1])
        setResult(sortedStyles[0][0])
        setCurrentPair(null)
        return
      }

      const [style1, style2] = stylePair
      const photo1 = getRandomPhoto(style1)
      const photo2 = getRandomPhoto(style2)

      if (!photo1 || !photo2) {
        // Fallback: pick highest scorer
        const sortedStyles = (Object.entries(newScores) as [LashStyle, number][])
          .sort((a, b) => b[1] - a[1])
        setResult(sortedStyles[0][0])
        setCurrentPair(null)
        return
      }

      // Randomly assign left/right
      const isSwapped = Math.random() > 0.5
      const pair: PhotoPair = isSwapped
        ? {
            left: photo2,
            right: photo1,
            leftStyle: style2,
            rightStyle: style1,
          }
        : {
            left: photo1,
            right: photo2,
            leftStyle: style1,
            rightStyle: style2,
          }

      setCurrentPair(pair)

      // Mark pair and photos as used
      setUsedPairs((prev) => new Set(prev).add(getPairKey(style1, style2)))
      setUsedPhotoIds((prev) => {
        const next = new Set(prev)
        next.add(photo1.id)
        next.add(photo2.id)
        return next
      })
    },
    [scores, roundNumber, selectNextStylePair, getRandomPhoto]
  )

  // Reset quiz state
  const reset = useCallback(() => {
    setScores(createEmptyScores())
    setRoundNumber(0)
    setUsedPairs(new Set())
    setUsedPhotoIds(new Set())
    setResult(null)
    setCurrentPair(null)
    setIsLoading(false)
  }, [])

  return {
    // State
    scores,
    roundNumber,
    result,
    currentPair,
    isLoading,

    // Actions
    applyQ1Answer,
    applyQ2Answer,
    selectPhoto,
    startPhotoComparison,
    reset,

    // Computed
    canStartQuiz,
  }
}
