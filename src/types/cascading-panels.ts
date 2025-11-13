/**
 * Cascading Panel System Types
 *
 * A hierarchical, context-aware panel system where panels stack vertically
 * and maintain parent-child relationships for contextual interactions.
 */

// ============================================================================
// Panel Types
// ============================================================================

export type PanelType =
  // Level 1: Entry points
  | 'book-now'
  | 'browse-services'
  | 'browse-team'

  // Level 2: Category selection
  | 'category-picker'

  // Level 3: Subcategory + services
  | 'subcategory-services'

  // Level 4: Detail panels
  | 'service-detail'
  | 'provider-detail'
  | 'provider-services'
  | 'schedule';

export type PanelLevel = 1 | 2 | 3 | 4;

// ============================================================================
// Panel State
// ============================================================================

export interface PanelStackItem {
  id: string;
  type: PanelType;
  level: PanelLevel;
  parentId?: string;
  position: number; // Order within same level
  data: any;
  isCollapsed: boolean;
  isClosing: boolean;
  createdAt: number;
}

export interface CategorySelection {
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
}

export interface CascadingPanelState {
  panels: PanelStackItem[];
  activeLevel: number;
  scrollPosition: number;
  categorySelections: CategorySelection[];
  selectedServiceId?: string;
  selectedProviderId?: string;
  services: any[]; // Service data from database
}

// ============================================================================
// Panel Data Types
// ============================================================================

export interface BookNowPanelData {
  entryPoint: 'hero' | 'navigation' | 'section';
}

export interface CategoryPickerPanelData {
  preselectedCategories?: string[];
}

export interface SubcategoryServicePanelData {
  categoryId: string;
  categoryName: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
  }[];
  services: any[]; // Will be filtered based on category
}

export interface ServiceDetailPanelData {
  service: any;
  fromCategory?: string;
  fromSubcategory?: string;
}

export interface ProviderDetailPanelData {
  providerId: string;
  provider: any;
  context?: 'service-selection' | 'team-browse';
}

export interface ProviderServicesPanelData {
  providerId: string;
  providerName: string;
  services: any[];
}

// ============================================================================
// Actions
// ============================================================================

export interface OpenPanelOptions {
  parentId?: string;
  replaceExisting?: boolean;
  closeChildren?: boolean;
  scrollIntoView?: boolean;
}

export interface CascadingPanelActions {
  // Core panel operations
  openPanel: (type: PanelType, data: any, options?: OpenPanelOptions) => string;
  closePanel: (panelId: string, closeChildren?: boolean) => void;
  collapsePanel: (panelId: string) => void;
  expandPanel: (panelId: string) => void;

  // Category management
  toggleCategory: (categoryId: string, categoryName: string) => void;
  selectSubcategory: (categoryId: string, subcategoryId: string, subcategoryName: string) => void;
  clearCategories: () => void;

  // Service/provider selection
  selectService: (serviceId: string) => void;
  selectProvider: (providerId: string) => void;

  // Navigation
  scrollToPanel: (panelId: string) => void;
  closeAllPanels: () => void;
  closePanelsFromLevel: (level: number) => void;

  // Utility
  getPanelsByLevel: (level: number) => PanelStackItem[];
  getPanelById: (id: string) => PanelStackItem | undefined;
  getChildPanels: (parentId: string) => PanelStackItem[];
}

// ============================================================================
// Context Value
// ============================================================================

export interface CascadingPanelContextValue {
  state: CascadingPanelState;
  actions: CascadingPanelActions;
}

// ============================================================================
// Animation
// ============================================================================

export interface PanelAnimationConfig {
  duration: number;
  ease: number[];
  staggerDelay: number;
}

export const defaultAnimationConfig: PanelAnimationConfig = {
  duration: 400,
  ease: [0.22, 1, 0.36, 1],
  staggerDelay: 50,
};

// ============================================================================
// Events
// ============================================================================

export type CascadingPanelEvent =
  | { type: 'PANEL_OPENED'; payload: { panelId: string; panelType: PanelType } }
  | { type: 'PANEL_CLOSED'; payload: { panelId: string; panelType: PanelType } }
  | { type: 'PANEL_COLLAPSED'; payload: { panelId: string } }
  | { type: 'PANEL_EXPANDED'; payload: { panelId: string } }
  | { type: 'CATEGORY_SELECTED'; payload: CategorySelection }
  | { type: 'SERVICE_CLICKED'; payload: { serviceId: string; fromPanel: string } }
  | { type: 'PROVIDER_CLICKED'; payload: { providerId: string; fromPanel: string } };
