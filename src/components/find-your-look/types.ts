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
  MIN_ROUNDS: 4,
  MAX_ROUNDS: 8,
  WIN_MARGIN: 2, // Points ahead to win early
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

// Helper: get top 2 scoring styles
export function getTopTwoStyles(scores: StyleScores): [LashStyle, LashStyle] {
  const sorted = (Object.entries(scores) as [LashStyle, number][])
    .sort((a, b) => b[1] - a[1])

  return [sorted[0][0], sorted[1][0]]
}

// Helper: check win condition
export function checkWinCondition(
  scores: StyleScores,
  roundNumber: number
): LashStyle | null {
  const sorted = (Object.entries(scores) as [LashStyle, number][])
    .sort((a, b) => b[1] - a[1])

  const [first, second] = sorted
  const margin = first[1] - second[1]

  // Early win: leader has 2+ point margin after minimum rounds
  if (roundNumber >= QUIZ_CONFIG.MIN_ROUNDS && margin >= QUIZ_CONFIG.WIN_MARGIN) {
    return first[0]
  }

  // Max rounds reached: highest score wins
  if (roundNumber >= QUIZ_CONFIG.MAX_ROUNDS) {
    // If tied, pick first alphabetically for consistency
    if (margin === 0) {
      return [first[0], second[0]].sort()[0]
    }
    return first[0]
  }

  return null
}
