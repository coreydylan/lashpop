import type { SelectCampaign, SelectCampaignAsset, SelectCampaignTemplate } from "@/db/schema/campaigns"

// ============================================================================
// Campaign Workflow Types
// ============================================================================

export type SocialPlatform = 'instagram' | 'tiktok' | 'pinterest' | 'facebook' | 'twitter' | 'youtube' | 'linkedin'

export interface PlatformSpec {
  name: SocialPlatform
  types: string[]  // e.g., ['feed-post', 'story', 'reel-cover']
}

export interface Deliverable {
  name: string
  quantity: number
  role: string
  platform?: string
  description?: string
}

export interface Constraint {
  type: 'visual' | 'copy' | 'technical' | 'budget' | 'timeline'
  description: string
  priority: 'required' | 'preferred' | 'optional'
}

// ============================================================================
// Creative Brief Types
// ============================================================================

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  rationale: string
}

export interface VisualDirection {
  colorPalette: ColorPalette
  composition: {
    style: string
    layout: string
    lighting: string
  }
  mood: {
    primary: string
    secondary: string
    avoid: string[]
  }
  productPlacement?: {
    prominence: string
    context: string
    angle: string
  }
}

export interface CopyDirection {
  tone: string
  voice: string
  keywords: string[]
  avoid: string[]
}

export interface TechnicalSpecs {
  resolution: string
  format: string
  colorSpace: string
  safeZones: string
}

export interface BrandCompliance {
  requiredElements: string[]
  prohibitedElements: string[]
  qualityThresholds: {
    brandAlignment: number
    visualQuality: number
    accessibility: string
  }
}

export interface AssetSpec {
  id: string
  type: 'photo' | 'video' | 'graphic'
  purpose: string
  role: string
  platform?: string
  variant?: string
  specs: {
    ratio?: string
    composition?: string
    mood?: string
    colorEmphasis?: string
    textPlacement?: string
    requiredElements?: string[]
  }
  prompt?: string
}

export interface CreativeBrief {
  visualDirection: VisualDirection
  copyDirection: CopyDirection
  technicalSpecs: TechnicalSpecs
  brandCompliance: BrandCompliance
  assets: AssetSpec[]
}

// ============================================================================
// Generation Agent Types
// ============================================================================

export interface GenerationAgentConfig {
  id: string
  type: string
  spec: AssetSpec
  brief: CreativeBrief
}

export interface GenerationResult {
  assetId: string
  image?: string
  video?: string
  metadata: {
    model: string
    prompt: string
    cost: number
    generationTime: number
    attempt: number
  }
}

export interface GeneratedAsset {
  assetId: string
  url: string
  role: string
  platform?: string
  status: 'generated' | 'quality_check' | 'failed' | 'approved'
  metadata: GenerationResult['metadata']
}

// ============================================================================
// Quality Control Types
// ============================================================================

export interface QualityCheck {
  name: string
  passed: boolean
  score: number
  details: Record<string, any>
}

export interface QualityCheckResult {
  assetId: string
  passed: boolean
  score: number
  checks: QualityCheck[]
  feedback: string[]
  requiresRefinement: boolean
}

export interface QualityFailure {
  assetId: string
  reason: string
  suggestions: string[]
}

// ============================================================================
// Refinement Types
// ============================================================================

export interface RefinementChange {
  type: 'color' | 'composition' | 'mood' | 'element' | 'regenerate'
  description: string
  parameter?: string
  value?: any
}

export interface RefinementIteration {
  iteration: number
  assetId: string
  changes: RefinementChange[]
  strategy: 'regenerate' | 'edit' | 'composite'
  previousAssetId?: string
  result: {
    score: number
    passed: boolean
  }
  timestamp: string
}

// ============================================================================
// Campaign Workflow Types
// ============================================================================

export interface CampaignBriefInput {
  campaignName: string
  objective: string
  platforms: SocialPlatform[]

  brandAssets: {
    logos?: string[]
    colors?: string[]
    typography?: string[]
    guidelines?: string[]
  }

  inspiration: {
    photos?: string[]
    styleReferences?: string[]
    moodBoards?: string[]
    competitors?: string[]
  }

  requirements: {
    variants?: PlatformSpec[]
    deliverables?: Deliverable[]
    constraints?: Constraint[]
    budget?: number
    targetAudience?: string
    timeline?: {
      startDate?: string
      endDate?: string
      phases?: Array<{
        name: string
        duration: string
        postCount: number
      }>
    }
  }
}

export interface CampaignGeneration {
  status: 'pending' | 'generating' | 'complete' | 'failed'
  agents: GenerationAgentConfig[]
  outputs: GeneratedAsset[]
  progress?: {
    total: number
    completed: number
    failed: number
    inProgress: number
  }
}

export interface CampaignQualityControl {
  status: 'pending' | 'checking' | 'complete'
  checks: QualityCheckResult[]
  failures: QualityFailure[]
}

export interface CampaignRefinement {
  iterations: RefinementIteration[]
  currentIteration: number
  maxIterations: number
}

export interface CampaignApproval {
  status: 'pending' | 'approved' | 'rejected'
  reviewers: string[]
  feedback: Array<{
    assetId: string
    reviewer: string
    approved: boolean
    comment?: string
    timestamp: string
  }>
}

export interface CampaignWorkflow {
  campaign: SelectCampaign
  brief: CampaignBriefInput & { detailedBrief?: CreativeBrief }
  generation: CampaignGeneration
  qualityControl: CampaignQualityControl
  refinement: CampaignRefinement
  approval: CampaignApproval
}

// ============================================================================
// AI Agent Types
// ============================================================================

export interface ConductorAgentContext {
  campaignId: string
  briefInput: CampaignBriefInput
  brandAssets: any[]
  inspirationAssets: any[]
}

export interface BrandAnalysis {
  colors: {
    primary: string[]
    secondary: string[]
    accent: string[]
  }
  typography: {
    headings: string[]
    body: string[]
  }
  logoUsage: {
    preferred: string
    variations: string[]
    placement: string
  }
  voice: {
    tone: string[]
    keywords: string[]
    avoid: string[]
  }
}

export interface InspirationAnalysis {
  visualStyle: {
    keywords: string[]
    mood: string[]
    composition: string[]
  }
  colorTrends: {
    dominant: string[]
    accents: string[]
    palette: string
  }
  patterns: {
    layout: string[]
    elements: string[]
  }
}

export interface ConductorBriefOutput {
  visualDirection: VisualDirection
  copyDirection: CopyDirection
  technicalSpecs: TechnicalSpecs
  brandCompliance: BrandCompliance
  assets: AssetSpec[]
  confidence: number
  reasoning: string
}

// ============================================================================
// Template Types
// ============================================================================

export interface TemplatePhase {
  name: string
  duration: string
  postCount: number
  description?: string
}

export interface TemplateDeliverable {
  name: string
  quantity: number
  role: string
  platform?: string
}

export interface TemplateVariables {
  brandAssets?: {
    required: boolean
    types: string[]
    description?: string
  }
  colors?: {
    required: boolean
    count: number
    description?: string
  }
  inspiration?: {
    required: boolean
    minCount: number
    description?: string
  }
  products?: {
    required: boolean
    minCount: number
    description?: string
  }
}

export interface CampaignTemplateData extends SelectCampaignTemplate {
  // Add any computed fields or relationships
}

// ============================================================================
// UI State Types
// ============================================================================

export interface CampaignCreationState {
  step: 'brief' | 'template' | 'generating' | 'review' | 'approval' | 'complete'
  currentStepIndex: number
  totalSteps: number
  canProceed: boolean
  validationErrors: string[]
}

export interface AssetReviewState {
  selectedAssets: string[]
  viewMode: 'grid' | 'comparison' | 'lineage' | 'stats'
  filterBy?: 'all' | 'approved' | 'rejected' | 'pending'
  sortBy?: 'score' | 'role' | 'platform' | 'timestamp'
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CreateCampaignResponse {
  success: boolean
  campaignId?: string
  error?: string
}

export interface GenerateCampaignResponse {
  success: boolean
  workflow?: CampaignWorkflow
  error?: string
  progress?: {
    phase: string
    percent: number
    message: string
  }
}

export interface ApproveCampaignResponse {
  success: boolean
  approvedAssets?: string[]
  rejectedAssets?: string[]
  error?: string
}
