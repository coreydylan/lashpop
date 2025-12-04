// DISCOVER YOUR LOOK AI - Type Definitions

// ============================================================================
// Discovery-Specific Types
// ============================================================================

export type DiscoveryMode = 'standalone' | 'inline'

export interface DiscoveryPreferences {
  // User profile
  isReturningVisitor?: boolean
  hasLashExperience?: boolean

  // Lifestyle factors
  lifestyleLevel?: 'low' | 'medium' | 'high' // Maintenance commitment
  dailyRoutineTime?: 'minimal' | 'moderate' | 'invested' // Time for beauty routine

  // Style preferences
  desiredLook?: 'natural' | 'enhanced' | 'dramatic' | 'glamorous'
  primaryConcern?: string // What brought them here

  // Service interests
  interestedCategories?: string[] // lashes, brows, facials, etc.
  selectedStyle?: string // classic, hybrid, volume, wet-angel

  // Specific needs
  skinConcerns?: string[] // acne, aging, dullness, dehydration, sensitivity
  browConcerns?: string[] // sparse, uneven, overplucked, needs-shaping

  // Exploration tracking
  educationViewed?: string[] // What they've learned about
  servicesExplored?: string[] // Services they've looked at

  // Recommended outcome
  recommendedServices?: RecommendedService[]

  // Cross-context communication (when invoked from Ask Lashpop)
  initialContext?: string
}

export interface RecommendedService {
  serviceSlug: string
  serviceName: string
  matchScore: number // 0-100 how well it matches preferences
  matchReasons: string[]
  categoryName: string
}

export interface DiscoveryAsset {
  id: string
  filePath: string
  altText?: string
  caption?: string
  tags: string[]
  serviceName?: string
  styleName?: string
  isBeforeAfter?: boolean
}

// ============================================================================
// Messages with Rich Content
// ============================================================================

export type DiscoveryMessageRole = 'user' | 'assistant' | 'system'

export interface DiscoveryMessage {
  id: string
  role: DiscoveryMessageRole
  content: string
  timestamp: number

  // Rich content (discovery-specific)
  images?: DiscoveryAsset[]
  styleCards?: StyleCard[]
  serviceRecommendation?: ServiceRecommendation

  // Actions and replies
  actions?: DiscoveryAction[]
  quickReplies?: DiscoveryQuickReply[]

  // State
  isLoading?: boolean
}

export interface StyleCard {
  id: string
  name: string
  description: string
  image?: DiscoveryAsset
  beforeAfter?: {
    before: DiscoveryAsset
    after: DiscoveryAsset
  }
  tags: string[]
  serviceSlug?: string
}

export interface ServiceRecommendation {
  service: {
    id: string
    name: string
    slug: string
    description: string
    priceStarting: number
    durationMinutes: number
    categoryName: string
    vagaroServiceCode?: string
  }
  matchScore: number
  matchReasons: string[]
  relatedServices?: Array<{
    slug: string
    name: string
    categoryName: string
  }>
}

// ============================================================================
// Actions - Things the Discovery AI can trigger
// ============================================================================

export type DiscoveryAction =
  | ShowStylesAction
  | ShowEducationAction
  | ShowBeforeAfterAction
  | RecommendServiceAction
  | BookServiceAction
  | InvokeAskLashpopAction
  | ScrollAction
  | OpenPanelAction

export interface ShowStylesAction {
  type: 'show_styles'
  category: string // lashes, brows, facials
  styles: string[] // specific styles to show
  label: string
  icon?: string
}

export interface ShowEducationAction {
  type: 'show_education'
  topic: string
  category: string
  label: string
  icon?: string
}

export interface ShowBeforeAfterAction {
  type: 'show_before_after'
  serviceSlug: string
  serviceName: string
  label: string
  icon?: string
}

export interface RecommendServiceAction {
  type: 'recommend_service'
  recommendation: ServiceRecommendation
  label: string
  icon?: string
}

export interface BookServiceAction {
  type: 'book_service'
  service: {
    id: string
    name: string
    slug: string
    vagaroServiceCode: string
    priceStarting: number
    durationMinutes: number
    categoryName?: string
  }
  label: string
  icon?: string
}

export interface InvokeAskLashpopAction {
  type: 'invoke_ask_lashpop'
  context?: string // What context to pass
  label: string
  icon?: string
}

export interface ScrollAction {
  type: 'scroll_to_section'
  target: string
  offset?: number
  alignment?: 'top' | 'center'
  thenCollapse?: boolean
  label: string
  icon?: string
}

export interface OpenPanelAction {
  type: 'open_panel'
  panelType: 'category-picker' | 'service-panel' | 'service-detail'
  data: {
    categoryId?: string
    categoryName?: string
    serviceId?: string
  }
  thenCollapse?: boolean
  label: string
  icon?: string
}

// ============================================================================
// Quick Replies
// ============================================================================

export type DiscoveryQuickReply =
  | TextQuickReply
  | ActionQuickReply
  | PreferenceQuickReply

export interface TextQuickReply {
  type: 'text'
  label: string
}

export interface ActionQuickReply {
  type: 'action'
  label: string
  icon?: string
  action: DiscoveryAction
}

export interface PreferenceQuickReply {
  type: 'preference'
  label: string
  icon?: string
  preference: {
    key: keyof DiscoveryPreferences
    value: unknown
  }
}

// ============================================================================
// State Management
// ============================================================================

export type DiscoveryView = 'chat' | 'style-gallery' | 'education' | 'booking'

export interface DiscoverLookState {
  isOpen: boolean
  mode: DiscoveryMode
  view: DiscoveryView
  messages: DiscoveryMessage[]
  isTyping: boolean

  // Discovery progress
  preferences: DiscoveryPreferences
  currentPhase: DiscoveryPhase

  // Current focus
  currentCategory?: string
  currentStyle?: string

  // For inline booking
  bookingService?: BookServiceAction['service']

  // Session
  conversationId: string | null
}

export type DiscoveryPhase =
  | 'welcome'
  | 'exploration'
  | 'style-discovery'
  | 'education'
  | 'recommendation'
  | 'booking'

export type DiscoverLookAction =
  | { type: 'OPEN'; payload?: { mode?: DiscoveryMode } }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'SET_VIEW'; payload: DiscoveryView }
  | { type: 'SET_MODE'; payload: DiscoveryMode }
  | { type: 'ADD_MESSAGE'; payload: DiscoveryMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<DiscoveryMessage> } }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<DiscoveryPreferences> }
  | { type: 'SET_PHASE'; payload: DiscoveryPhase }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_STYLE'; payload: string }
  | { type: 'START_BOOKING'; payload: BookServiceAction['service'] }
  | { type: 'CLEAR_BOOKING' }
  | { type: 'RESET_DISCOVERY' }
  | { type: 'SET_CONVERSATION_ID'; payload: string }

// ============================================================================
// API Types
// ============================================================================

export interface DiscoveryRequest {
  message: string
  conversationId?: string
  conversationHistory?: Array<{ role: DiscoveryMessageRole; content: string }>
  preferences?: DiscoveryPreferences
  mode?: DiscoveryMode
}

export interface DiscoveryResponse {
  message: string
  images?: DiscoveryAsset[]
  styleCards?: StyleCard[]
  serviceRecommendation?: ServiceRecommendation
  actions?: DiscoveryAction[]
  quickReplies?: DiscoveryQuickReply[]
  updatedPreferences?: Partial<DiscoveryPreferences>
  conversationId: string
}

// ============================================================================
// Service Content Types
// ============================================================================

export interface ServiceEducation {
  serviceSlug: string
  serviceName: string
  categorySlug: string
  categoryName: string

  // Content
  tagline: string
  philosophy: string
  idealFor: string[]
  theLook: string
  process: string
  duration: string
  maintenance: string
  longevity: string
  priceRange: string

  // Additional info
  benefits?: string[]
  preparation?: string[]
  aftercare?: string[]
  faqs?: Array<{ question: string; answer: string }>

  // Comparison (for styles within same category)
  comparisonPoints?: Record<string, string>
}

export interface CategoryEducation {
  categorySlug: string
  categoryName: string

  // Overview
  introduction: string
  philosophy: string

  // Styles/services within
  styles: ServiceEducation[]

  // Discovery questions
  discoveryQuestions: Array<{
    question: string
    options: Array<{
      label: string
      leadsTo: string // service slug or next question
      matchesStyle?: string[]
    }>
  }>
}
