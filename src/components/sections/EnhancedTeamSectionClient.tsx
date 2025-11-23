'use client'

import { motion, AnimatePresence, useMotionValue, useTransform, useInView } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Instagram, Phone, Calendar, Star, X, Sparkles, Mail, ChevronLeft, ChevronRight, GripVertical, ArrowLeft } from 'lucide-react'
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext'
import useEmblaCarousel from 'embla-carousel-react'
import { getAssetsByTeamMemberId, type AssetWithTags } from '@/actions/dam'

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
  bio?: string
  quote?: string
  availability?: string
  instagram?: string
  bookingUrl: string
  favoriteServices?: string[]
  funFact?: string
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

export function EnhancedTeamSectionClient({ teamMembers, serviceCategories = [] }: EnhancedTeamSectionClientProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null)
  const [portfolioPhotos, setPortfolioPhotos] = useState<AssetWithTags[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const orchestrator = useBookingOrchestrator()
  const highlights = orchestrator.state.highlights.providers

  // Desktop carousel - dragFree for smooth scrolling
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: true,
    containScroll: false,
    align: 'start',
    skipSnaps: true,
    inViewThreshold: 0.7
  })

  // Mobile carousel - centered with peek, snap scrolling
  const [emblaMobileRef, emblaMobileApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    containScroll: 'trimSnaps',
    skipSnaps: false,
  })

  const isInView = useInView(sectionRef, { once: true, margin: "-20%" })

  useEffect(() => {
    if (sectionRef.current) {
      const unregister = orchestrator.actions.registerSection('team', sectionRef.current)
      return unregister
    }
  }, [orchestrator.actions])

  // Handle trackpad/mouse wheel scrolling
  useEffect(() => {
    if (!emblaApi) return

    const onWheel = (event: WheelEvent) => {
      const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)

      if (isHorizontal) {
        event.preventDefault()

        const engine = (emblaApi as any).internalEngine()

        if (engine && engine.animation && engine.location) {
          engine.scrollBody.useBaseFriction().useDuration(20)
          const delta = event.deltaX * -1
          const target = engine.location.get() + delta
          engine.location.set(target)
          engine.translate.to(target)
          engine.animation.start()
        }
      }
    }

    const viewport = emblaApi.rootNode()
    viewport.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      viewport.removeEventListener('wheel', onWheel)
    }
  }, [emblaApi])

  // Fetch portfolio photos when expanding a card
  const handleExpandCard = async (member: TeamMember) => {
    if (expandedMemberId === member.id) {
      // Close if clicking the same card
      setExpandedMemberId(null)
      setPortfolioPhotos([])
      return
    }

    setExpandedMemberId(member.id)
    setSelectedMember(member)

    // Fetch portfolio photos if member has a uuid
    if (member.uuid) {
      setLoadingPhotos(true)
      try {
        const photos = await getAssetsByTeamMemberId(member.uuid)
        setPortfolioPhotos(photos)
      } catch (error) {
        console.error('Error fetching portfolio:', error)
        setPortfolioPhotos([])
      } finally {
        setLoadingPhotos(false)
      }
    }
  }

  const handleMemberClick = async (member: TeamMember) => {
    // Both desktop and mobile use expanding experience now
    if (expandedMemberId === member.id) {
      setExpandedMemberId(null)
      setPortfolioPhotos([])
      return
    }

    setExpandedMemberId(member.id)
    setSelectedMember(member)

    // Fetch portfolio photos if member has a uuid
    if (member.uuid) {
      setLoadingPhotos(true)
      try {
        const photos = await getAssetsByTeamMemberId(member.uuid)
        setPortfolioPhotos(photos)
      } catch (error) {
        console.error('Error fetching portfolio:', error)
        setPortfolioPhotos([])
      } finally {
        setLoadingPhotos(false)
      }
    }
  }

  const isHighlighted = (memberId: number) => highlights.includes(memberId.toString())

  // Map specialties to service categories
  const getTeamMemberCategories = (specialties: string[]) => {
    // Map common specialty keywords to categories
    const mappings: Record<string, string> = {
      'lash': 'Lashes',
      'extension': 'Lashes',
      'classic': 'Lashes',
      'volume': 'Lashes',
      'hybrid': 'Lashes',
      'mega': 'Lashes',
      'brow': 'Brows',
      'lamination': 'Brows',
      'microblading': 'Brows',
      'threading': 'Brows',
      'lift': 'Lifts',
      'perm': 'Lifts',
      'tint': 'Tinting',
      'dye': 'Tinting',
      'wax': 'Waxing',
      'facial': 'Treatments',
      'treatment': 'Treatments'
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

    return Array.from(categories).slice(0, 3) // Max 3 category chips
  }

  // Duplicate team members for seamless infinite scroll
  const displayMembers = [...teamMembers, ...teamMembers, ...teamMembers]

  return (
    <>
      <section
        ref={sectionRef}
        className="relative py-20 bg-cream overflow-hidden"
      >
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-dune mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Meet Your Artists
          </h2>
          <p className="text-lg text-dune/70 max-w-2xl mx-auto">
            Our talented team of lash artists brings years of experience and passion to create your perfect look.
          </p>
        </motion.div>

        {/* Desktop Carousel */}
        <motion.div
          className="relative w-full hidden md:block"
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            {/* Embla Container */}
            <div className="flex touch-pan-y gap-6 px-4">
              {displayMembers.map((member, index) => {
                const memberCategories = getTeamMemberCategories(member.specialties)

                const isExpanded = expandedMemberId === member.id

                return (
                  <motion.div
                    key={`${member.id}-${index}`}
                    className="flex-[0_0_auto] min-w-0 cursor-pointer group relative"
                    animate={{
                      width: isExpanded ? '640px' : '320px',
                    }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    onClick={() => handleMemberClick(member)}
                    onMouseEnter={() => !isExpanded && setHoveredId(member.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Card with fixed aspect ratio */}
                    <motion.div
                      className="relative overflow-hidden rounded-3xl shadow-lg"
                      style={{
                        aspectRatio: '3/4.5',
                      }}
                      whileHover={!isExpanded ? { y: -4, scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {!isExpanded ? (
                        <>
                          {/* Collapsed State - Normal Card */}
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            sizes="320px"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            draggable={false}
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          {/* Category Chips at Top */}
                          {memberCategories.length > 0 && (
                            <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                              {memberCategories.map((category, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-xs font-medium text-white shadow-sm"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Content at Bottom */}
                          <div className="absolute inset-x-0 bottom-0 p-5">
                            {/* Name and Role */}
                            <div className="space-y-1 mb-3">
                              <h3 className="font-sans font-bold text-white text-lg drop-shadow-lg">
                                {member.name}
                              </h3>
                              <p className="font-sans text-white/90 text-sm drop-shadow-md">
                                {member.role}
                              </p>

                              {/* Business Name for Independents */}
                              {member.type === 'independent' && member.businessName && (
                                <p className="font-sans text-white/80 text-xs italic drop-shadow-md mt-1">
                                  {member.businessName}
                                </p>
                              )}
                            </div>

                            {/* Service Category Chips (smaller) */}
                            {memberCategories.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {memberCategories.map((category, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-sm border border-white/25 text-[10px] font-medium text-white/90"
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Grippy Icon - Bottom Right */}
                          <motion.div
                            className="absolute bottom-4 right-4 pointer-events-none"
                            initial={{ opacity: 0.6 }}
                            whileHover={{ opacity: 1, x: 2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-2 shadow-lg">
                              <GripVertical className="w-4 h-4 text-white" />
                            </div>
                          </motion.div>
                        </>
                      ) : (
                        <>
                          {/* Expanded State - Two Column Layout */}
                          <div className="flex h-full">
                            {/* Left: Image Column */}
                            <div className="relative w-1/2">
                              <Image
                                src={member.image}
                                alt={member.name}
                                fill
                                sizes="320px"
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                              {/* Name overlay on image */}
                              <div className="absolute bottom-5 left-5 right-5">
                                <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                                  {member.name}
                                </h3>
                                <p className="text-sm text-white/90 drop-shadow-md">
                                  {member.role}
                                </p>
                                {member.type === 'independent' && member.businessName && (
                                  <p className="text-xs text-white/80 italic drop-shadow-md mt-0.5">
                                    {member.businessName}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Content Column */}
                            <div className="w-1/2 bg-white overflow-y-auto relative">
                              {/* Close button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedMemberId(null)
                                  setPortfolioPhotos([])
                                  setExpandedPhotoId(null)
                                }}
                                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-cream border border-dune/10 flex items-center justify-center hover:bg-dune/5 transition-colors z-10"
                              >
                                <X className="w-4 h-4 text-dune" />
                              </button>

                              {!expandedPhotoId ? (
                                // Grid View
                                <div className="p-5 space-y-4 mt-2">
                                  {/* Bio */}
                                  {member.bio && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-dune mb-1.5 flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-dusty-rose" />
                                        About
                                      </h4>
                                      <p className="text-[11px] text-dune/70 leading-relaxed">{member.bio}</p>
                                    </div>
                                  )}

                                  {/* Portfolio Album */}
                                  {(loadingPhotos || portfolioPhotos.length > 0) && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-dune mb-2 flex items-center gap-1.5">
                                        <Star className="w-3 h-3 text-golden" />
                                        Portfolio
                                      </h4>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // Full Width Photo View
                                <div className="relative h-full flex flex-col">
                                  {/* Back button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedPhotoId(null)
                                    }}
                                    className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-dune/10 flex items-center justify-center hover:bg-white transition-colors z-10 shadow-md"
                                  >
                                    <ArrowLeft className="w-4 h-4 text-dune" />
                                  </button>

                                  {/* Expanded Photo */}
                                  <div className="relative flex-1">
                                    {portfolioPhotos.find(p => p.id === expandedPhotoId) && (
                                      <Image
                                        src={portfolioPhotos.find(p => p.id === expandedPhotoId)!.filePath}
                                        alt={portfolioPhotos.find(p => p.id === expandedPhotoId)!.altText || 'Portfolio image'}
                                        fill
                                        className="object-contain"
                                      />
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Photo Grid - Edge to Edge */}
                              {!expandedPhotoId && (
                                <div className="w-full">
                                  {loadingPhotos ? (
                                    <div className="grid grid-cols-2 gap-0">
                                      {[...Array(4)].map((_, i) => (
                                        <div key={i} className="aspect-square bg-sage/10 animate-pulse" />
                                      ))}
                                    </div>
                                  ) : portfolioPhotos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-0">
                                      {portfolioPhotos.map((photo) => (
                                        <button
                                          key={photo.id}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setExpandedPhotoId(photo.id)
                                          }}
                                          className="relative aspect-square overflow-hidden group cursor-pointer border border-dune/5 hover:border-dune/20 transition-colors"
                                        >
                                          <Image
                                            src={photo.filePath}
                                            alt={photo.altText || 'Portfolio image'}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Hover Glow Effect */}
                      <AnimatePresence>
                        {hoveredId === member.id && (
                          <motion.div
                            className="absolute inset-0 bg-white/5 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </AnimatePresence>

                      {/* Highlight Ring */}
                      {isHighlighted(member.id) && (
                        <div className="absolute inset-0 ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream rounded-3xl pointer-events-none" />
                      )}
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Gradient edges for seamless look */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-cream to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-cream to-transparent pointer-events-none z-10" />
        </motion.div>

        {/* Mobile Carousel - Centered with Peek Views */}
        <motion.div
          className="relative w-full md:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="overflow-hidden" ref={emblaMobileRef}>
            <div className="flex gap-4 py-4">
              {displayMembers.map((member, index) => {
                const memberCategories = getTeamMemberCategories(member.specialties)

                return (
                  <div
                    key={`${member.id}-${index}`}
                    className="flex-[0_0_82%] min-w-0 relative"
                  >
                    <motion.div
                      onClick={() => handleMemberClick(member)}
                      className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      {/* Image */}
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        sizes="(max-width: 768px) 82vw, 320px"
                        className="object-cover"
                        draggable={false}
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                      {/* Category Chips at Top */}
                      {memberCategories.length > 0 && (
                        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
                          {memberCategories.map((category, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-md border border-white/35 text-[10px] font-medium text-white shadow-sm"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Content at Bottom */}
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="space-y-1">
                          <h3 className="font-sans font-bold text-white text-base drop-shadow-lg">
                            {member.name}
                          </h3>
                          <p className="font-sans text-white/90 text-xs drop-shadow-md">
                            {member.role}
                          </p>
                          {member.type === 'independent' && member.businessName && (
                            <p className="font-sans text-white/80 text-[10px] italic drop-shadow-md">
                              {member.businessName}
                            </p>
                          )}
                        </div>

                        {/* Tap to view indicator */}
                        <div className="flex items-center gap-1.5 mt-3">
                          <div className="flex-1 h-px bg-white/30" />
                          <span className="text-white/70 text-[10px] font-medium">Tap to view</span>
                          <div className="flex-1 h-px bg-white/30" />
                        </div>
                      </div>

                      {/* Highlight Ring */}
                      {isHighlighted(member.id) && (
                        <div className="absolute inset-0 ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream rounded-2xl pointer-events-none" />
                      )}
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Scroll Indicator Dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            {teamMembers.slice(0, Math.min(teamMembers.length, 6)).map((_, idx) => (
              <div
                key={idx}
                className="w-1.5 h-1.5 rounded-full bg-dune/20"
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Mobile Expanding View - Morphs to Full Screen */}
      <AnimatePresence>
        {expandedMemberId !== null && selectedMember && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setExpandedMemberId(null)
                setPortfolioPhotos([])
              }}
            />

            {/* Full Screen Morphing Panel */}
            <motion.div
              className="fixed inset-0 z-50 overflow-y-auto md:hidden bg-white"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Close Button - Top Left */}
              <button
                onClick={() => {
                  setExpandedMemberId(null)
                  setPortfolioPhotos([])
                }}
                className="fixed top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-dune/10 flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-4 h-4 text-dune" />
              </button>

              {/* Hero Image */}
              <div className="relative h-72 bg-gradient-to-br from-sage/20 to-dusty-rose/20">
                <Image
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Name & Role Overlay */}
                <div className="absolute bottom-5 left-5 right-5">
                  <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                    {selectedMember.name}
                  </h2>
                  <p className="text-base text-white/90 drop-shadow-md">
                    {selectedMember.role}
                  </p>
                  {selectedMember.type === 'independent' && selectedMember.businessName && (
                    <p className="text-xs text-white/80 italic drop-shadow-md mt-0.5">
                      {selectedMember.businessName}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-5 py-6 space-y-6">
                {/* Category Chips */}
                {getTeamMemberCategories(selectedMember.specialties).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getTeamMemberCategories(selectedMember.specialties).map((category, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-full bg-dusty-rose/10 border border-dusty-rose/20 text-xs font-medium text-dune"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {selectedMember.bio && (
                  <div>
                    <h3 className="text-base font-semibold text-dune mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-dusty-rose" />
                      About
                    </h3>
                    <p className="text-sm text-dune/70 leading-relaxed">{selectedMember.bio}</p>
                  </div>
                )}

                {/* Quote */}
                {selectedMember.quote && (
                  <div className="bg-sage/5 rounded-xl p-4 border border-sage/10">
                    <p className="text-dune/75 italic text-sm">&ldquo;{selectedMember.quote}&rdquo;</p>
                  </div>
                )}

                {/* Portfolio */}
                <div>
                  <h3 className="text-base font-semibold text-dune mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-golden" />
                    Portfolio
                  </h3>

                  {loadingPhotos ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="aspect-square bg-sage/10 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : portfolioPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {portfolioPhotos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg group">
                          <Image
                            src={photo.filePath}
                            alt={photo.altText || 'Portfolio image'}
                            fill
                            className="object-cover group-active:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-dune/40 text-xs">
                      No portfolio photos yet
                    </div>
                  )}
                </div>

                {/* Specialties */}
                {selectedMember.specialties.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-dune mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.specialties.map((specialty, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-cream rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-dusty-rose" />
                          <span className="text-dune/70 text-xs">{specialty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fun Fact */}
                {selectedMember.funFact && (
                  <div className="bg-golden/5 rounded-xl p-4 border border-golden/10">
                    <h3 className="text-xs font-semibold text-dune/70 mb-1.5">Fun Fact</h3>
                    <p className="text-dune/70 text-sm">{selectedMember.funFact}</p>
                  </div>
                )}

                {/* Contact & Booking - Sticky Bottom */}
                <div className="sticky bottom-0 bg-white pt-4 pb-safe space-y-2.5 border-t border-dune/5">
                  <div className="flex gap-2.5">
                    <a
                      href={`tel:${selectedMember.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-cream border border-dune/10 text-dune active:scale-95 transition-transform"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="font-medium text-xs">Call</span>
                    </a>

                    {selectedMember.instagram && (
                      <a
                        href={`https://instagram.com/${selectedMember.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-cream border border-dune/10 text-dune active:scale-95 transition-transform"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span className="font-medium text-xs">Instagram</span>
                      </a>
                    )}
                  </div>

                  <a
                    href={selectedMember.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-dusty-rose text-white active:scale-95 transition-transform shadow-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium text-sm">Book with {selectedMember.name.split(' ')[0]}</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}