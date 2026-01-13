'use client'

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Instagram, Phone, Calendar, Star, X, Sparkles, Mail, ChevronLeft, ChevronRight, Hand, Check, UserPlus } from 'lucide-react'
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext'
import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { useInView } from 'framer-motion'
import { gsap, initGSAP } from '@/lib/gsap'
import { QuickFactsGrid, QuickFactCard, type QuickFact } from '@/components/team/QuickFactCard'

// Swipe Tutorial Hint Component - subtle wiggling icon in center
function SwipeHint() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white/30 backdrop-blur-sm rounded-full p-2"
        animate={{ x: [0, 4, 0, -4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Hand className="w-4 h-4 text-white/80 rotate-90" />
      </motion.div>
    </motion.div>
  )
}

// Swipe Success Component - subtle spinning check in center
function SwipeSuccess() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <motion.div
        className="bg-white/40 backdrop-blur-sm rounded-full p-2"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.3, ease: "backOut" }}
      >
        <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
      </motion.div>
    </motion.div>
  )
}

// Hook to check/set localStorage for tutorial completion
function useSwipeTutorial() {
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true) // Default true to prevent flash
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialSuccess, setTutorialSuccess] = useState(false)
  const swipeDistanceRef = useRef(0)

  useEffect(() => {
    const completed = localStorage.getItem('team-swipe-tutorial-completed') === 'true'
    setHasCompletedTutorial(completed)
  }, [])

  const resetSwipeDistance = useCallback(() => {
    swipeDistanceRef.current = 0
  }, [])

  const addSwipeDistance = useCallback((distance: number) => {
    swipeDistanceRef.current += Math.abs(distance)
    return swipeDistanceRef.current
  }, [])

  const completeTutorial = useCallback(() => {
    setTutorialSuccess(true)
    localStorage.setItem('team-swipe-tutorial-completed', 'true')
    setTimeout(() => {
      setHasCompletedTutorial(true)
      setShowTutorial(false)
    }, 1400)
  }, [])

  const triggerTutorial = useCallback(() => {
    if (!hasCompletedTutorial) {
      setShowTutorial(true)
    }
  }, [hasCompletedTutorial])

  return {
    hasCompletedTutorial,
    showTutorial,
    tutorialSuccess,
    completeTutorial,
    triggerTutorial,
    addSwipeDistance,
    resetSwipeDistance
  }
}

interface TeamMember {
  id: number
  uuid?: string
  name: string
  role: string
  type: 'employee' | 'independent'
  businessName?: string
  image: string
  phone: string
  email?: string
  specialties: string[]
  // Service categories pulled directly from Vagaro service assignments
  serviceCategories?: string[]
  bio?: string
  quote?: string
  availability?: string
  instagram?: string
  bookingUrl: string
  favoriteServices?: string[]
  funFact?: string
  quickFacts?: QuickFact[]
  // Photo crop URLs for different formats
  cropSquareUrl?: string
  cropCloseUpCircleUrl?: string
  cropMediumCircleUrl?: string
  cropFullVerticalUrl?: string
}

interface PortfolioImage {
  id: string
  url: string
  width?: number
  height?: number
  caption?: string
}

interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  displayOrder: number
}

interface EnhancedTeamSectionClientProps {
  teamMembers: TeamMember[]
  serviceCategories?: ServiceCategory[]
}

// Helper to determine columns per row based on breakpoint
const getColumnsForWidth = (width: number): number => {
  if (width >= 1024) return 4 // lg
  if (width >= 768) return 3  // md
  if (width >= 640) return 2  // sm
  return 1
}

export function EnhancedTeamSectionClient({ teamMembers, serviceCategories = [] }: EnhancedTeamSectionClientProps) {
  // Sort team members: Emily first, then employees, then independent
  const sortedTeamMembers = useMemo(() => {
    return [...teamMembers].sort((a, b) => {
      // Emily always first
      const aIsEmily = a.name.toLowerCase().startsWith('emily')
      const bIsEmily = b.name.toLowerCase().startsWith('emily')
      if (aIsEmily && !bIsEmily) return -1
      if (!aIsEmily && bIsEmily) return 1

      // Employees before independent
      if (a.type === 'employee' && b.type === 'independent') return -1
      if (a.type === 'independent' && b.type === 'employee') return 1

      // Keep original order within same group
      return 0
    })
  }, [teamMembers])

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(0)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [columnsPerRow, setColumnsPerRow] = useState(4)
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const expandedRowRef = useRef<HTMLDivElement>(null)
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null)
  const firstCardRef = useRef<HTMLDivElement>(null)
  const hasSnappedOnEntryRef = useRef(false)

  // Entry snap for mobile - snap when entering section, but allow free scroll within
  useEffect(() => {
    // Check mobile directly instead of relying on state
    const checkIsMobile = window.innerWidth < 768
    if (!checkIsMobile || !sectionRef.current) return

    const section = sectionRef.current
    const container = document.querySelector('.mobile-scroll-container') as HTMLElement
    if (!container) return

    const mobileHeaderHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--mobile-header-height') || '44'
    )

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Snap when entering viewport and haven't snapped yet
          if (entry.isIntersecting && !hasSnappedOnEntryRef.current) {
            const rect = section.getBoundingClientRect()
            // Only snap if section top is near viewport top (scrolling down into section)
            if (rect.top > -100 && rect.top < 200) {
              hasSnappedOnEntryRef.current = true

              // Calculate snap position with anchor offset (vh * 0.03)
              const anchorOffset = window.innerHeight * 0.03
              const sectionTop = container.scrollTop + rect.top
              const targetScrollY = sectionTop - anchorOffset

              container.scrollTo({ top: targetScrollY, behavior: 'smooth' })
            }
          }

          // Reset flag when section leaves viewport (allows snap on re-entry)
          if (!entry.isIntersecting) {
            hasSnappedOnEntryRef.current = false
          }
        })
      },
      {
        root: container,
        threshold: [0, 0.1],
        rootMargin: `-${mobileHeaderHeight}px 0px 0px 0px`
      }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Swipe tutorial state
  const {
    hasCompletedTutorial,
    showTutorial,
    tutorialSuccess,
    completeTutorial,
    triggerTutorial,
    addSwipeDistance,
    resetSwipeDistance
  } = useSwipeTutorial()

  // Observe first card - trigger tutorial immediately when visible
  useEffect(() => {
    if (!isMobile || hasCompletedTutorial || !firstCardRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger immediately when card becomes visible
            triggerTutorial()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 } // Trigger when just 10% visible
    )

    observer.observe(firstCardRef.current)
    return () => observer.disconnect()
  }, [isMobile, hasCompletedTutorial, triggerTutorial])

  // Navigation functions for swiping between team members
  const goToNextMember = () => {
    const nextIndex = (selectedMemberIndex + 1) % sortedTeamMembers.length
    setSwipeDirection('left')
    setSelectedMemberIndex(nextIndex)
    setSelectedMember(sortedTeamMembers[nextIndex])
  }

  const goToPrevMember = () => {
    const prevIndex = selectedMemberIndex === 0 ? sortedTeamMembers.length - 1 : selectedMemberIndex - 1
    setSwipeDirection('right')
    setSelectedMemberIndex(prevIndex)
    setSelectedMember(sortedTeamMembers[prevIndex])
  }

  // Handle selecting a member (also tracks index)
  const handleSelectMember = (member: TeamMember) => {
    const index = sortedTeamMembers.findIndex(m => m.id === member.id)
    setSelectedMemberIndex(index >= 0 ? index : 0)
    setSelectedMember(member)
    setSwipeDirection(null)
    setShowModal(true)
  }
  const isInView = useInView(sectionRef, { once: true, margin: "-20%" })

  // Track mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize Embla Carousel for mobile
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      skipSnaps: false,
      containScroll: 'trimSnaps'
    },
    [WheelGesturesPlugin()]
  )

  const orchestrator = useBookingOrchestrator()
  const highlights = orchestrator.state.highlights.providers

  useEffect(() => {
    if (sectionRef.current) {
      const unregister = orchestrator.actions.registerSection('team', sectionRef.current)
      return unregister
    }
  }, [orchestrator.actions])

  // Check if mobile and track column count for desktop grid
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setColumnsPerRow(getColumnsForWidth(width))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate which row a member is in (0-indexed)
  const getRowForIndex = (index: number): number => Math.floor(index / columnsPerRow)

  // Get the row number for the selected member
  const selectedRow = selectedMember ? getRowForIndex(selectedMemberIndex) : -1

  // Scroll to center expansion panel with GSAP when it appears
  useEffect(() => {
    if (expandedRowRef.current && selectedMember && !isMobile) {
      // Wait for the spring animation to mostly complete before scrolling
      const scrollTimeout = setTimeout(async () => {
        await initGSAP()
        if (expandedRowRef.current) {
          // Get the element's position after animation has settled
          const element = expandedRowRef.current
          const elementRect = element.getBoundingClientRect()
          const elementTop = window.scrollY + elementRect.top
          const elementHeight = element.offsetHeight || 500 // Fallback height
          const viewportHeight = window.innerHeight

          // Calculate scroll position to center the panel in viewport
          // We want the center of the panel to be at the center of the viewport
          const scrollTarget = elementTop - (viewportHeight / 2) + (elementHeight / 2)

          gsap.to(window, {
            duration: 0.6,
            scrollTo: {
              y: Math.max(0, scrollTarget),
              autoKill: false
            },
            ease: 'power2.inOut'
          })
        }
      }, 400) // Wait longer for spring animation to settle

      return () => clearTimeout(scrollTimeout)
    }
  }, [selectedMember, isMobile])

  // Fetch portfolio images when a member is selected (desktop only)
  useEffect(() => {
    if (selectedMember?.uuid && !isMobile) {
      setIsLoadingPortfolio(true)
      setCurrentImageIndex(0)

      // Fetch DAM assets tagged to this team member
      fetch(`/api/dam/team/${selectedMember.uuid}/photos`)
        .then(res => res.json())
        .then(data => {
          if (data.photos && data.photos.length > 0) {
            const images: PortfolioImage[] = data.photos.map((photo: any) => ({
              id: photo.id,
              url: photo.filePath,
              width: photo.width,
              height: photo.height,
              caption: photo.caption
            }))
            setPortfolioImages(images)
          } else {
            setPortfolioImages([])
          }
        })
        .catch(() => setPortfolioImages([]))
        .finally(() => setIsLoadingPortfolio(false))
    } else {
      setPortfolioImages([])
    }
  }, [selectedMember?.uuid, isMobile])

  // Auto-advance carousel when there are multiple images
  useEffect(() => {
    if (portfolioImages.length > 1 && !isMobile) {
      autoAdvanceRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % portfolioImages.length)
      }, 4000) // Advance every 4 seconds

      return () => {
        if (autoAdvanceRef.current) {
          clearInterval(autoAdvanceRef.current)
        }
      }
    }
  }, [portfolioImages.length, isMobile])

  // Reset auto-advance when user manually changes image
  const handleImageSelect = useCallback((index: number) => {
    setCurrentImageIndex(index)
    // Reset the auto-advance timer
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current)
      autoAdvanceRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % portfolioImages.length)
      }, 4000)
    }
  }, [portfolioImages.length])

  // Check if current image is horizontal (wider than tall)
  const isCurrentImageHorizontal = useMemo(() => {
    if (portfolioImages.length === 0) return false
    const img = portfolioImages[currentImageIndex]
    return img?.width && img?.height && img.width > img.height
  }, [portfolioImages, currentImageIndex])

  // Add subtle nudge animation when carousel comes into view on mobile
  useEffect(() => {
    if (!emblaApi || !isInView || !isMobile) return

    // Subtle nudge animation
    setTimeout(() => {
      emblaApi.scrollTo(0.3, false)
      setTimeout(() => {
        emblaApi.scrollTo(0, true)
      }, 400)
    }, 800)
  }, [emblaApi, isInView, isMobile])

  const handleMemberClick = (member: TeamMember, index: number) => {
    if (isMobile) {
      // Mobile: use full-screen modal
      handleSelectMember(member)
    } else {
      // Desktop: toggle inline expansion
      if (selectedMember?.id === member.id) {
        // Clicking same member closes the expansion
        setSelectedMember(null)
        setShowModal(false)
      } else {
        // Select new member (expansion will appear below their row)
        setSelectedMemberIndex(index)
        setSelectedMember(member)
        setShowModal(false) // Don't use modal on desktop
      }
    }
  }

  // Close inline expansion
  const closeExpansion = () => {
    setSelectedMember(null)
  }

  const isHighlighted = (memberId: number) => highlights.includes(memberId.toString())

  // Map specialties to service categories (fallback when no Vagaro data)
  const getTeamMemberCategories = (specialties: string[]) => {
    // Map common specialty keywords to categories
    const mappings: Record<string, string> = {
      'lash': 'Lashes',
      'extension': 'Lashes',
      'classic': 'Lashes',
      'volume': 'Lashes',
      'hybrid': 'Lashes',
      'mega': 'Lashes',
      'wispy': 'Lashes',
      'wet': 'Lashes',
      'brow': 'Brow',
      'lamination': 'Brow',
      'microblading': 'Brow',
      'threading': 'Brow',
      'lift': 'Lash Lifts',
      'perm': 'Lash Lifts',
      'tint': 'Tinting',
      'dye': 'Tinting',
      'wax': 'Waxing',
      'facial': 'Facials',
      'hydrafacial': 'Facials',
      'dermaplaning': 'Facials',
      'skin': 'Skin Care',
      'plasma': 'Plasma',
      'fibroblast': 'Plasma',
      'jet plasma': 'Plasma',
      'botox': 'Injectables',
      'filler': 'Injectables',
      'injection': 'Injectables',
      'iv': 'Wellness',
      'permanent makeup': 'Permanent Makeup',
      'lip blush': 'Permanent Makeup',
      'jewelry': 'Permanent Jewelry'
    }

    const categories = new Set<string>()

    specialties.forEach(specialty => {
      const lower = specialty.toLowerCase()
      for (const [keyword, category] of Object.entries(mappings)) {
        if (lower.includes(keyword)) {
          categories.add(category)
          break
        }
      }
    })

    return Array.from(categories).slice(0, 4) // Max 4 category chips
  }

  return (
    <>
      <section
        ref={sectionRef}
        className="py-20 bg-ivory overflow-x-hidden"
      >
        {/* Section Header */}
        <div className="text-center mb-12 px-4">
          <h2
            className="text-2xl md:text-3xl font-medium tracking-wide mb-6"
            style={{ color: '#6d4a43' }}
          >
            Find Your Stylist
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-base md:text-lg leading-relaxed" style={{ color: '#8a5e55' }}>
              LashPop Studios is home to a collective of independent beauty businesses—each offering their own services, pricing, schedules, and specialties.
            </p>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: '#8a5e55' }}>
              Browse the profiles below to find a stylist that fits your vibe.
            </p>
          </div>
        </div>

        {/* Mobile Grid View with Squircle Cards */}
        {isMobile ? (
          <div className="px-4">
            {/* 2-column grid for all mobile sizes */}
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                // Find the first card with swipeable tags (2+ categories)
                let firstSwipeableIndex = -1
                return sortedTeamMembers.map((member, index) => {
                  // Use service categories from Vagaro, fallback to derived from specialties
                  const memberCategories = member.serviceCategories?.length
                    ? member.serviceCategories
                    : getTeamMemberCategories(member.specialties)

                  // Track first card with 2+ categories (swipeable)
                  const hasSwipeableTags = memberCategories.length >= 2
                  const isFirstSwipeable = hasSwipeableTags && firstSwipeableIndex === -1
                  if (isFirstSwipeable) firstSwipeableIndex = index

                  // Use square crop for face-focused image, fallback to regular image
                  const cardImage = member.cropSquareUrl || member.image

                  // Format name as "First L."
                  const nameParts = member.name.split(' ')
                  const firstName = nameParts[0]
                  const lastInitial = nameParts.length > 1 ? `${nameParts[nameParts.length - 1][0]}.` : ''
                  const displayName = `${firstName} ${lastInitial}`.trim()

                  // Show tutorial on first swipeable card
                  const showTutorialOnThisCard = isFirstSwipeable && showTutorial && !tutorialSuccess

                  return (
                    <motion.div
                      key={member.id}
                      ref={isFirstSwipeable ? firstCardRef : undefined}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className="cursor-pointer"
                    >
                      {/* Arch Card Container */}
                      <div
                        className="bg-white rounded-[20px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 active:scale-[0.98] border border-terracotta/10"
                        onTouchStart={(e) => {
                        const touch = e.touches[0]
                        const card = e.currentTarget
                        card.dataset.touchStartX = touch.clientX.toString()
                        card.dataset.touchStartY = touch.clientY.toString()
                        card.dataset.touchCurrentX = touch.clientX.toString()
                        card.dataset.touchType = 'undecided' // undecided, tap, scroll-tags, scroll-page
                        // Reset swipe distance tracking for tutorial
                        if (isFirstSwipeable) resetSwipeDistance()
                      }}
                      onTouchMove={(e) => {
                        const card = e.currentTarget
                        const startX = parseFloat(card.dataset.touchStartX || '0')
                        const startY = parseFloat(card.dataset.touchStartY || '0')
                        const currentX = parseFloat(card.dataset.touchCurrentX || '0')
                        const touch = e.touches[0]
                        const totalDeltaX = Math.abs(touch.clientX - startX)
                        const totalDeltaY = Math.abs(touch.clientY - startY)
                        const moveDeltaX = touch.clientX - currentX

                        // Threshold to decide touch type (12px)
                        const threshold = 12

                        // Once decided, stick with it
                        if (card.dataset.touchType === 'undecided') {
                          if (totalDeltaX > threshold || totalDeltaY > threshold) {
                            // Decide based on dominant direction
                            if (totalDeltaX > totalDeltaY) {
                              card.dataset.touchType = 'scroll-tags'
                            } else {
                              card.dataset.touchType = 'scroll-page'
                            }
                          }
                        }

                        // If scrolling tags, handle it
                        if (card.dataset.touchType === 'scroll-tags') {
                          const tagsContainer = card.querySelector('[data-tags-scroll]') as HTMLElement
                          if (tagsContainer) {
                            tagsContainer.scrollLeft -= moveDeltaX
                            // Track swipe distance and complete tutorial after meaningful swipe (50px)
                            if (isFirstSwipeable && showTutorial && !tutorialSuccess) {
                              const totalDistance = addSwipeDistance(moveDeltaX)
                              if (totalDistance >= 50) {
                                completeTutorial()
                              }
                            }
                          }
                        }

                        // Update current position for next move
                        card.dataset.touchCurrentX = touch.clientX.toString()
                      }}
                      onTouchEnd={(e) => {
                        const card = e.currentTarget
                        // Only trigger click if touch type was never decided (true tap with <12px movement)
                        if (card.dataset.touchType === 'undecided') {
                          handleMemberClick(member, index)
                        }
                      }}
                    >
                      {/* Arch Image Container */}
                      <div className="relative px-3 pt-3">
                        <div className="relative h-48 overflow-hidden rounded-t-[60px] rounded-b-lg bg-stone-100">
                          {/* Service Tags */}
                          {memberCategories.length > 0 && (
                            <div className="absolute top-3 left-3 z-20">
                              <div
                                data-tags-scroll
                                className="flex flex-wrap gap-1"
                              >
                                {memberCategories.slice(0, 2).map((category) => (
                                  <span
                                    key={category}
                                    className="text-[9px] font-serif font-light px-2 py-0.5 bg-terracotta-light/90 text-white rounded-full whitespace-nowrap"
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <Image
                            src={cardImage}
                            alt={member.name}
                            fill
                            className="object-cover"
                            sizes="50vw"
                          />
                        </div>
                      </div>

                      {/* Content Below Image */}
                      <div className="px-4 py-4 text-center">
                        {/* Name */}
                        <h3 className="text-lg font-serif font-light text-gray-900 mb-1">
                          {displayName}
                        </h3>

                        {/* Separator Line */}
                        <div className="w-12 h-px bg-terracotta/30 mx-auto mb-1" />

                        {/* Title/Role */}
                        <p className="text-xs font-serif font-light text-gray-500">
                          {member.name.toLowerCase().startsWith('emily')
                            ? 'LashPop Owner'
                            : member.type === 'employee'
                              ? 'LashPop Team Artist'
                              : member.businessName || 'Independent Artist'}
                        </p>
                      </div>

                      {/* Highlight Ring */}
                      {isHighlighted(member.id) && (
                        <div className="absolute inset-0 pointer-events-none rounded-[20px] ring-[3px] ring-inset ring-dusty-rose" />
                      )}

                      {/* Swipe Tutorial Hint */}
                      <AnimatePresence>
                        {showTutorialOnThisCard && <SwipeHint />}
                        {isFirstSwipeable && tutorialSuccess && <SwipeSuccess />}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  )
                })
              })()}
            </div>
          </div>
        ) : (
          <div className="container px-4">
            {/* Desktop Grid View with Inline Expansion */}
            <div className="max-w-7xl mx-auto">
              {/* Render cards row by row so we can insert expansion after each row */}
              {Array.from({ length: Math.ceil(sortedTeamMembers.length / columnsPerRow) }).map((_, rowIndex) => {
                const rowStart = rowIndex * columnsPerRow
                const rowMembers = sortedTeamMembers.slice(rowStart, rowStart + columnsPerRow)
                const isExpansionRow = selectedRow === rowIndex && selectedMember

                return (
                  <div key={rowIndex}>
                    {/* Row of cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
                      {rowMembers.map((member, indexInRow) => {
                        const absoluteIndex = rowStart + indexInRow
                        const memberCategories = member.serviceCategories?.length
                          ? member.serviceCategories
                          : getTeamMemberCategories(member.specialties)
                        const isSelected = selectedMember?.id === member.id

                        return (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{
                              duration: 0.5,
                              delay: indexInRow * 0.05,
                              ease: [0.23, 1, 0.32, 1]
                            }}
                            className="relative group cursor-pointer"
                            onClick={() => handleMemberClick(member, absoluteIndex)}
                            onMouseEnter={() => setHoveredId(member.id)}
                            onMouseLeave={() => setHoveredId(null)}
                          >
                            {/* Arch Card Design */}
                            <motion.div
                              className={`bg-white rounded-[20px] overflow-hidden shadow-md transition-all duration-300 border border-terracotta/10 ${
                                isSelected ? 'ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream' : ''
                              }`}
                              whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                              animate={{ scale: isSelected ? 1.02 : 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {/* Arch Image Container */}
                              <div className="relative px-4 pt-4">
                                <div className="relative h-72 overflow-hidden rounded-t-[80px] rounded-b-lg bg-stone-100">
                                  {/* Service Tags */}
                                  {memberCategories.length > 0 && (
                                    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5">
                                      {memberCategories.slice(0, 3).map((category, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs font-serif font-light px-3 py-1 bg-terracotta-light/90 text-white rounded-full"
                                        >
                                          {category}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Image */}
                                  <Image
                                    src={member.image}
                                    alt={member.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                  />
                                </div>
                              </div>

                              {/* Content Below Image */}
                              <div className="px-6 py-5 text-center">
                                {/* Name */}
                                <h3 className="text-2xl font-serif font-light text-gray-900 mb-2">
                                  {member.name}
                                </h3>

                                {/* Separator Line */}
                                <div className="w-16 h-px bg-terracotta/30 mx-auto mb-2" />

                                {/* Title/Role */}
                                <p className="font-serif font-light text-gray-500">
                                  {member.name.toLowerCase().startsWith('emily')
                                    ? 'LashPop Owner'
                                    : member.type === 'employee'
                                      ? 'LashPop Team Artist'
                                      : member.businessName || 'Independent Artist'}
                                </p>
                              </div>

                              {/* Hover Glow Effect */}
                              <AnimatePresence>
                                {hoveredId === member.id && !isSelected && (
                                  <motion.div
                                    className="absolute inset-0 bg-white/5 pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                  />
                                )}
                              </AnimatePresence>

                              {/* Highlight Ring (from orchestrator) */}
                              {isHighlighted(member.id) && !isSelected && (
                                <div className="absolute inset-0 ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream rounded-[20px] pointer-events-none" />
                              )}
                            </motion.div>

                            {/* Connector arrow for selected card */}
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  className="absolute left-1/2 -bottom-3 -translate-x-1/2 z-10"
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="w-4 h-4 bg-white rotate-45 shadow-lg" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Inline Expansion Panel - appears below this row when a member from this row is selected */}
                    <AnimatePresence>
                      {isExpansionRow && selectedMember && (
                        <motion.div
                          ref={expandedRowRef}
                          className="mb-6 overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { type: "spring", damping: 25, stiffness: 200 },
                            opacity: { duration: 0.2 }
                          }}
                        >
                          <div className="bg-white rounded-3xl shadow-xl border border-sage/10 overflow-hidden">
                            <div className="flex flex-col lg:flex-row">
                              {/* Left: Portfolio Image Carousel */}
                              <div className="lg:w-2/5 relative flex flex-col">
                                {/* Main Image Display */}
                                <div className="relative aspect-[4/5] lg:aspect-auto lg:flex-1 overflow-hidden bg-dune/5">
                                  {/* Blurred background for horizontal images */}
                                  {(portfolioImages.length > 0 ? isCurrentImageHorizontal : false) && (
                                    <div className="absolute inset-0 overflow-hidden">
                                      <Image
                                        src={portfolioImages[currentImageIndex]?.url || selectedMember.image}
                                        alt=""
                                        fill
                                        className="object-cover scale-150 blur-2xl opacity-60"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}

                                  {/* Loading state */}
                                  {isLoadingPortfolio ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-8 h-8 border-2 border-dusty-rose border-t-transparent rounded-full animate-spin" />
                                    </div>
                                  ) : (
                                    <AnimatePresence mode="wait">
                                      <motion.div
                                        key={portfolioImages.length > 0 ? portfolioImages[currentImageIndex]?.id : 'headshot'}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 flex items-center justify-center"
                                      >
                                        <Image
                                          src={portfolioImages.length > 0 ? portfolioImages[currentImageIndex]?.url : selectedMember.image}
                                          alt={selectedMember.name}
                                          fill
                                          className={`${
                                            portfolioImages.length > 0 && isCurrentImageHorizontal
                                              ? 'object-contain'
                                              : 'object-cover'
                                          }`}
                                        />
                                      </motion.div>
                                    </AnimatePresence>
                                  )}

                                  {/* Navigation arrows for portfolio */}
                                  {portfolioImages.length > 1 && (
                                    <>
                                      <button
                                        onClick={() => handleImageSelect((currentImageIndex - 1 + portfolioImages.length) % portfolioImages.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                                        aria-label="Previous image"
                                      >
                                        <ChevronLeft className="w-5 h-5 text-dune" />
                                      </button>
                                      <button
                                        onClick={() => handleImageSelect((currentImageIndex + 1) % portfolioImages.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
                                        aria-label="Next image"
                                      >
                                        <ChevronRight className="w-5 h-5 text-dune" />
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* Thumbnail strip */}
                                {portfolioImages.length > 1 && (
                                  <div className="bg-dune/5 p-3">
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                      {portfolioImages.map((img, idx) => (
                                        <button
                                          key={img.id}
                                          onClick={() => handleImageSelect(idx)}
                                          className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all ${
                                            idx === currentImageIndex
                                              ? 'ring-2 ring-dusty-rose scale-105'
                                              : 'opacity-60 hover:opacity-100'
                                          }`}
                                        >
                                          <Image
                                            src={img.url}
                                            alt={`Portfolio ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right: Content */}
                              <div className="lg:w-3/5 p-8 lg:p-10 relative">
                                {/* Close Button */}
                                <button
                                  onClick={closeExpansion}
                                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-cream hover:bg-sage/10 flex items-center justify-center transition-colors"
                                  aria-label="Close"
                                >
                                  <X className="w-5 h-5 text-dune" />
                                </button>

                                {/* Name, Title & Instagram */}
                                <div className="mb-6 pr-12">
                                  <h2 className="font-serif text-3xl text-dune">
                                    {selectedMember.name}
                                  </h2>
                                  {selectedMember.instagram ? (
                                    <a
                                      href={`https://instagram.com/${selectedMember.instagram.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-dusty-rose font-medium mt-1 hover:text-dusty-rose/80 transition-colors"
                                    >
                                      <Instagram className="w-4 h-4" />
                                      <span>
                                        {selectedMember.type === 'independent' && selectedMember.businessName
                                          ? selectedMember.businessName
                                          : 'LashPop Artist'}
                                      </span>
                                    </a>
                                  ) : (
                                    <p className="text-dusty-rose font-medium mt-1">
                                      {selectedMember.type === 'independent' && selectedMember.businessName
                                        ? selectedMember.businessName
                                        : 'LashPop Artist'}
                                    </p>
                                  )}
                                </div>

                                {/* Bio */}
                                {selectedMember.bio && (
                                  <div className="mb-6">
                                    <h3 className="font-serif text-lg text-dune mb-2">About</h3>
                                    <p className="text-sage leading-relaxed">{selectedMember.bio}</p>
                                  </div>
                                )}

                                {/* Services */}
                                {(selectedMember.serviceCategories?.length || getTeamMemberCategories(selectedMember.specialties).length > 0) && (
                                  <div className="mb-6">
                                    <h3 className="font-serif text-lg text-dune mb-3">Services</h3>
                                    <div className="flex flex-wrap gap-2">
                                      {(selectedMember.serviceCategories?.length
                                        ? selectedMember.serviceCategories
                                        : getTeamMemberCategories(selectedMember.specialties)
                                      ).map((category, idx) => (
                                        <span
                                          key={idx}
                                          className="px-4 py-2 text-sm font-medium bg-sage/10 text-sage rounded-full"
                                        >
                                          {category}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Quick Facts Grid */}
                                {(selectedMember.quickFacts && selectedMember.quickFacts.length > 0) ? (
                                  <div>
                                    <h3 className="font-serif text-lg text-dune mb-3">Quick Facts</h3>
                                    <QuickFactsGrid facts={selectedMember.quickFacts} />
                                  </div>
                                ) : selectedMember.funFact && (
                                  /* Fallback to single Fun Fact if no quick facts */
                                  <div className="bg-gradient-to-br from-warm-sand/30 to-dusty-rose/10 rounded-2xl p-5">
                                    <h3 className="font-serif text-base text-dune mb-2 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-dusty-rose" />
                                      Fun Fact
                                    </h3>
                                    <p className="text-dune/80 text-sm leading-relaxed">{selectedMember.funFact}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Join The Team CTA */}
        <div className="text-center mt-12 md:mt-16 px-4">
          <a
            href="mailto:careers@lashpopstudios.com?subject=Join%20The%20Team"
            className="inline-block px-6 py-3 md:px-8 md:py-3.5 rounded-full border-2 transition-all duration-300 hover:bg-[#6d4a43] hover:text-white hover:border-[#6d4a43]"
            style={{
              borderColor: '#6d4a43',
              color: '#6d4a43',
            }}
          >
            <span className="text-sm font-medium tracking-[0.1em] uppercase">
              Join The Team
            </span>
          </a>
        </div>
      </section>

      {/* Team Member Modal - Full Screen on Mobile (Portaled to body) */}
      {mounted && createPortal(
        <AnimatePresence>
          {showModal && selectedMember && (
            <>
              {/* Backdrop - Hidden on mobile (full screen takeover) */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] hidden md:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
              />

              {/* Modal Content - z-[10000] to appear above everything */}
              <motion.div
                className="fixed inset-0 z-[10000] md:flex md:items-center md:justify-center md:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
              {/* Mobile: Full screen | Desktop: Centered modal */}
              <motion.div
                className="bg-cream md:bg-white/95 md:backdrop-blur-xl md:rounded-3xl md:shadow-2xl md:max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.9 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* ===== MOBILE LAYOUT ===== */}
                {isMobile ? (
                  <div
                    className="flex flex-col h-full relative touch-pan-x"
                    style={{ height: '100dvh', overscrollBehavior: 'none' }}
                    onTouchStart={(e) => {
                      const touch = e.touches[0]
                      const target = e.currentTarget as HTMLDivElement
                      target.dataset.touchStartX = touch.clientX.toString()
                      target.dataset.touchStartY = touch.clientY.toString()
                      target.dataset.isHorizontalSwipe = 'undecided'
                    }}
                    onTouchMove={(e) => {
                      const target = e.currentTarget as HTMLDivElement
                      const startX = parseFloat(target.dataset.touchStartX || '0')
                      const startY = parseFloat(target.dataset.touchStartY || '0')
                      const touch = e.touches[0]
                      const deltaX = Math.abs(touch.clientX - startX)
                      const deltaY = Math.abs(touch.clientY - startY)

                      // Once we've moved enough to decide direction, lock it in
                      if (target.dataset.isHorizontalSwipe === 'undecided' && (deltaX > 10 || deltaY > 10)) {
                        target.dataset.isHorizontalSwipe = deltaX > deltaY ? 'yes' : 'no'
                      }

                      // If horizontal swipe detected, prevent vertical scroll by stopping propagation
                      if (target.dataset.isHorizontalSwipe === 'yes') {
                        e.preventDefault()
                      }
                    }}
                    onTouchEnd={(e) => {
                      const target = e.currentTarget as HTMLDivElement
                      const startX = parseFloat(target.dataset.touchStartX || '0')
                      const startY = parseFloat(target.dataset.touchStartY || '0')
                      const touch = e.changedTouches[0]
                      const deltaX = touch.clientX - startX
                      const deltaY = touch.clientY - startY

                      // Only trigger swipe if we detected a horizontal swipe and it exceeds threshold
                      const threshold = 80
                      if (target.dataset.isHorizontalSwipe === 'yes' && Math.abs(deltaX) > threshold) {
                        if (deltaX > 0) {
                          goToPrevMember()
                        } else {
                          goToNextMember()
                        }
                      }

                      // Reset state
                      target.dataset.isHorizontalSwipe = 'undecided'
                    }}
                  >
                    {/* Floating Header - with close button and pagination */}
                    <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
                      <div className="flex items-center justify-between px-4 py-3">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowModal(false)}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5 text-white" />
                        </motion.button>

                        {/* Pagination dots */}
                        <div className="flex items-center gap-1.5">
                          {sortedTeamMembers.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                idx === selectedMemberIndex
                                  ? 'bg-white w-4'
                                  : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {selectedMember.instagram && (
                            <a
                              href={`https://instagram.com/${selectedMember.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md"
                            >
                              <Instagram className="w-5 h-5 text-white" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Base background - prevents flash during image swap */}
                    <div className="absolute inset-0 z-0 bg-cream" />

                    {/* Fixed Hero Image - crossfades between team members */}
                    <div className="absolute inset-0 z-[1]">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={selectedMember.id}
                          className="absolute inset-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                        >
                          <div className="relative h-[70vh] overflow-hidden">
                            <Image
                              src={selectedMember.image}
                              alt={selectedMember.name}
                              fill
                              className="object-cover object-top"
                              priority
                            />
                            {/* Gradient overlay on photo - positioned to align with content gradient */}
                            <div className="absolute inset-x-0 bottom-[-5vh] h-32 bg-gradient-to-t from-cream from-30% via-cream/90 via-60% to-transparent" />
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Scrollable Content Overlay - swipes left/right */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`content-${selectedMember.id}`}
                        className="relative z-10 flex-1 overflow-y-auto overscroll-none"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                        initial={{ opacity: 0, x: swipeDirection === 'left' ? 80 : swipeDirection === 'right' ? -80 : 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: swipeDirection === 'left' ? -80 : swipeDirection === 'right' ? 80 : 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        onScroll={(e) => {
                          // Prevent scrolling past the top (which would show gap above image)
                          const target = e.currentTarget
                          if (target.scrollTop < 0) {
                            target.scrollTop = 0
                          }
                        }}
                      >
                        {/* Spacer to position content below the image initially */}
                        <div className="h-[65vh] pointer-events-none" />

                        {/* All content wrapped together */}
                        <div className="relative">
                          {/* Gradient - absolutely positioned, extends from top down past the card */}
                          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-t from-cream from-50% via-cream/90 via-75% to-transparent pointer-events-none z-0" />

                          {/* Spacer - none needed now */}

                          {/* Name and biz - no card, just floating on gradient */}
                          <div className="relative px-5 pb-4 pointer-events-auto z-10">
                            <h1 className="font-serif text-3xl text-dune leading-tight">
                              <span className="font-bold">{selectedMember.name.split(' ')[0]}</span>{selectedMember.name.includes(' ') ? ` ${selectedMember.name.split(' ').slice(1).join(' ')}` : ''}
                            </h1>
                            {selectedMember.instagram ? (
                              <a
                                href={`https://instagram.com/${selectedMember.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-1.5 text-dusty-rose hover:text-dusty-rose/80 transition-colors"
                              >
                                <Instagram className="w-3.5 h-3.5" />
                                <span className="text-xs uppercase tracking-wider font-medium">
                                  {selectedMember.type === 'independent' && selectedMember.businessName
                                    ? selectedMember.businessName
                                    : 'LashPop Artist'}
                                </span>
                              </a>
                            ) : (
                              <p className="text-xs uppercase tracking-wider font-medium text-dusty-rose mt-1.5">
                                {selectedMember.type === 'independent' && selectedMember.businessName
                                  ? selectedMember.businessName
                                  : 'LashPop Artist'}
                              </p>
                            )}
                          </div>

                          {/* Content Sections */}
                          <div className="relative px-5 pb-6 space-y-6 bg-cream pointer-events-auto z-0">
                          {/* Bio Section */}
                          {selectedMember.bio && (
                            <div>
                              <h3 className="font-serif text-lg text-dune mb-3">About</h3>
                              <p className="text-sage leading-relaxed text-sm">{selectedMember.bio}</p>
                            </div>
                          )}

                          {/* Services */}
                          {(selectedMember.serviceCategories?.length || getTeamMemberCategories(selectedMember.specialties).length > 0) && (
                            <div>
                              <h3 className="font-serif text-lg text-dune mb-3">Services</h3>
                              <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                                <div className="flex gap-1.5 min-w-max">
                                  {(selectedMember.serviceCategories?.length
                                    ? selectedMember.serviceCategories
                                    : getTeamMemberCategories(selectedMember.specialties)
                                  ).map((category, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 text-xs font-medium bg-sage/10 text-sage rounded-full whitespace-nowrap"
                                    >
                                      {category}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quick Facts (Mobile) - swipeable if multiple */}
                          {(selectedMember.quickFacts && selectedMember.quickFacts.length > 0) ? (
                            <div>
                              <h3 className="font-serif text-lg text-dune mb-3">
                                Get to know {selectedMember.name.split(' ')[0]}
                              </h3>
                              {selectedMember.quickFacts.length === 1 ? (
                                /* Single fact - full width */
                                <QuickFactsGrid facts={selectedMember.quickFacts} />
                              ) : (
                                /* Multiple facts - swipeable row with expanded touch area */
                                <div
                                  className="overflow-x-auto overflow-y-visible scrollbar-hide -mx-5 touch-pan-x"
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onTouchMove={(e) => e.stopPropagation()}
                                >
                                  <div className="flex gap-3 px-5 py-4" style={{ width: 'max-content' }}>
                                    {[...selectedMember.quickFacts]
                                      .sort((a, b) => a.displayOrder - b.displayOrder)
                                      .map((fact, index) => (
                                        <div
                                          key={fact.id}
                                          className="w-[75vw] max-w-[300px] flex-shrink-0"
                                        >
                                          <QuickFactCard fact={fact} index={index} />
                                        </div>
                                      ))}
                                    {/* End spacer for last card visibility */}
                                    <div className="w-5 flex-shrink-0" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : selectedMember.funFact && (
                            /* Fallback to single Fun Fact if no quick facts */
                            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-5 border border-white/60 shadow-lg">
                              <h3 className="font-serif text-lg text-dune mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-dusty-rose" />
                                Get to know {selectedMember.name.split(' ')[0]}
                              </h3>
                              <p className="text-dune/80 text-sm leading-relaxed">{selectedMember.funFact}</p>
                            </div>
                          )}

                            {/* Bottom spacer for safe area */}
                            <div className="h-8 safe-area-bottom" />
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ) : (
                  /* ===== DESKTOP LAYOUT (Original) ===== */
                  <div className="overflow-y-auto">
                    {/* Close Button */}
                    <button
                      onClick={() => setShowModal(false)}
                      className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/60 flex items-center justify-center hover:bg-white transition-all"
                    >
                      <X className="w-5 h-5 text-dune" />
                    </button>

                    {/* Modal Header with Image */}
                    <div className="relative h-80 rounded-t-3xl overflow-hidden">
                      <Image
                        src={selectedMember.image}
                        alt={selectedMember.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Header Content */}
                      <div className="absolute bottom-6 left-8 right-8">
                        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                          {selectedMember.name}
                        </h2>
                        <p className="text-lg text-white/90 drop-shadow-md">
                          {selectedMember.role}
                        </p>
                        {selectedMember.type === 'independent' && selectedMember.businessName && (
                          <p className="text-sm text-white/80 italic mt-1 drop-shadow-md">
                            {selectedMember.businessName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-8 space-y-6">
                      {/* Services - Horizontal scrolling chips */}
                      {(selectedMember.serviceCategories?.length || getTeamMemberCategories(selectedMember.specialties).length > 0) && (
                        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
                          <div className="flex gap-2 min-w-max">
                            {(selectedMember.serviceCategories?.length
                              ? selectedMember.serviceCategories
                              : getTeamMemberCategories(selectedMember.specialties)
                            ).map((category, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 text-xs font-medium bg-dusty-rose/10 text-dune/80 rounded-full whitespace-nowrap"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bio Section */}
                      {selectedMember.bio && (
                        <div>
                          <h3 className="text-lg font-semibold text-dune mb-3">About</h3>
                          <p className="text-dune/70 leading-relaxed">{selectedMember.bio}</p>
                        </div>
                      )}

                      {/* Quote */}
                      {selectedMember.quote && (
                        <div className="bg-sage/10 rounded-2xl p-6 border border-sage/20">
                          <Sparkles className="w-5 h-5 text-sage mb-3" />
                          <p className="text-dune/80 italic">&ldquo;{selectedMember.quote}&rdquo;</p>
                        </div>
                      )}

                      {/* Specialties List */}
                      {selectedMember.specialties.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-dune mb-3">Specialties</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedMember.specialties.map((specialty, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-dusty-rose" />
                                <span className="text-dune/70 text-sm">{specialty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Facts Grid (Desktop Modal) */}
                      {(selectedMember.quickFacts && selectedMember.quickFacts.length > 0) ? (
                        <div>
                          <h3 className="text-lg font-semibold text-dune mb-3">Quick Facts</h3>
                          <QuickFactsGrid facts={selectedMember.quickFacts} />
                        </div>
                      ) : selectedMember.funFact && (
                        /* Fallback to single Fun Fact if no quick facts */
                        <div className="bg-golden/10 rounded-2xl p-6 border border-golden/20">
                          <h3 className="text-sm font-semibold text-dune mb-2">Fun Fact</h3>
                          <p className="text-dune/70">{selectedMember.funFact}</p>
                        </div>
                      )}

                      {/* Contact & Booking */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <a
                          href={`tel:${selectedMember.phone}`}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-dune/20 text-dune hover:bg-cream transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          <span className="font-medium">Call</span>
                        </a>

                        {selectedMember.instagram && (
                          <a
                            href={`https://instagram.com/${selectedMember.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-dune/20 text-dune hover:bg-cream transition-all"
                          >
                            <Instagram className="w-4 h-4" />
                            <span className="font-medium">Instagram</span>
                          </a>
                        )}

                        <a
                          href={selectedMember.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-dusty-rose text-white hover:bg-dusty-rose/90 transition-all"
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">Book Now</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  )
}