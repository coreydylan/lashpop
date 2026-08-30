import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  HOME_VISUAL_SURFACES,
  INTERACTION_VISUAL_SURFACES,
  MIN_REQUIRED_RENDERED_STATES,
  MIN_REQUIRED_VISUAL_CHECKS,
  ROUTE_VISUAL_SURFACES,
  VISUAL_PROJECTS,
  visualCoverageTotals,
} from '../tests/browser/visual-coverage'

const requiredWidths = new Set(['visual-narrow', 'visual-mobile', 'visual-desktop'])
const configuredWidths = new Set(VISUAL_PROJECTS)
if (
  configuredWidths.size !== requiredWidths.size
  || [...requiredWidths].some((project) => !configuredWidths.has(project))
) {
  throw new Error('Visual coverage must include exact 320, 390, and 1440 projects')
}

const requiredHome = ['hero', 'founder', 'services', 'team', 'reviews', 'gallery', 'faq', 'find-us', 'footer']
for (const surface of requiredHome) {
  if (!HOME_VISUAL_SURFACES.some((candidate) => candidate.id === surface)) {
    throw new Error(`Missing required homepage visual surface: ${surface}`)
  }
}

const requiredRoutes = ['/services', '/services/classic', '/work-with-us', '/privacy', '/terms']
for (const route of requiredRoutes) {
  if (!ROUTE_VISUAL_SURFACES.some((candidate) => candidate.path === route)) {
    throw new Error(`Missing required public route visual surface: ${route}`)
  }
}

const requiredStates = ['scrolled-navigation', 'faq-expanded', 'service-browser', 'booking-classic-fill', 'quiz-welcome']
for (const state of requiredStates) {
  if (!INTERACTION_VISUAL_SURFACES.some((candidate) => candidate.id === state)) {
    throw new Error(`Missing required interactive visual surface: ${state}`)
  }
}

const totals = visualCoverageTotals()
if (totals.renderedStates < MIN_REQUIRED_RENDERED_STATES) {
  throw new Error(`Visual coverage shrank to ${totals.renderedStates} rendered states; minimum is ${MIN_REQUIRED_RENDERED_STATES}`)
}
if (totals.checks < MIN_REQUIRED_VISUAL_CHECKS) {
  throw new Error(`Visual coverage shrank to ${totals.checks} checks; minimum is ${MIN_REQUIRED_VISUAL_CHECKS}`)
}

const allowMissing = process.argv.includes('--allow-missing-snapshots')
if (!allowMissing) {
  const expected: string[] = []
  for (const surface of HOME_VISUAL_SURFACES) {
    for (const project of VISUAL_PROJECTS) {
      expected.push(
        `tests/browser/visual.spec.ts-snapshots/${surface.id}-${project}.png`,
        `tests/browser/visual.spec.ts-snapshots/${surface.id}-${project}-linux.png`,
      )
    }
  }
  for (const surface of [...ROUTE_VISUAL_SURFACES, ...INTERACTION_VISUAL_SURFACES]) {
    for (const project of VISUAL_PROJECTS) {
      expected.push(
        `tests/browser/visual-matrix.spec.ts-snapshots/${surface.id}-${project}.png`,
        `tests/browser/visual-matrix.spec.ts-snapshots/${surface.id}-${project}-linux.png`,
      )
    }
  }
  const missing = expected.filter((path) => !existsSync(resolve(path)))
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.length} required visual baselines:\n${missing.join('\n')}`)
  }
}

console.log(
  `Visual coverage verified: ${totals.surfaces} named surfaces, `
  + `${totals.renderedStates} rendered states, ${totals.checks} required checks.`,
)
