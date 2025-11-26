/**
 * Panel Stack System Types
 *
 * A hierarchical panel system where panels live at the top of the page
 * with three states: closed, docked (header only), expanded (full content)
 */

// ============================================================================
// Panel Types
// ============================================================================

export type PanelType =
  // Level 1: Discovery
  | 'category-picker'
  | 'discovery'

  // Level 2: Browsing (one per category)
  | 'service-panel'

  // Level 3: Details
  | 'service-detail'

  // Level 4: Action
  | 'schedule'
  | 'vagaro-widget';

export type PanelLevel = 1 | 2 | 3 | 4;

export type PanelState = 'closed' | 'docked' | 'expanded';

export type PanelBadge = 'new' | 'updated' | number;

// ============================================================================
// Panel State
// ============================================================================

export interface Panel {
  id: string;
  type: PanelType;
  level: PanelLevel;
  state: PanelState;
  parentId?: string;
  position: number; // Sort order within level
  data: any;

  // Summary for docked header
  summary?: string;
  badge?: PanelBadge;

  // Timestamps
  createdAt: number;
  lastInteractedAt: number;

  // Mobile
  swipeEnabled?: boolean;
}

export interface PanelStackState {
  panels: Panel[];

  // Currently expanded panel per level
  expandedByLevel: {
    1?: string;
    2?: string;
    3?: string;
    4?: string;
  };

  // Category selections (for multi-category browsing)
  categorySelections: {
    categoryId: string;
    categoryName: string;
  }[];

  // Viewport management
  totalPanelHeight: number;
  pageTopPadding: number;

  // Mobile
  visiblePanelIds: string[];
  maxVisiblePanels: number; // 4 on mobile, 8 on desktop

  // Interaction state
  isUserInteracting: boolean;

  // Service data (from database)
  services: any[];
}

// ============================================================================
// Panel Data Types
// ============================================================================

export interface CategoryPickerPanelData {
  entryPoint: 'hero' | 'page' | 'drawer';
  preselectedCategories?: string[];
  preselectedProvider?: string;
}

export interface ServicePanelData {
  categoryId: string;
  categoryName: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
  }[];
  services: any[];
}

export interface ServiceDetailPanelData {
  service: any;
  preselectedProvider?: string;
  fromPage?: boolean;
}

export interface SchedulePanelData {
  service: any;
  providerIds: string[];
}

export interface VagaroWidgetPanelData {
  service: {
    id: string;
    name: string;
    slug: string;
    subtitle?: string;
    durationMinutes: number;
    priceStarting: number;
    vagaroWidgetUrl: string;
    categoryName?: string;
    subcategoryName?: string;
  };
}

// ============================================================================
// Actions
// ============================================================================

export interface OpenPanelOptions {
  parentId?: string;
  insertAtPosition?: number;
  autoExpand?: boolean; // Default true
  scrollToTop?: boolean; // Default false (changed from true)
}

export interface PanelStackActions {
  // Core panel operations
  openPanel: (type: PanelType, data: any, options?: OpenPanelOptions) => string;
  closePanel: (panelId: string) => void;
  dockPanel: (panelId: string) => void;
  expandPanel: (panelId: string) => void;
  togglePanel: (panelId: string) => void;

  // Bulk operations
  closeAll: () => void;
  dockAll: () => void;
  closePanelsFromLevel: (level: PanelLevel) => void;

  // Category management
  selectCategory: (categoryId: string, categoryName: string) => void;
  deselectCategory: (categoryId: string) => void;

  // Navigation
  expandNextServicePanel: () => void;
  expandPreviousServicePanel: () => void;

  // Utilities
  getPanelById: (id: string) => Panel | undefined;
  getPanelsByLevel: (level: PanelLevel) => Panel[];
  getChildPanels: (parentId: string) => Panel[];
  updatePanelData: (panelId: string, data: any) => void;
  updatePanelSummary: (panelId: string, summary: string) => void;
}

// ============================================================================
// Context Value
// ============================================================================

export interface PanelStackContextValue {
  state: PanelStackState;
  actions: PanelStackActions;
}

// ============================================================================
// Constants
// ============================================================================

export const PANEL_DOCKED_HEIGHT_DESKTOP = 48;
export const PANEL_DOCKED_HEIGHT_MOBILE = 32;
export const PANEL_MAX_HEIGHT_DESKTOP = '60vh';
export const PANEL_MAX_HEIGHT_MOBILE = '80vh';
export const HEADER_HEIGHT = 80; // Match Header.tsx height

// Bottom sheet snap points (percentage from bottom, 0 = bottom of screen)
export const BOTTOM_SHEET_SNAP_POINTS = {
  closed: 100,  // Off screen
  peek: 88,     // Just handle + header visible
  half: 45,     // Half screen
  full: 8,      // Nearly full screen
} as const;

export type BottomSheetSnapPoint = keyof typeof BOTTOM_SHEET_SNAP_POINTS;

// Render mode for responsive behavior
export type PanelRenderMode = 'top' | 'bottom';

// ============================================================================
// Events
// ============================================================================

export type PanelStackEvent =
  | { type: 'PANEL_OPENED'; payload: { panelId: string; panelType: PanelType } }
  | { type: 'PANEL_CLOSED'; payload: { panelId: string; panelType: PanelType } }
  | { type: 'PANEL_EXPANDED'; payload: { panelId: string } }
  | { type: 'PANEL_DOCKED'; payload: { panelId: string } }
  | { type: 'CATEGORY_SELECTED'; payload: { categoryId: string; categoryName: string } }
  | { type: 'SERVICE_SELECTED'; payload: { serviceId: string; fromPanel: string } };
