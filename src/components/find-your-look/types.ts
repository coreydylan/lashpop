// Lash styles for the quiz (lashLift removed)
export type LashStyle = "classic" | "hybrid" | "wetAngel" | "volume"

// All lash styles in order of similarity spectrum
// Classic → Wet/Angel → Hybrid → Volume
export const LASH_STYLE_SPECTRUM: LashStyle[] = ["classic", "wetAngel", "hybrid", "volume"]

// Quiz answers
export type Q1Answer = "A" | "B" | "C" | "D"
export type Q2Answer = "A" | "B" | "C" | "D"

// Style scores object
export type StyleScores = Record<LashStyle, number>

// Q1 Score Mappings - Beauty routine
// A (minimal)     → Classic +2
// B (light)       → Classic +1, Wet/Angel +1
// C (full glam)   → Volume +2
// D (flexible)    → Hybrid +1, Wet/Angel +1
export const Q1_SCORES: Record<Q1Answer, Partial<StyleScores>> = {
  A: { classic: 2 },
  B: { classic: 1, wetAngel: 1 },
  C: { volume: 2 },
  D: { hybrid: 1, wetAngel: 1 },
}

// Q2 Score Mappings - Lash look feel
// A (barely there) → Classic +2
// B (soft natural) → Classic +1, Wet/Angel +1
// C (fuller)       → Hybrid +2
// D (bold)         → Volume +2
export const Q2_SCORES: Record<Q2Answer, Partial<StyleScores>> = {
  A: { classic: 2 },
  B: { classic: 1, wetAngel: 1 },
  C: { hybrid: 2 },
  D: { volume: 2 },
}

// Quiz photo from the database
export interface QuizPhoto {
  id: string
  assetId: string
  lashStyle: LashStyle
  cropData: { x: number; y: number; scale: number } | null
  cropUrl: string | null
  isEnabled: boolean
  sortOrder: number
  filePath: string
  fileName: string
}

// Photo pair for comparison
export interface PhotoPair {
  left: QuizPhoto
  right: QuizPhoto
  leftStyle: LashStyle
  rightStyle: LashStyle
}

// Quiz state
export interface QuizState {
  scores: StyleScores
  roundNumber: number
  usedPairs: Set<string> // "styleA-styleB" format
  usedPhotoIds: Set<string>
  result: LashStyle | null
}

// Lash style display details
export const LASH_STYLE_DETAILS: Record<LashStyle, {
  name: string
  displayName: string
  recommendedService: string
  description: string
  bestFor: string[]
  bookingLabel: string
}> = {
  classic: {
    name: "Classic",
    displayName: "Classic Lashes",
    recommendedService: "Classic Lashes",
    description: "You love a natural, polished look that still makes your eyes stand out. Classic lashes add length and definition by placing one extension on each natural lash, while keeping things soft and effortless. That \"better than mascara\" but without the mascara look.",
    bestFor: [
      "First-time extension clients",
      "Natural makeup lovers",
      "Everyday wear",
    ],
    bookingLabel: "Book Classic Full Set",
  },
  wetAngel: {
    name: "Wet / Angel",
    displayName: "Wet / Angel Lashes",
    recommendedService: "Wet / Angel Set",
    description: "You love a modern, clean, model-off-duty look. Wet and Angel sets give you glossy, defined lashes that feel natural but elevated. Wet / angel lashes create soft, wispy spikes that give your eyes a bright, fresh look. Perfect if you want definition and texture while still keeping things light and airy.",
    bestFor: [
      "You like a soft but noticeable lash look",
      "You love a fresh, dewy, \"model off duty\" vibe",
      "You love a minimal makeup routine",
    ],
    bookingLabel: "Book Wet / Angel Set",
  },
  hybrid: {
    name: "Hybrid",
    displayName: "Hybrid Lashes",
    recommendedService: "Hybrid Lashes",
    description: "You like your lashes a little fuller and more textured but still a soft and everyday look. Hybrid lashes blend classic and volume techniques for the perfect balance of texture and fullness.",
    bestFor: [
      "You want more fullness than classic, but not too dramatic",
      "You love a fluffy, textured finish",
      "You want a look that transitions easily from day to night",
    ],
    bookingLabel: "Book Hybrid Full Set",
  },
  volume: {
    name: "Volume",
    displayName: "Volume Lashes",
    recommendedService: "Volume Lashes",
    description: "You love bold, fluffy lashes that make a statement. Volume sets give you maximum fullness and drama for a high-impact look.",
    bestFor: [
      "Full glam fans",
      "Sparse natural lashes",
      "You love a dark and full lash line",
    ],
    bookingLabel: "Book Volume Full Set",
  },
}

// Result images — these are re-uploaded after R2 migration, paths use the uploads/quiz/ prefix
const R2_BASE = process.env.NEXT_PUBLIC_R2_BUCKET_URL || ""
export const RESULT_IMAGES: Record<LashStyle, string> = {
  classic: `${R2_BASE}/uploads/quiz/result-classic.jpg`,
  wetAngel: `${R2_BASE}/uploads/quiz/result-wetangel.jpg`,
  hybrid: `${R2_BASE}/uploads/quiz/result-hybrid.jpg`,
  volume: `${R2_BASE}/uploads/quiz/result-volume.jpg`,
}

// Quiz configuration
export const QUIZ_CONFIG = {
  // Four styles have exactly six unique head-to-head pairings. Stopping at
  // six guarantees every labeled style pairing is considered once and the
  // quiz never has to recycle a comparison.
  MAX_ROUNDS: 6,
}

// Helper: create empty scores object
export function createEmptyScores(): StyleScores {
  return {
    classic: 0,
    hybrid: 0,
    wetAngel: 0,
    volume: 0,
  }
}

// Helper: get pair key for tracking used pairs
export function getPairKey(style1: LashStyle, style2: LashStyle): string {
  const sorted = [style1, style2].sort()
  return `${sorted[0]}-${sorted[1]}`
}

export function applyScoreChanges(
  scores: StyleScores,
  changes: Partial<StyleScores>,
): StyleScores {
  const next = { ...scores }
  Object.entries(changes).forEach(([style, points]) => {
    if (points) next[style as LashStyle] += points
  })
  return next
}

export function getQuestionnaireScores(
  q1Answer: Q1Answer | null,
  q2Answer: Q2Answer | null,
): StyleScores {
  let scores = createEmptyScores()
  if (q1Answer) scores = applyScoreChanges(scores, Q1_SCORES[q1Answer])
  if (q2Answer) scores = applyScoreChanges(scores, Q2_SCORES[q2Answer])
  return scores
}

// "Neither" means the comparison supplied no preference signal. Advancing
// must preserve the questionnaire and prior photo-selection scores exactly;
// subtracting from both displayed styles can otherwise manufacture a winner.
export function applySkippedPair(scores: StyleScores): StyleScores {
  return { ...scores }
}

export function pickQuizPhoto(
  photos: QuizPhoto[],
  excludedAssetIds: Set<string>,
  preferFirst = false,
  randomValue = Math.random(),
): QuizPhoto | null {
  const available = photos.filter(
    (photo) => photo.isEnabled && !excludedAssetIds.has(photo.assetId),
  )
  if (available.length === 0) return null
  if (preferFirst) return available[0]
  return available[Math.floor(randomValue * available.length)] ?? available[0]
}

export function getRankedStyles(
  scores: StyleScores,
  tieBreakStyle?: LashStyle,
  baselineScores?: StyleScores,
): LashStyle[] {
  return [...LASH_STYLE_SPECTRUM].sort((a, b) => {
    const scoreDifference = scores[b] - scores[a]
    if (scoreDifference !== 0) return scoreDifference

    if (tieBreakStyle === a) return -1
    if (tieBreakStyle === b) return 1

    const baselineDifference = (baselineScores?.[b] ?? 0) - (baselineScores?.[a] ?? 0)
    if (baselineDifference !== 0) return baselineDifference

    return LASH_STYLE_SPECTRUM.indexOf(a) - LASH_STYLE_SPECTRUM.indexOf(b)
  })
}

// Photo comparisons are the client's labeled, visual source of truth. Keep
// questionnaire answers as a useful tie-breaker, but never let their larger
// point totals override a clear preference expressed through the photos.
export function getResultRankedStyles(
  photoScores: StyleScores,
  baselineScores: StyleScores,
  tieBreakStyle?: LashStyle,
): LashStyle[] {
  return [...LASH_STYLE_SPECTRUM].sort((a, b) => {
    const photoDifference = photoScores[b] - photoScores[a]
    if (photoDifference !== 0) return photoDifference

    const baselineDifference = baselineScores[b] - baselineScores[a]
    if (baselineDifference !== 0) return baselineDifference

    if (tieBreakStyle === a) return -1
    if (tieBreakStyle === b) return 1

    return LASH_STYLE_SPECTRUM.indexOf(a) - LASH_STYLE_SPECTRUM.indexOf(b)
  })
}

// Helper: get top 2 scoring styles
export function getTopTwoStyles(scores: StyleScores): [LashStyle, LashStyle] {
  const sorted = getRankedStyles(scores)
  return [sorted[0], sorted[1]]
}

export function getUnusedStylePairs(
  scores: StyleScores,
  usedPairs: Set<string>,
  firstRound = false,
): Array<[LashStyle, LashStyle]> {
  const pairs: Array<[LashStyle, LashStyle]> = []
  const addPair = (first: LashStyle, second: LashStyle) => {
    const key = getPairKey(first, second)
    if (!usedPairs.has(key) && !pairs.some(([a, b]) => getPairKey(a, b) === key)) {
      pairs.push([first, second])
    }
  }

  if (firstRound) addPair("classic", "volume")

  const ranked = getRankedStyles(scores)
  addPair(ranked[0], ranked[1])

  const allPairs: Array<[LashStyle, LashStyle]> = []
  for (let i = 0; i < ranked.length; i++) {
    for (let j = i + 1; j < ranked.length; j++) {
      allPairs.push([ranked[i], ranked[j]])
    }
  }

  allPairs
    .sort((a, b) => {
      const aTotal = scores[a[0]] + scores[a[1]]
      const bTotal = scores[b[0]] + scores[b[1]]
      return bTotal - aTotal
    })
    .forEach(([first, second]) => addPair(first, second))

  return pairs
}

// Helper: check win condition
export function checkWinCondition(
  photoScores: StyleScores,
  completedRounds: number,
  tieBreakStyle?: LashStyle,
  baselineScores?: StyleScores,
): LashStyle | null {
  if (completedRounds < QUIZ_CONFIG.MAX_ROUNDS) return null

  return getResultRankedStyles(
    photoScores,
    baselineScores ?? createEmptyScores(),
    tieBreakStyle,
  )[0]
}
