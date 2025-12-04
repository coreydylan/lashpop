'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef } from 'react'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { smoothScrollToElement } from '@/lib/smoothScroll'
import type {
  AskLashpopState,
  AskLashpopAction,
  ChatMessage,
  ChatAction,
  ChatView,
  LoadVagaroInlineAction,
  ShowFormAction,
  ScrollAction,
  OpenPanelAction,
  SubmitTeamMessageAction,
  SmartQuickReply,
} from '@/lib/ask-lashpop/types'

// ============================================================================
// Initial State
// ============================================================================

const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const getInitialState = (): AskLashpopState => ({
  isOpen: false,
  view: 'chat',
  messages: [],
  isTyping: false,
  inlineService: null,
  activeForm: null,
  formData: {},
  conversationId: null,
})

// ============================================================================
// Reducer
// ============================================================================

function askLashpopReducer(state: AskLashpopState, action: AskLashpopAction): AskLashpopState {
  switch (action.type) {
    case 'OPEN':
      // Add welcome message if no messages yet
      if (state.messages.length === 0) {
        const welcomeQuickReplies: SmartQuickReply[] = [
          { type: 'text', label: 'I have a question' },
          { type: 'text', label: 'Help me book' },
          { type: 'text', label: 'Talk to the team' },
        ]
        const welcomeMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: "Hey! ✨ Got a question? I'll do my best to help - or if you need our team, just let me know what you'd like to tell them and I'll pass it along. What's up?",
          timestamp: Date.now(),
          quickReplies: welcomeQuickReplies,
        }
        return { ...state, isOpen: true, messages: [welcomeMessage] }
      }
      return { ...state, isOpen: true }

    case 'CLOSE':
      return { ...state, isOpen: false }

    case 'TOGGLE':
      if (!state.isOpen && state.messages.length === 0) {
        const welcomeQuickReplies: SmartQuickReply[] = [
          { type: 'text', label: 'I have a question' },
          { type: 'text', label: 'Help me book' },
          { type: 'text', label: 'Talk to the team' },
        ]
        const welcomeMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: "Hey! ✨ Got a question? I'll do my best to help - or if you need our team, just let me know what you'd like to tell them and I'll pass it along. What's up?",
          timestamp: Date.now(),
          quickReplies: welcomeQuickReplies,
        }
        return { ...state, isOpen: true, messages: [welcomeMessage] }
      }
      return { ...state, isOpen: !state.isOpen }

    case 'SET_VIEW':
      return { ...state, view: action.payload }

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

    case 'LOAD_VAGARO_INLINE':
      return { ...state, view: 'vagaro-widget', inlineService: action.payload }

    case 'CLEAR_INLINE_SERVICE':
      return { ...state, view: 'chat', inlineService: null }

    case 'SHOW_FORM':
      return { ...state, view: 'contact-form', activeForm: action.payload, formData: {} }

    case 'UPDATE_FORM_DATA':
      return { ...state, formData: { ...state.formData, [action.payload.field]: action.payload.value } }

    case 'CLEAR_FORM':
      return { ...state, view: 'chat', activeForm: null, formData: {} }

    case 'RESET_CONVERSATION':
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

interface AskLashpopContextValue {
  state: AskLashpopState
  // Basic controls
  open: () => void
  close: () => void
  toggle: () => void
  // Messaging
  sendMessage: (content: string) => Promise<void>
  // Action execution
  executeAction: (action: ChatAction) => void
  // View controls
  setView: (view: ChatView) => void
  goBackToChat: () => void
  // Form handling
  updateFormField: (field: string, value: string) => void
  submitForm: () => Promise<void>
}

const AskLashpopContext = createContext<AskLashpopContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface AskLashpopProviderProps {
  children: React.ReactNode
}

export function AskLashpopProvider({ children }: AskLashpopProviderProps) {
  const [state, dispatch] = useReducer(askLashpopReducer, getInitialState())
  const panelStack = usePanelStack()
  const stateRef = useRef(state)
  stateRef.current = state

  // ============================================================================
  // Basic Controls
  // ============================================================================

  const open = useCallback(() => dispatch({ type: 'OPEN' }), [])
  const close = useCallback(() => dispatch({ type: 'CLOSE' }), [])
  const toggle = useCallback(() => dispatch({ type: 'TOGGLE' }), [])

  // ============================================================================
  // View Controls
  // ============================================================================

  const setView = useCallback((view: ChatView) => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }, [])

  const goBackToChat = useCallback(() => {
    dispatch({ type: 'CLEAR_INLINE_SERVICE' })
    dispatch({ type: 'CLEAR_FORM' })
  }, [])

  // ============================================================================
  // Action Execution
  // ============================================================================

  const executeAction = useCallback(async (action: ChatAction) => {
    switch (action.type) {
      case 'scroll_to_section': {
        const scrollAction = action as ScrollAction
        const sectionMap: Record<string, string> = {
          team: '#team',
          gallery: '#gallery',
          reviews: '#reviews',
          faq: '#faq',
          'find-us': '#find-us',
          map: '#find-us',
          top: '#hero',
        }
        const target = sectionMap[scrollAction.target] || scrollAction.target
        smoothScrollToElement(target, scrollAction.offset || 60, 800, scrollAction.alignment || 'top')
        if (scrollAction.thenCollapse) {
          setTimeout(() => dispatch({ type: 'CLOSE' }), 300)
        }
        break
      }

      case 'open_panel': {
        const panelAction = action as OpenPanelAction
        if (panelAction.panelType === 'category-picker') {
          panelStack.actions.openPanel('category-picker', { entryPoint: 'chat' })
        } else if (panelAction.panelType === 'service-panel' && panelAction.data.categoryId) {
          try {
            // Fetch full services data before opening panel
            const response = await fetch(`/api/ask-lashpop/services?categorySlug=${panelAction.data.categoryId}`)
            if (response.ok) {
              const panelData = await response.json()
              panelStack.actions.openPanel('service-panel', panelData)
            } else {
              // Fallback to category picker if services fetch fails
              console.warn('Failed to fetch services, opening category picker')
              panelStack.actions.openPanel('category-picker', { entryPoint: 'chat' })
            }
          } catch (error) {
            console.error('Error fetching services:', error)
            panelStack.actions.openPanel('category-picker', { entryPoint: 'chat' })
          }
        }
        if (panelAction.thenCollapse) {
          setTimeout(() => dispatch({ type: 'CLOSE' }), 300)
        }
        break
      }

      case 'load_vagaro_inline': {
        const vagaroAction = action as LoadVagaroInlineAction
        dispatch({ type: 'LOAD_VAGARO_INLINE', payload: vagaroAction.service })
        break
      }

      case 'show_form': {
        const formAction = action as ShowFormAction
        dispatch({ type: 'SHOW_FORM', payload: formAction })
        break
      }

      case 'call_phone': {
        window.location.href = `tel:${action.number}`
        break
      }

      case 'open_external': {
        window.open(action.url, '_blank')
        break
      }

      case 'submit_team_message': {
        const msgAction = action as SubmitTeamMessageAction
        try {
          // Get conversation summary
          const currentState = stateRef.current
          const conversationSummary = currentState.messages
            .map((msg) => `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}`)
            .join('\n\n')

          // Send the message to the team
          const response = await fetch('/api/ask-lashpop/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              template: msgAction.data.inquiryType,
              contactInfo: {
                email: msgAction.data.email,
                phone: msgAction.data.phone,
                name: msgAction.data.name,
              },
              additionalData: { message: msgAction.data.message },
              conversationSummary,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to send message')
          }

          // Add success message
          const successReplies: SmartQuickReply[] = [
            { type: 'text', label: 'Thanks!' },
            { type: 'text', label: 'I have another question' },
          ]
          const successMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: "Done! I've sent your message to the team. They'll get back to you within a day (usually much faster). Is there anything else I can help with?",
            timestamp: Date.now(),
            quickReplies: successReplies,
          }
          dispatch({ type: 'ADD_MESSAGE', payload: successMessage })
        } catch (error) {
          console.error('Error sending team message:', error)
          const errorMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: "I couldn't send your message. You can reach us directly at hello@lashpopstudios.com or call (760) 212-0448.",
            timestamp: Date.now(),
          }
          dispatch({ type: 'ADD_MESSAGE', payload: errorMessage })
        }
        break
      }

      default:
        console.warn('Unknown action type:', action)
    }
  }, [panelStack.actions])

  // ============================================================================
  // Send Message to AI
  // ============================================================================

  const sendMessage = useCallback(async (content: string) => {
    const currentState = stateRef.current

    // Add user message
    const userMessage: ChatMessage = {
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
      const response = await fetch('/api/ask-lashpop/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: currentState.conversationId,
          conversationHistory,
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

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
        actions: data.actions,
        quickReplies: data.quickReplies,
      }
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage })
    } catch (error) {
      console.error('Chat error:', error)
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. You can reach us directly at hello@lashpopstudios.com or call (760) 212-0448.",
        timestamp: Date.now(),
        actions: [
          { type: 'call_phone', number: '+17602120448', label: 'Call Us', icon: 'phone' },
          { type: 'open_external', url: 'mailto:hello@lashpopstudios.com', label: 'Email Us', icon: 'mail' },
        ],
      }
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false })
    }
  }, [])

  // ============================================================================
  // Form Handling
  // ============================================================================

  const updateFormField = useCallback((field: string, value: string) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: { field, value } })
  }, [])

  const submitForm = useCallback(async () => {
    const currentState = stateRef.current
    if (!currentState.activeForm) return

    try {
      // Build conversation summary
      const conversationSummary = currentState.messages
        .map((msg) => `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}`)
        .join('\n\n')

      const response = await fetch('/api/ask-lashpop/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: currentState.activeForm.formType,
          contactInfo: {
            email: currentState.formData.email,
            phone: currentState.formData.phone,
            name: currentState.formData.name,
          },
          additionalData: currentState.formData,
          conversationSummary,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      // Clear form and go back to chat with success message
      dispatch({ type: 'CLEAR_FORM' })

      const formSuccessReplies: SmartQuickReply[] = [
        { type: 'text', label: 'Thanks!' },
        { type: 'text', label: 'I have another question' },
      ]
      const successMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: "I've sent your message to our team. They'll get back to you within 24 hours (usually much faster!). Is there anything else I can help with?",
        timestamp: Date.now(),
        quickReplies: formSuccessReplies,
      }
      dispatch({ type: 'ADD_MESSAGE', payload: successMessage })
    } catch (error) {
      console.error('Email error:', error)
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: "I couldn't send your message. Please try emailing us directly at hello@lashpopstudios.com",
        timestamp: Date.now(),
      }
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage })
      dispatch({ type: 'CLEAR_FORM' })
    }
  }, [])

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo<AskLashpopContextValue>(
    () => ({
      state,
      open,
      close,
      toggle,
      sendMessage,
      executeAction,
      setView,
      goBackToChat,
      updateFormField,
      submitForm,
    }),
    [state, open, close, toggle, sendMessage, executeAction, setView, goBackToChat, updateFormField, submitForm]
  )

  return <AskLashpopContext.Provider value={value}>{children}</AskLashpopContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useAskLashpop() {
  const context = useContext(AskLashpopContext)
  if (!context) {
    throw new Error('useAskLashpop must be used within AskLashpopProvider')
  }
  return context
}
