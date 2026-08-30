export const VISUAL_PROJECTS = [
  'visual-narrow',
  'visual-mobile',
  'visual-desktop',
] as const

export const HOME_VISUAL_SURFACES = [
  { id: 'hero', selector: 'section[data-section-id="hero"]:visible' },
  { id: 'founder', selector: '[data-section-id="founder"]' },
  { id: 'services', selector: 'section[data-section-id="services"]' },
  { id: 'team', selector: 'section[data-section-id="team"]' },
  { id: 'reviews', selector: '#reviews' },
  { id: 'gallery', selector: '#gallery' },
  { id: 'faq', selector: '#faq' },
  { id: 'find-us', selector: '#find-us', maskSelector: 'canvas.mapboxgl-canvas' },
  { id: 'footer', selector: 'footer[data-section-id="footer"]' },
] as const

export const ROUTE_VISUAL_SURFACES = [
  { id: 'services-index', path: '/services', heading: 'Services made for your everyday kind of beautiful.' },
  { id: 'service-classic', path: '/services/classic', heading: 'Classic Full Set' },
  { id: 'work-with-us', path: '/work-with-us', heading: 'Work With Us' },
  { id: 'privacy', path: '/privacy', heading: 'Privacy Policy' },
  { id: 'terms', path: '/terms', heading: 'Terms of Service' },
] as const

export const INTERACTION_VISUAL_SURFACES = [
  { id: 'scrolled-navigation' },
  { id: 'faq-expanded' },
  { id: 'service-browser' },
  { id: 'booking-classic-fill' },
  { id: 'quiz-welcome' },
] as const

export const CHECKS_PER_RENDERED_STATE = [
  'approved-screenshot',
  'horizontal-containment',
  'critical-geometry-and-image-integrity',
] as const

export const MIN_REQUIRED_RENDERED_STATES = 50
export const MIN_REQUIRED_VISUAL_CHECKS = 150

export function visualCoverageTotals() {
  const surfaces =
    HOME_VISUAL_SURFACES.length
    + ROUTE_VISUAL_SURFACES.length
    + INTERACTION_VISUAL_SURFACES.length
  const renderedStates = surfaces * VISUAL_PROJECTS.length
  const checks = renderedStates * CHECKS_PER_RENDERED_STATE.length
  return { surfaces, renderedStates, checks }
}
