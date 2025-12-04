// ASK LASHPOP - Type Definitions

// ============================================================================
// Chat Messages
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  actions?: ChatAction[]
  quickReplies?: SmartQuickReply[]
  isLoading?: boolean
}

// ============================================================================
// Actions - Things the AI can trigger
// ============================================================================

export type ChatAction =
  | ScrollAction
  | OpenPanelAction
  | LoadVagaroInlineAction
  | ShowFormAction
  | SendEmailAction
  | CallPhoneAction
  | OpenExternalAction
  | SubmitTeamMessageAction
  | DisplayTeamCardAction
  | DisplayServiceCardAction

// ============================================================================
// Smart Quick Replies - Can be text OR actions
// ============================================================================

export type SmartQuickReply =
  | TextQuickReply
  | ActionQuickReply

export interface TextQuickReply {
  type: 'text'
  label: string
  // When clicked, sends this as a user message
}

export interface ActionQuickReply {
  type: 'action'
  label: string
  icon?: string
  action: ChatAction
  // When clicked, executes the action directly
}

export interface ScrollAction {
  type: 'scroll_to_section'
  target: string // CSS selector like '#find-us', '#team'
  offset?: number // px from top (default: 60)
  alignment?: 'top' | 'center'
  thenCollapse?: boolean // collapse chat after action
  label: string // Button label
  icon?: string // Icon name
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

export interface LoadVagaroInlineAction {
  type: 'load_vagaro_inline'
  service: {
    id: string
    name: string
    vagaroServiceCode: string
    priceStarting: number
    durationMinutes: number
    categoryName?: string
  }
  label: string
  icon?: string
}

export interface ShowFormAction {
  type: 'show_form'
  formType: 'contact' | 'callback' | 'bridal' | 'complaint'
  fields: FormField[]
  label: string
  icon?: string
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'date'
  required: boolean
  placeholder?: string
}

export interface SendEmailAction {
  type: 'send_email'
  template: 'inquiry' | 'bridal' | 'complaint' | 'general'
  label: string
  icon?: string
}

export interface CallPhoneAction {
  type: 'call_phone'
  number: string
  label: string
  icon?: string
}

export interface OpenExternalAction {
  type: 'open_external'
  url: string
  label: string
  icon?: string
}

export interface SubmitTeamMessageAction {
  type: 'submit_team_message'
  data: {
    name: string
    email?: string
    phone?: string
    message: string
    inquiryType: string
  }
  label: string
  icon?: string
}

export interface DisplayTeamCardAction {
  type: 'display_team_card'
  memberId: number
  memberName: string
  label: string
  icon?: string
}

export interface DisplayServiceCardAction {
  type: 'display_service_card'
  serviceSlug: string
  serviceName: string
  label: string
  icon?: string
}

// ============================================================================
// Chat State
// ============================================================================

export type ChatView = 'chat' | 'vagaro-widget' | 'contact-form'

export interface AskLashpopState {
  isOpen: boolean
  view: ChatView
  messages: ChatMessage[]
  isTyping: boolean
  // For inline Vagaro widget
  inlineService: LoadVagaroInlineAction['service'] | null
  // For contact form
  activeForm: ShowFormAction | null
  formData: Record<string, string>
  // Conversation context
  conversationId: string | null
}

export type AskLashpopAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'SET_VIEW'; payload: ChatView }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'LOAD_VAGARO_INLINE'; payload: LoadVagaroInlineAction['service'] }
  | { type: 'CLEAR_INLINE_SERVICE' }
  | { type: 'SHOW_FORM'; payload: ShowFormAction }
  | { type: 'UPDATE_FORM_DATA'; payload: { field: string; value: string } }
  | { type: 'CLEAR_FORM' }
  | { type: 'RESET_CONVERSATION' }
  | { type: 'SET_CONVERSATION_ID'; payload: string }

// ============================================================================
// API Types
// ============================================================================

export interface ChatRequest {
  message: string
  conversationId?: string
  conversationHistory?: Array<{ role: MessageRole; content: string }>
}

export interface ChatResponse {
  message: string
  actions?: ChatAction[]
  quickReplies?: SmartQuickReply[]
  conversationId: string
}

export interface EmailRequest {
  template: string
  contactInfo: {
    email: string
    phone?: string
    name?: string
  }
  additionalData?: Record<string, string>
  conversationSummary?: string
}

// ============================================================================
// GPT Function Calling Types
// ============================================================================

export interface GPTFunction {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface GPTFunctionCall {
  name: string
  arguments: string // JSON string
}

// ============================================================================
// Service & FAQ Types (for AI context)
// ============================================================================

export interface ServiceForAI {
  id: string
  name: string
  slug: string
  description: string
  durationMinutes: number
  priceStarting: number // cents
  categoryId: string
  categoryName: string
  subcategoryName?: string
  vagaroServiceCode?: string
}

export interface FAQForAI {
  question: string
  answer: string
  category: string
}

export interface AIContext {
  services: ServiceForAI[]
  faqs: FAQForAI[]
  businessInfo: {
    name: string
    address: string
    phone: string
    email: string
    hours: string
  }
}
