'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { hasSeenLashQuizPrompt } from './LashQuizPrompt'

export interface Service {
  id: string
  name: string
  slug: string
  subtitle: string | null
  description: string
  durationMinutes: number
  priceStarting: number
  imageUrl: string | null
  categorySlug: string | null
  categoryName: string | null
  subcategorySlug: string | null
  subcategoryName: string | null
  subcategoryDisplayOrder?: number | null
  vagaroServiceCode?: string | null
}

interface ServiceBrowserState {
  isOpen: boolean
  categorySlug: string | null
  categoryName: string | null
  view: 'browse' | 'detail' | 'booking'
  selectedService: Service | null
  activeSubcategory: string | null
  isBookingOpen: boolean
  // Lash quiz prompt state
  showLashQuizPrompt: boolean
  pendingLashOpen: boolean
  // Find Your Look quiz
  showFindYourLookQuiz: boolean
  // Morphing animation state - when true, quiz is embedded in services modal and will morph
  isMorphingQuiz: boolean
  morphTargetSubcategory: string | null
}

interface ServiceBrowserActions {
  openModal: (categorySlug: string, categoryName: string) => void
  closeModal: () => void
  selectService: (service: Service) => void
  goBack: () => void
  setActiveSubcategory: (subcategorySlug: string | null) => void
  openBooking: () => void
  closeBooking: () => void
  // Lash quiz prompt actions
  closeLashQuizPrompt: () => void
  confirmLashQuizSkip: () => void
  // Find Your Look quiz actions
  openFindYourLookQuiz: () => void
  closeFindYourLookQuiz: () => void
  handleQuizResult: (lashStyle: string) => void
  // Morphing animation actions
  completeMorph: () => void
}

interface ServiceBrowserContextValue {
  state: ServiceBrowserState
  actions: ServiceBrowserActions
  services: Service[]
}

const ServiceBrowserContext = createContext<ServiceBrowserContextValue | null>(null)

interface ServiceBrowserProviderProps {
  children: ReactNode
  services: Service[]
}

const initialState: ServiceBrowserState = {
  isOpen: false,
  categorySlug: null,
  categoryName: null,
  view: 'browse',
  selectedService: null,
  activeSubcategory: null,
  isBookingOpen: false,
  showLashQuizPrompt: false,
  pendingLashOpen: false,
  showFindYourLookQuiz: false,
  isMorphingQuiz: false,
  morphTargetSubcategory: null,
}

export function ServiceBrowserProvider({ children, services }: ServiceBrowserProviderProps) {
  const [state, setState] = useState<ServiceBrowserState>(initialState)

  const openModal = useCallback((categorySlug: string, categoryName: string) => {
    // Check if this is the lashes category and user hasn't seen the quiz prompt
    if (categorySlug === 'lashes' && !hasSeenLashQuizPrompt()) {
      setState({
        ...initialState,
        showLashQuizPrompt: true,
        pendingLashOpen: true,
        categorySlug,
        categoryName,
      })
    } else {
      setState({
        ...initialState,
        isOpen: true,
        categorySlug,
        categoryName,
      })
    }
  }, [])

  const closeModal = useCallback(() => {
    setState(initialState)
  }, [])

  const selectService = useCallback((service: Service) => {
    setState(prev => ({
      ...prev,
      view: 'detail',
      selectedService: service,
    }))
  }, [])

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      view: 'browse',
      selectedService: null,
    }))
  }, [])

  const setActiveSubcategory = useCallback((subcategorySlug: string | null) => {
    setState(prev => ({
      ...prev,
      activeSubcategory: subcategorySlug,
    }))
  }, [])

  // Change view to booking (embedded in same modal)
  const openBooking = useCallback(() => {
    setState(prev => ({ ...prev, view: 'booking' }))
  }, [])

  // Go back from booking view to detail
  const closeBooking = useCallback(() => {
    setState(prev => ({ ...prev, view: 'detail' }))
  }, [])

  // Close the lash quiz prompt without opening the modal
  const closeLashQuizPrompt = useCallback(() => {
    setState(initialState)
  }, [])

  // User chose to skip the quiz - open the lashes modal directly
  const confirmLashQuizSkip = useCallback(() => {
    setState(prev => ({
      ...initialState,
      isOpen: true,
      categorySlug: prev.categorySlug,
      categoryName: prev.categoryName,
    }))
  }, [])

  // Open the Find Your Look quiz - now opens as embedded morphing modal
  const openFindYourLookQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      showLashQuizPrompt: false,
      showFindYourLookQuiz: false,
      isOpen: true,
      categorySlug: 'lashes',
      categoryName: 'Lashes',
      isMorphingQuiz: true,
    }))
  }, [])

  // Close the Find Your Look quiz
  const closeFindYourLookQuiz = useCallback(() => {
    setState(initialState)
  }, [])

  // Handle quiz result - trigger morph animation to services modal
  const handleQuizResult = useCallback((lashStyle: string) => {
    // Map quiz result to subcategory slug
    const styleToSubcategory: Record<string, string> = {
      'lashLift': 'lash-enhancements', // Lash lift is in enhancements
      'classic': 'classic-extensions',
      'wetAngel': 'wet-angel-extensions',
      'hybrid': 'hybrid-extensions',
      'volume': 'volume-extensions',
    }

    const subcategorySlug = styleToSubcategory[lashStyle] || null

    // Set the morph target - animation will expand the modal
    setState(prev => ({
      ...prev,
      morphTargetSubcategory: subcategorySlug,
    }))
  }, [])

  // Complete the morph animation - switch from quiz view to services view
  const completeMorph = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMorphingQuiz: false,
      activeSubcategory: prev.morphTargetSubcategory,
      morphTargetSubcategory: null,
    }))
  }, [])

  const actions = useMemo<ServiceBrowserActions>(() => ({
    openModal,
    closeModal,
    selectService,
    goBack,
    setActiveSubcategory,
    openBooking,
    closeBooking,
    closeLashQuizPrompt,
    confirmLashQuizSkip,
    openFindYourLookQuiz,
    closeFindYourLookQuiz,
    handleQuizResult,
    completeMorph,
  }), [openModal, closeModal, selectService, goBack, setActiveSubcategory, openBooking, closeBooking, closeLashQuizPrompt, confirmLashQuizSkip, openFindYourLookQuiz, closeFindYourLookQuiz, handleQuizResult, completeMorph])

  const value = useMemo<ServiceBrowserContextValue>(() => ({
    state,
    actions,
    services,
  }), [state, actions, services])

  return (
    <ServiceBrowserContext.Provider value={value}>
      {children}
    </ServiceBrowserContext.Provider>
  )
}

export function useServiceBrowser() {
  const context = useContext(ServiceBrowserContext)
  if (!context) {
    throw new Error('useServiceBrowser must be used within ServiceBrowserProvider')
  }
  return context
}
