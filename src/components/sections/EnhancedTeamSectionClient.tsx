'use client'

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Instagram, Phone, Calendar, Star, X, Sparkles, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext'
import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { useInView } from 'framer-motion'

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
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-20%" })

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

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member)
    setShowModal(true)
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

  return (
    <>
      <section
        ref={sectionRef}
        className="py-20 bg-cream overflow-hidden"
      >
        {/* Mobile Carousel View */}
        {isMobile ? (
          <div className="relative w-full">
            {/* Embla Viewport */}
            <div className="overflow-hidden" ref={emblaRef}>
              {/* Embla Container */}
              <div className="flex touch-pan-y gap-4 px-4">
                {teamMembers.map((member, index) => {
                  const memberCategories = getTeamMemberCategories(member.specialties)

                  return (
                    <motion.div
                      key={member.id}
                      className="flex-[0_0_auto] w-72 cursor-grab active:cursor-grabbing"
                      initial={{ opacity: 0, x: 50 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.1,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      onClick={() => handleMemberClick(member)}
                    >
                      {/* Frosted Glass Card - Taller format */}
                      <div className="relative h-[500px] rounded-3xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] group">
                        {/* Clear Background Image - NO BLUR */}
                        <div className="absolute inset-0">
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                          {/* Subtle gradient only at bottom for readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        </div>

                        {/* Floating Glass Content Container - ONLY ON BOTTOM */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          {/* Frosted glass background for content only */}
                          <div className="absolute inset-0 bg-white/15 backdrop-blur-xl rounded-t-3xl border-t border-white/30 shadow-2xl" />

                          {/* Content */}
                          <div className="relative space-y-3">
                            {/* Category Chips */}
                            {memberCategories.length > 0 && (
                              <div className="flex gap-2 mb-3 flex-wrap">
                                {memberCategories.map((category) => (
                                  <span
                                    key={category}
                                    className="px-3 py-1.5 text-xs font-semibold bg-white/25 backdrop-blur-md text-white rounded-full border border-white/40 shadow-lg"
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Name and Role */}
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                                {member.name}
                              </h3>
                              <p className="text-white/90 text-sm drop-shadow-md">
                                {member.role}
                              </p>
                              {member.businessName && (
                                <p className="text-white/70 text-xs mt-1 drop-shadow-sm">
                                  {member.businessName}
                                </p>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 pt-2">
                              {member.instagram && (
                                <button
                                  className="p-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/25 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`https://instagram.com/${member.instagram}`, '_blank')
                                  }}
                                >
                                  <Instagram size={16} />
                                </button>
                              )}
                              <button
                                className="flex-1 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium text-sm hover:bg-white/30 transition-all"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(member.bookingUrl, '_blank')
                                }}
                              >
                                Book Now
                              </button>
                            </div>

                            {/* Hover Indicator */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white/80 text-xs">
                                Tap for details
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Highlight Effect */}
                        {isHighlighted(member.id) && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-t from-dusty-rose/30 to-transparent animate-pulse" />
                            <div className="absolute top-4 right-4 bg-dusty-rose text-white px-3 py-1 rounded-full text-xs font-medium">
                              Recommended
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Gradient edges for seamless look */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-cream to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-cream to-transparent pointer-events-none z-10" />
          </div>
        ) : (
          <div className="container px-4">
            {/* Desktop Grid View - Keep existing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {teamMembers.map((member, index) => {
              const memberCategories = getTeamMemberCategories(member.specialties)

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  className="relative group cursor-pointer"
                  onClick={() => handleMemberClick(member)}
                  onMouseEnter={() => setHoveredId(member.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Larger Card with Room for Tags */}
                  <motion.div
                    className="relative aspect-[3/4.5] overflow-hidden rounded-3xl shadow-lg"
                    whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Image */}
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Subtle Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Category Chips at Top */}
                    {memberCategories.length > 0 && (
                      <motion.div
                        className="absolute top-4 left-4 right-4 flex flex-wrap gap-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {memberCategories.map((category, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-xs font-medium text-white shadow-sm"
                          >
                            {category}
                          </span>
                        ))}
                      </motion.div>
                    )}

                    {/* Content at Bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      {/* Name and Role */}
                      <div className="space-y-1">
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

                      {/* Quick Actions - Always Visible */}
                      <motion.div
                        className="flex gap-2 mt-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMemberClick(member)
                          }}
                          className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-medium text-white hover:bg-white/30 transition-all"
                        >
                          View Profile
                        </button>
                        <a
                          href={member.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-full bg-dusty-rose/80 backdrop-blur-md border border-dusty-rose/40 text-xs font-medium text-white hover:bg-dusty-rose/90 transition-all"
                        >
                          Book Now
                        </a>
                      </motion.div>
                    </div>

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
        )}
      </section>

      {/* Team Member Modal */}
      <AnimatePresence>
        {showModal && selectedMember && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />

            {/* Modal Content */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
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
                  {/* Category Tags */}
                  {getTeamMemberCategories(selectedMember.specialties).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getTeamMemberCategories(selectedMember.specialties).map((category, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 rounded-full bg-dusty-rose/10 border border-dusty-rose/20 text-sm font-medium text-dune"
                        >
                          {category}
                        </span>
                      ))}
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
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}