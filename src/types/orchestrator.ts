/**
 * BookingOrchestrator Type Definitions
 *
 * Central type system for the unified booking orchestration layer that coordinates
 * communication between drawers, panels, and page surfaces.
 */

// ============================================================================
// Core Data Types
// ============================================================================

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  duration: number;
  icon?: string;
}

export interface Provider {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio?: string;
  specialties: string[];
  availability?: 'available' | 'limited' | 'unavailable';
  quote?: string;
  funFacts?: string[];
  type: 'employee' | 'independent';
  instagram?: string;
  phone?: string;
}

export interface QuizResults {
  serviceCategory: string[];
  experience: string;
  style: string;
  timestamp: number;
}

// ============================================================================
// Journey Tracking
// ============================================================================

export type EntryPoint = 'hero' | 'services-section' | 'team-section' | 'discover-quiz';
export type JourneyStep = 'browsing' | 'service-selected' | 'provider-selected' | 'scheduling' | 'viewing-portfolio';

export interface UserJourney {
  entryPoint: EntryPoint;
  currentStep: JourneyStep;
  timestamp: number;
  breadcrumbs: string[];
}

// ============================================================================
// Page Section Registry
// ============================================================================

export interface PageSection {
  id: string;
  element: HTMLElement | null;
  bounds: {
    top: number;
    bottom: number;
    height: number;
  };
  isVisible: boolean;
}

// ============================================================================
// Viewport Management
// ============================================================================

export interface ViewportDimensions {
  availableHeight: number; // Height available below drawers
  topOffset: number;       // Distance from top (header + docked drawers)
  bottomOffset: number;    // Distance from bottom
  windowHeight: number;    // Full window height
}

// ============================================================================
// Highlights & Visual State
// ============================================================================

export interface Highlights {
  services: string[];
  providers: string[];
  categories: string[];
}

// ============================================================================
// Event System
// ============================================================================

export type OrchestratorEvent =
  | { type: 'SERVICE_SELECTED'; payload: { service: Service; source: 'drawer' | 'page' } }
  | { type: 'PROVIDER_SELECTED'; payload: { provider: Provider; source: 'panel' | 'team-section' | 'portfolio' } }
  | { type: 'TEAM_MEMBER_CLICKED'; payload: { memberId: string; action: 'view-portfolio' | 'book-service' } }
  | { type: 'CATEGORY_FILTERED'; payload: { categories: string[] } }
  | { type: 'QUIZ_COMPLETED'; payload: QuizResults }
  | { type: 'PORTFOLIO_OPENED'; payload: { providerId: string } }
  | { type: 'PORTFOLIO_CLOSED'; payload: { providerId: string } }
  | { type: 'PORTFOLIO_COMPRESSED'; payload: { providerId: string } }
  | { type: 'PORTFOLIO_EXPANDED'; payload: { providerId: string } }
  | { type: 'BOOKING_INITIATED'; payload: { service?: Service; provider: Provider } }
  | { type: 'BOOKING_PANEL_OPENED'; payload: { providerId: string } }
  | { type: 'BOOKING_PANEL_CLOSED'; payload: {} }
  | { type: 'SECTION_VISIBLE'; payload: { sectionId: string } }
  | { type: 'SECTION_REGISTERED'; payload: { sectionId: string } }
  | { type: 'SCROLL_REQUEST'; payload: { targetId: string; offset?: number; smooth?: boolean } }
  | { type: 'DRAWER_STATE_CHANGED'; payload: { drawer: 'discover' | 'services'; state: 'invisible' | 'docked' | 'expanded' } }
  | { type: 'VIEWPORT_RESIZED'; payload: ViewportDimensions };

export type EventHandler = (event: OrchestratorEvent) => void;
export type Unsubscribe = () => void;

export interface EventBus {
  emit: (event: OrchestratorEvent) => void;
  subscribe: (type: OrchestratorEvent['type'] | '*', handler: EventHandler) => Unsubscribe;
}

// ============================================================================
// Portfolio State
// ============================================================================

export type PortfolioState = 'closed' | 'expanded' | 'compressed';

export interface PortfolioContext {
  state: PortfolioState;
  providerId: string | null;
  withBookingPanel: boolean;
}

// ============================================================================
// Main Orchestrator State
// ============================================================================

export interface BookingOrchestratorState {
  // User Selections (Single Source of Truth)
  selectedServices: Service[];
  selectedProviders: Provider[];
  selectedCategories: string[];
  quizResults: QuizResults | null;

  // User Journey
  journey: UserJourney;

  // Page Context
  sections: PageSection[];

  // UI State
  portfolio: PortfolioContext;
  scrollTarget: string | null;
  highlights: Highlights;

  // Viewport (Drawer-Aware)
  viewport: ViewportDimensions;
}

// ============================================================================
// Action Options
// ============================================================================

export interface SelectProviderOptions {
  scrollToTeam?: boolean;
  openPortfolio?: boolean;
  openBookingPanel?: boolean;
  source?: 'panel' | 'team-section' | 'portfolio';
}

export interface SelectServiceOptions {
  openPanel?: boolean;
  source?: 'drawer' | 'page';
}

export interface ScrollToSectionOptions {
  offset?: number;
  smooth?: boolean;
  highlight?: string[];
}

export interface OpenPortfolioOptions {
  withBookingPanel?: boolean;
  scrollToView?: boolean;
}

// ============================================================================
// Orchestrator Actions Interface
// ============================================================================

export interface OrchestratorActions {
  // Selection Actions
  selectService: (service: Service, options?: SelectServiceOptions) => void;
  selectProvider: (provider: Provider, options?: SelectProviderOptions) => void;
  toggleProvider: (provider: Provider) => void;
  selectCategory: (category: string) => void;
  clearSelections: () => void;

  // Navigation Actions
  scrollToSection: (sectionId: string, options?: ScrollToSectionOptions) => void;
  openPortfolio: (providerId: string, options?: OpenPortfolioOptions) => void;
  closePortfolio: () => void;
  compressPortfolio: () => void;
  expandPortfolio: () => void;

  // Contextual Workflows (Orchestrated Multi-Step Actions)
  initiateBookingFromTeamMember: (memberId: string) => Promise<void>;
  initiatePortfolioFromService: (serviceId: string, providerId: string) => Promise<void>;
  completeQuizWorkflow: (results: QuizResults) => Promise<void>;

  // Section Registry
  registerSection: (id: string, element: HTMLElement) => Unsubscribe;
  updateSectionBounds: (id: string, bounds: DOMRect) => void;

  // Viewport Management
  updateViewportDimensions: () => void;
  getAvailableHeight: () => number;
}

// ============================================================================
// Context Value (State + Actions + Event Bus)
// ============================================================================

export interface BookingOrchestratorContextValue {
  // State
  state: BookingOrchestratorState;

  // Actions
  actions: OrchestratorActions;

  // Event Bus
  eventBus: EventBus;
}

// ============================================================================
// Utility Types
// ============================================================================

export type EventType = OrchestratorEvent['type'];

export type EventPayload<T extends EventType> = Extract<OrchestratorEvent, { type: T }>['payload'];
