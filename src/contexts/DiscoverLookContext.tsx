'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect } from 'react'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { smoothScrollToElement } from '@/lib/smoothScroll'
import type {
  DiscoverLookState,
  DiscoverLookAction,
  DiscoveryMessage,
  DiscoveryAction,
  DiscoveryView,
  DiscoveryMode,
  DiscoveryPreferences,
  DiscoveryPhase,
  DiscoveryQuickReply,
  BookServiceAction,
} from '@/lib/discover-look/types'

// ============================================================================
// Initial State
// ============================================================================

const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const getInitialState = (): DiscoverLookState => ({
  isOpen: false,
  mode: 'standalone',
  view: 'chat',
  messages: [],
  isTyping: false,
  preferences: {},
  currentPhase: 'welcome',
  currentCategory: undefined,
  currentStyle: undefined,
  bookingService: undefined,
  conversationId: null,
})

// ============================================================================
// Reducer
// ============================================================================

function discoverLookReducer(state: DiscoverLookState, action: DiscoverLookAction): DiscoverLookState {
  switch (action.type) {
    case 'OPEN': {
      // Add welcome message if no messages yet
      if (state.messages.length === 0) {
        const welcomeQuickReplies: DiscoveryQuickReply[] = [
          { type: 'text', label: 'Help me explore' },
          { type: 'text', label: 'I know what I want' },
          { type: 'text', label: 'Just browsing' },
        ]
        const welcomeMessage: DiscoveryMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            "Hey! ✨ I'm so excited to help you discover your perfect look. Are you curious about a specific service, or would you like me to help you explore what might work best for you?",
          timestamp: Date.now(),
          quickReplies: welcomeQuickReplies,
        }
        return {
          ...state,
          isOpen: true,
          mode: action.payload?.mode || 'standalone',
          messages: [welcomeMessage],
          currentPhase: 'welcome',
        }
      }
      return { ...state, isOpen: true, mode: action.payload?.mode || state.mode }
    }

    case 'CLOSE':
      return { ...state, isOpen: false }

    case 'TOGGLE': {
      if (!state.isOpen && state.messages.length === 0) {
        const welcomeQuickReplies: DiscoveryQuickReply[] = [
          { type: 'text', label: 'Help me explore' },
          { type: 'text', label: 'I know what I want' },
          { type: 'text', label: 'Just browsing' },
        ]
        const welcomeMessage: DiscoveryMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            "Hey! ✨ I'm so excited to help you discover your perfect look. Are you curious about a specific service, or would you like me to help you explore what might work best for you?",
          timestamp: Date.now(),
          quickReplies: welcomeQuickReplies,
        }
        return {
          ...state,
          isOpen: true,
          messages: [welcomeMessage],
          currentPhase: 'welcome',
        }
      }
      return { ...state, isOpen: !state.isOpen }
    }

    case 'SET_VIEW':
      return { ...state, view: action.payload }

    case 'SET_MODE':
      return { ...state, mode: action.payload }

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
        ),
      }

    case 'SET_TYPING':
      return { ...state, isTyping: action.payload }

    case 'UPDATE_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } }

    case 'SET_PHASE':
      return { ...state, currentPhase: action.payload }

    case 'SET_CATEGORY':
      return { ...state, currentCategory: action.payload }

    case 'SET_STYLE':
      return { ...state, currentStyle: action.payload }

    case 'START_BOOKING':
      return { ...state, view: 'booking', bookingService: action.payload }

    case 'CLEAR_BOOKING':
      return { ...state, view: 'chat', bookingService: undefined }

    case 'RESET_DISCOVERY':
      return getInitialState()

    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.payload }

    default:
      return state
  }
}

// ============================================================================
// Context Types
// ============================================================================

interface DiscoverLookContextValue {
  state: DiscoverLookState
  // Basic controls
  open: (mode?: DiscoveryMode) => void
  close: () => void
  toggle: () => void
  // Messaging
  sendMessage: (content: string) => Promise<void>
  // Action execution
  executeAction: (action: DiscoveryAction) => void
  // View controls
  setView: (view: DiscoveryView) => void
  goBackToChat: () => void
  // Preference updates
  updatePreferences: (preferences: Partial<DiscoveryPreferences>) => void
  // Phase management
  setPhase: (phase: DiscoveryPhase) => void
  // Reset
  reset: () => void
}

const DiscoverLookContext = createContext<DiscoverLookContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface DiscoverLookProviderProps {
  children: React.ReactNode
}

export function DiscoverLookProvider({ children }: DiscoverLookProviderProps) {
  const [state, dispatch] = useReducer(discoverLookReducer, getInitialState())
  const panelStack = usePanelStack()
  const stateRef = useRef(state)
  stateRef.current = state

  // ============================================================================
  // Event Listener for cross-context communication
  // ============================================================================

  useEffect(() => {
    const handleOpenDiscoverLook = (event: CustomEvent<{ mode?: DiscoveryMode; context?: string }>) => {
      const { mode, context } = event.detail || {}
      dispatch({ type: 'OPEN', payload: { mode: mode || 'inline' } })

      // If context is provided, we could send an initial message or set preferences
      if (context) {
        // Store context for the AI to use in its first response
        dispatch({ type: 'UPDATE_PREFERENCES', payload: { initialContext: context } })
      }
    }

    window.addEventListener('openDiscoverLook', handleOpenDiscoverLook as EventListener)
    return () => {
      window.removeEventListener('openDiscoverLook', handleOpenDiscoverLook as EventListener)
    }
  }, [])

  // ============================================================================
  // Basic Controls
  // ============================================================================

  const open = useCallback((mode?: DiscoveryMode) => {
    dispatch({ type: 'OPEN', payload: { mode } })
  }, [])

  const close = useCallback(() => dispatch({ type: 'CLOSE' }), [])
  const toggle = useCallback(() => dispatch({ type: 'TOGGLE' }), [])

  // ============================================================================
  // View Controls
  // ============================================================================

  const setView = useCallback((view: DiscoveryView) => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }, [])

  const goBackToChat = useCallback(() => {
    dispatch({ type: 'CLEAR_BOOKING' })
  }, [])

  // ============================================================================
  // Preference & Phase Management
  // ============================================================================

  const updatePreferences = useCallback((preferences: Partial<DiscoveryPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences })
  }, [])

  const setPhase = useCallback((phase: DiscoveryPhase) => {
    dispatch({ type: 'SET_PHASE', payload: phase })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET_DISCOVERY' })
  }, [])

  // ============================================================================
  // Action Execution
  // ============================================================================

  const executeAction = useCallback(
    async (action: DiscoveryAction) => {
      switch (action.type) {
        case 'scroll_to_section': {
          const sectionMap: Record<string, string> = {
            team: '#team',
            gallery: '#gallery',
            reviews: '#reviews',
            faq: '#faq',
            'find-us': '#find-us',
            map: '#find-us',
          }
          const target = sectionMap[action.target] || action.target
          smoothScrollToElement(target, action.offset || 60, 800, action.alignment || 'top')
          if (action.thenCollapse) {
            setTimeout(() => dispatch({ type: 'CLOSE' }), 300)
          }
          break
        }

        case 'open_panel': {
          if (action.panelType === 'category-picker') {
            panelStack.actions.openPanel('category-picker', { entryPoint: 'discovery' })
          } else if (action.panelType === 'service-panel' && action.data.categoryId) {
            try {
              const response = await fetch(`/api/ask-lashpop/services?categorySlug=${action.data.categoryId}`)
              if (response.ok) {
                const panelData = await response.json()
                panelStack.actions.openPanel('service-panel', panelData)
              }
            } catch (error) {
              console.error('Error fetching services:', error)
              panelStack.actions.openPanel('category-picker', { entryPoint: 'discovery' })
            }
          }
          if (action.thenCollapse) {
            setTimeout(() => dispatch({ type: 'CLOSE' }), 300)
          }
          break
        }

        case 'book_service': {
          dispatch({ type: 'START_BOOKING', payload: action.service })
          break
        }

        case 'show_styles': {
          // Update current category and style for asset queries
          dispatch({ type: 'SET_CATEGORY', payload: action.category })
          break
        }

        case 'show_education': {
          dispatch({ type: 'SET_VIEW', payload: 'education' })
          break
        }

        case 'invoke_ask_lashpop': {
          // Close discovery and open Ask Lashpop with context
          dispatch({ type: 'CLOSE' })
          // The Ask Lashpop context will handle this
          window.dispatchEvent(
            new CustomEvent('openAskLashpop', { detail: { context: action.context } })
          )
          break
        }

        default:
          console.warn('Unknown discovery action:', action)
      }
    },
    [panelStack.actions]
  )

  // ============================================================================
  // Send Message to AI
  // ============================================================================

  const sendMessage = useCallback(async (content: string) => {
    const currentState = stateRef.current

    // Add user message
    const userMessage: DiscoveryMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage })

    // Show typing indicator
    dispatch({ type: 'SET_TYPING', payload: true })

    try {
      // Build conversation history
      const conversationHistory = currentState.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Call API
      const response = await fetch('/api/discover-look/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: currentState.conversationId,
          conversationHistory,
          preferences: currentState.preferences,
          mode: currentState.mode,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Update conversation ID if new
      if (data.conversationId && !currentState.conversationId) {
        dispatch({ type: 'SET_CONVERSATION_ID', payload: data.conversationId })
      }

      // Update preferences if returned
      if (data.updatedPreferences) {
        dispatch({ type: 'UPDATE_PREFERENCES', payload: data.updatedPreferences })
      }

      // Add assistant message
      const assistantMessage: DiscoveryMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
        images: data.images,
        styleCards: data.styleCards,
        serviceRecommendation: data.serviceRecommendation,
        actions: data.actions,
        quickReplies: data.quickReplies,
      }
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage })
    } catch (error) {
      console.error('Discovery chat error:', error)
      // Add error message
      const errorMessage: DiscoveryMessage = {
        id: generateId(),
        role: 'assistant',
        content:
          "I'm having trouble connecting right now. You can always explore our services directly or chat with our team!",
        timestamp: Date.now(),
        actions: [
          {
            type: 'open_panel',
            panelType: 'category-picker',
            data: {},
            label: 'Browse Services',
            icon: 'eye',
          },
        ],
      }
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false })
    }
  }, [])

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo<DiscoverLookContextValue>(
    () => ({
      state,
      open,
      close,
      toggle,
      sendMessage,
      executeAction,
      setView,
      goBackToChat,
      updatePreferences,
      setPhase,
      reset,
    }),
    [state, open, close, toggle, sendMessage, executeAction, setView, goBackToChat, updatePreferences, setPhase, reset]
  )

  return <DiscoverLookContext.Provider value={value}>{children}</DiscoverLookContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useDiscoverLook() {
  const context = useContext(DiscoverLookContext)
  if (!context) {
    throw new Error('useDiscoverLook must be used within DiscoverLookProvider')
  }
  return context
}
