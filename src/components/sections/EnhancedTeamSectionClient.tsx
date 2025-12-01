'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Instagram, Phone, Calendar, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext'
import { useInView } from 'framer-motion'
import { gsap, initGSAP } from '@/lib/gsap'

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

  // Navigation functions for swiping between team members
  const goToNextMember = () => {
    const nextIndex = (selectedMemberIndex + 1) % teamMembers.length
    setSwipeDirection('left')
    setSelectedMemberIndex(nextIndex)
    setSelectedMember(teamMembers[nextIndex])
  }

  const goToPrevMember = () => {
    const prevIndex = selectedMemberIndex === 0 ? teamMembers.length - 1 : selectedMemberIndex - 1
    setSwipeDirection('right')
    setSelectedMemberIndex(prevIndex)
    setSelectedMember(teamMembers[prevIndex])
  }

  // Handle selecting a member (also tracks index)
  const handleSelectMember = (member: TeamMember) => {
    const index = teamMembers.findIndex(m => m.id === member.id)
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

  // Auto-select first team member on mobile when section comes into view
  useEffect(() => {
    if (isMobile && isInView && teamMembers.length > 0 && !selectedMember) {
      // Select first member by default on mobile
      setSelectedMemberIndex(0)
      setSelectedMember(teamMembers[0])
    }
  }, [isMobile, isInView, teamMembers, selectedMember])

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
        className="py-20 bg-cream overflow-hidden"
      >
        {/* Mobile Hybrid View: Portrait Strip + Selected Card */}
        {isMobile ? (
          <div className="w-full px-4">
            {/* Horizontal Portrait Strip - All team members visible */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-3 pb-2">
                  {teamMembers.map((member, index) => {
                    const isSelected = selectedMemberIndex === index && selectedMember?.id === member.id
                    return (
                      <motion.button
                        key={member.id}
                        className="flex-shrink-0 flex flex-col items-center gap-1.5"
                        onClick={() => {
                          setSelectedMemberIndex(index)
                          setSelectedMember(member)
                        }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        {/* Circular Avatar */}
                        <div
                          className={`relative w-16 h-16 rounded-full overflow-hidden transition-all duration-300 ${
                            isSelected
                              ? 'ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream scale-110'
                              : 'ring-1 ring-sage/20'
                          }`}
                        >
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                          {/* Highlight indicator */}
                          {isHighlighted(member.id) && !isSelected && (
                            <div className="absolute inset-0 ring-2 ring-dusty-rose rounded-full animate-pulse" />
                          )}
                        </div>
                        {/* Name below avatar */}
                        <span
                          className={`text-[10px] font-medium transition-colors truncate max-w-16 ${
                            isSelected ? 'text-dusty-rose' : 'text-sage'
                          }`}
                        >
                          {member.name.split(' ')[0]}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Selected Member Card */}
            <AnimatePresence mode="wait">
              {selectedMember && (
                <motion.div
                  key={selectedMember.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="cursor-pointer"
                  onClick={() => handleSelectMember(selectedMember)}
                >
                  {/* Card with image and info */}
                  <div className="relative rounded-3xl overflow-hidden shadow-xl bg-white">
                    {/* Image Section */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image
                        src={selectedMember.image}
                        alt={selectedMember.name}
                        fill
                        className="object-cover"
                        priority
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Tap hint */}
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                        <span className="text-white text-xs font-medium">Tap for details</span>
                      </div>

                      {/* Content at bottom of image */}
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-2xl font-serif text-white drop-shadow-lg mb-1">
                          {selectedMember.name}
                        </h3>
                        <p className="text-white/90 text-sm font-medium mb-3">
                          {selectedMember.type === 'independent' && selectedMember.businessName
                            ? selectedMember.businessName
                            : 'LashPop Artist'}
                        </p>

                        {/* Service categories */}
                        {(() => {
                          const memberCategories = selectedMember.serviceCategories?.length
                            ? selectedMember.serviceCategories
                            : getTeamMemberCategories(selectedMember.specialties)
                          return memberCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {memberCategories.slice(0, 4).map((category) => (
                                <span
                                  key={category}
                                  className="px-2.5 py-1 text-[10px] font-medium bg-white/20 backdrop-blur-sm text-white rounded-full"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Quick info section below image */}
                    <div className="p-4 bg-white">
                      {selectedMember.bio && (
                        <p className="text-sage text-sm line-clamp-2 leading-relaxed">
                          {selectedMember.bio}
                        </p>
                      )}

                      {/* Swipe navigation hint */}
                      <div className="flex items-center justify-center gap-2 mt-4 text-sage/60">
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-xs">Select a team member above</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Highlight Effect */}
                    {isHighlighted(selectedMember.id) && (
                      <div className="absolute top-4 left-4 bg-dusty-rose text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        Recommended
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initial state: auto-select first member if none selected */}
            {!selectedMember && teamMembers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-sage"
              >
                <p className="text-sm">Select a team member to learn more</p>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="container px-4">
            {/* Desktop Grid View with Inline Expansion */}
            <div className="max-w-7xl mx-auto">
              {/* Render cards row by row so we can insert expansion after each row */}
              {Array.from({ length: Math.ceil(teamMembers.length / columnsPerRow) }).map((_, rowIndex) => {
                const rowStart = rowIndex * columnsPerRow
                const rowMembers = teamMembers.slice(rowStart, rowStart + columnsPerRow)
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
                            {/* Card Design */}
                            <motion.div
                              className={`relative aspect-[3/4] overflow-hidden rounded-3xl shadow-lg transition-all duration-300 ${
                                isSelected ? 'ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream' : ''
                              }`}
                              whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                              animate={{ scale: isSelected ? 1.02 : 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {/* Image */}
                              <Image
                                src={member.image}
                                alt={member.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                              />

                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                              {/* Content at Bottom */}
                              <div className="absolute inset-x-0 bottom-0 p-4">
                                <h3 className="font-sans font-bold text-white text-lg drop-shadow-lg mb-1.5">
                                  {member.name}
                                </h3>

                                {memberCategories.length > 0 && (
                                  <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                                    <div className="flex gap-1 min-w-max">
                                      {memberCategories.slice(0, 4).map((category, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 text-[9px] font-medium bg-white/15 backdrop-blur-sm text-white/90 rounded-full whitespace-nowrap"
                                        >
                                          {category}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
                                <div className="absolute inset-0 ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream rounded-3xl pointer-events-none" />
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

                                {/* Fun Fact */}
                                {selectedMember.funFact && (
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
                    className="flex flex-col h-full relative"
                    style={{ height: '100dvh' }}
                    onTouchStart={(e) => {
                      const touch = e.touches[0]
                      ;(e.currentTarget as HTMLDivElement).dataset.touchStartX = touch.clientX.toString()
                      ;(e.currentTarget as HTMLDivElement).dataset.touchStartY = touch.clientY.toString()
                    }}
                    onTouchEnd={(e) => {
                      const target = e.currentTarget as HTMLDivElement
                      const startX = parseFloat(target.dataset.touchStartX || '0')
                      const startY = parseFloat(target.dataset.touchStartY || '0')
                      const touch = e.changedTouches[0]
                      const deltaX = touch.clientX - startX
                      const deltaY = touch.clientY - startY

                      // Only trigger swipe if horizontal movement > vertical and exceeds threshold
                      const threshold = 80
                      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > threshold) {
                        if (deltaX > 0) {
                          goToPrevMember()
                        } else {
                          goToNextMember()
                        }
                      }
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
                          {teamMembers.map((_, idx) => (
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

                    {/* Scrollable Content with swipe animation */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedMember.id}
                        className="flex-1 overflow-y-auto overscroll-contain"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                        initial={{ opacity: 0, x: swipeDirection === 'left' ? 100 : swipeDirection === 'right' ? -100 : 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: swipeDirection === 'left' ? -100 : swipeDirection === 'right' ? 100 : 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      >
                        {/* Hero Image Section */}
                        <div className="relative">
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <Image
                              src={selectedMember.image}
                              alt={selectedMember.name}
                              fill
                              className="object-cover"
                              priority
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream via-cream/80 to-transparent" />
                          </div>

                        {/* Info Card - Overlapping the photo */}
                        <div className="relative -mt-16 px-5">
                          <div className="bg-white rounded-3xl shadow-xl p-5 border border-sage/5">
                            {/* Name and affiliation */}
                            <div>
                              <h1 className="font-serif text-2xl text-dune leading-tight">
                                {selectedMember.name}
                              </h1>
                              <p className="text-dusty-rose font-medium text-sm mt-0.5">
                                {selectedMember.type === 'independent' && selectedMember.businessName
                                  ? selectedMember.businessName
                                  : 'LashPop Artist'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Sections */}
                      <div className="px-5 py-6 space-y-6">
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

                        {/* Fun Fact */}
                        {selectedMember.funFact && (
                          <div className="bg-gradient-to-br from-warm-sand/30 to-dusty-rose/10 rounded-2xl p-5">
                            <h3 className="font-serif text-lg text-dune mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-dusty-rose" />
                              Fun Fact
                            </h3>
                            <p className="text-dune/80 text-sm leading-relaxed">{selectedMember.funFact}</p>
                          </div>
                        )}

                        {/* Bottom spacer for safe area */}
                        <div className="h-8 safe-area-bottom" />
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

                      {/* Fun Fact */}
                      {selectedMember.funFact && (
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