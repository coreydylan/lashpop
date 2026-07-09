'use client'

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import cfImageLoader from '@/lib/cf-image-loader'
import { Instagram, Phone, Calendar, Star, X, Sparkles, Mail, ChevronLeft, ChevronRight, Hand, Check, UserPlus, Award, FileCheck, GraduationCap, Trophy, BookOpen } from 'lucide-react'
import { useBookingOrchestrator } from '@/contexts/BookingOrchestratorContext'
import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { useInView } from 'framer-motion'
import { QuickFactsGrid, QuickFactCard, type QuickFact } from '@/components/team/QuickFactCard'
import type { TeamMemberCredential } from '@/db/schema/team_members'
import { MemberTakeover } from '@/components/team/MemberTakeover'

const CRED_ICON: Record<string, typeof Award> = {
  founder: Sparkles,
  license: FileCheck,
  certification: Award,
  training: BookOpen,
  education: GraduationCap,
  award: Trophy,
}

function MemberCredentialsList({ credentials }: { credentials?: TeamMemberCredential[] | null }) {
  if (!credentials || credentials.length === 0) return null
  return (
    <div className="mb-6">
      <h3 className="font-serif text-lg mb-3" style={{ color: 'rgb(61, 54, 50)' }}>Credentials</h3>
      <ul className="space-y-2">
        {credentials.map((cred, idx) => {
          const Icon = CRED_ICON[cred.type] || Award
          return (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-sm leading-snug"
              style={{ color: 'rgb(61, 54, 50)' }}
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-dusty-rose" />
              <span>
                <span className="font-medium">{cred.name}</span>
                {cred.issuer && (
                  <span className="opacity-60"> &middot; {cred.issuer}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Parse an instagram field that may contain multiple handles separated by / or ,
// Returns an array of { handle, url } objects (without @ prefix on handle).
// If overrideUrl is provided, the FIRST handle's url is replaced with it
// (label still rendered from the handle string). Used to point an IG link at
// a specific highlight/reel URL while keeping the @handle display.
function parseInstagramHandles(
  value?: string | null,
  overrideUrl?: string | null
): Array<{ handle: string; url: string }> {
  if (!value) return []
  const items = value
    .split(/[\/,]/)
    .map(s => s.trim().replace(/^@+/, ''))
    .filter(s => s.length > 0)
    .map(handle => ({ handle, url: `https://instagram.com/${handle}` }))
  if (overrideUrl && items.length > 0) {
    items[0] = { ...items[0], url: overrideUrl }
  }
  return items
}

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

// Horizontally scrollable chip row for desktop team cards.
// - Trackpad: native horizontal scroll (overflow-x-auto handles 2-finger swipe).
// - Mouse: click and drag to scroll, with `cursor-grab` affordance.
// - Suppresses the card click when a drag actually moved the row, so dragging
//   to peek at chips doesn't accidentally open the member modal.
function DraggableChipRow({ categories }: { categories: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasMoved: false })
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [categories])

  return (
    <div
      className="absolute top-3 left-4 right-4 z-20"
      onClick={(e) => {
        if (dragState.current.hasMoved) {
          e.stopPropagation()
          dragState.current.hasMoved = false
        }
      }}
    >
      <div
        ref={scrollRef}
        className={`overflow-x-auto scrollbar-hide ${isOverflowing ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={(e) => {
          const el = scrollRef.current
          if (!el || !isOverflowing) return
          e.preventDefault()
          dragState.current = {
            isDown: true,
            startX: e.pageX - el.offsetLeft,
            scrollLeft: el.scrollLeft,
            hasMoved: false,
          }
        }}
        onMouseMove={(e) => {
          if (!dragState.current.isDown) return
          const el = scrollRef.current
          if (!el) return
          const x = e.pageX - el.offsetLeft
          const walk = x - dragState.current.startX
          if (Math.abs(walk) > 3) dragState.current.hasMoved = true
          el.scrollLeft = dragState.current.scrollLeft - walk
        }}
        onMouseUp={() => {
          dragState.current.isDown = false
        }}
        onMouseLeave={() => {
          dragState.current.isDown = false
        }}
      >
        <div className="flex flex-nowrap gap-1.5 w-max">
          {categories.map((category, idx) => (
            <span
              key={idx}
              className="text-xs font-sans font-light px-3 py-1 bg-cream text-dune rounded-full whitespace-nowrap select-none"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </div>
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
  instagramUrl?: string
  bookingUrl: string
  usesLashpopBooking?: boolean
  favoriteServices?: string[]
  funFact?: string
  quickFacts?: QuickFact[]
  credentials?: TeamMemberCredential[]
  // Photo crop URLs for different formats
  cropSquareUrl?: string
  cropCloseUpCircleUrl?: string
  cropMediumCircleUrl?: string
  cropFullVerticalUrl?: string
}

const PLACEHOLDER_IMAGE = "/placeholder-team.svg"
function isPlaceholderImage(src: string) {
  return src.endsWith('.svg') || src.includes('placeholder')
}
// Vagaro CDN photos are served via Rackspace as multi-MB "/Original/" JPEGs.
// They now route through the lashpop-img worker (cf-image-loader handles
// *.rackcdn.com), so they get resized + AVIF like everything else.
function isVagaroPhoto(src: string | undefined | null) {
  return !!src && src.includes('ssl.cf2.rackcdn.com')
}

interface PortfolioImage {
  id: string
  url: string
  width?: number
  height?: number
  caption?: string
  blurDataUrl?: string | null
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
  // Team members are already sorted by displayOrder from the database
  // Order can be managed via admin panel at /admin/website/team
  const sortedTeamMembers = teamMembers

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
  const [mobileChromeOpaque, setMobileChromeOpaque] = useState(true)

  // Reset chrome fade whenever the active member changes or the modal opens
  // so the dots are visible again on the new stylist's intro.
  useEffect(() => {
    setMobileChromeOpaque(true)
  }, [selectedMemberIndex, showModal])
  const sectionRef = useRef<HTMLElement>(null)
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null)
  const firstCardRef = useRef<HTMLDivElement>(null)

  // Cache for preloaded portfolio photos (keyed by member UUID)
  const preloadedPhotosCache = useRef<Map<string, PortfolioImage[]>>(new Map())

  // NOTE: Previously this section had an IntersectionObserver-driven entry
  // snap (mobile only) that called container.scrollTo({behavior:'smooth'})
  // the moment the section crossed into the viewport, anchoring it ~3% from
  // top. On fast downward swipes that hijacked iOS momentum scroll — the
  // page would visibly decelerate and stop on the team section, exactly
  // like a brake had been applied. Removed entirely; user owns the scroll.

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

  // Fetch portfolio images when a member is selected (both mobile and desktop)
  useEffect(() => {
    if (selectedMember?.uuid) {
      setCurrentImageIndex(0)

      // Check if we already have cached photos from preloading
      const cachedPhotos = preloadedPhotosCache.current.get(selectedMember.uuid)
      if (cachedPhotos) {
        setPortfolioImages(cachedPhotos)
        setIsLoadingPortfolio(false)
        return
      }

      setIsLoadingPortfolio(true)

      // Headshot is always the first image in the carousel.
      const headshot: PortfolioImage = {
        id: 'headshot',
        url: selectedMember.image,
      }

      // Fetch DAM assets tagged to this team member
      fetch(`/api/dam/team/${selectedMember.uuid}/photos`)
        .then(res => res.json())
        .then(data => {
          const workImages: PortfolioImage[] = (data.photos || []).map((photo: any, index: number) => ({
            id: photo.id || `photo-${index}`,
            url: photo.filePath,
            width: photo.width,
            height: photo.height,
            caption: photo.caption,
            blurDataUrl: photo.blurDataUrl,
          }))
          const images = [headshot, ...workImages]
          setPortfolioImages(images)
          if (selectedMember.uuid) {
            preloadedPhotosCache.current.set(selectedMember.uuid, images)
          }
        })
        .catch(() => setPortfolioImages([headshot]))
        .finally(() => setIsLoadingPortfolio(false))
    } else {
      setPortfolioImages([])
    }
  }, [selectedMember?.uuid])

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

  // Preload portfolio photos on hover (desktop only)
  const preloadPhotosForMember = useCallback((memberUuid: string | undefined, headshotUrl: string) => {
    if (!memberUuid || isMobile || preloadedPhotosCache.current.has(memberUuid)) return

    const headshot: PortfolioImage = { id: 'headshot', url: headshotUrl }

    // Fetch photos in the background
    fetch(`/api/dam/team/${memberUuid}/photos`)
      .then(res => res.json())
      .then(data => {
        const workImages: PortfolioImage[] = (data.photos || []).map((photo: any, index: number) => ({
          id: photo.id || `photo-${index}`,
          url: photo.filePath,
          width: photo.width,
          height: photo.height,
          caption: photo.caption,
          blurDataUrl: photo.blurDataUrl,
        }))
        const images = [headshot, ...workImages]
        preloadedPhotosCache.current.set(memberUuid, images)

        // Also preload the work image files (headshot is typically already
        // shown elsewhere). Preload the worker-optimized variant, not the raw
        // original — raw DAM/Vagaro URLs are multi-MB and aren't even the URL
        // the drawer's <Image> will request.
        workImages.forEach(img => {
          const link = document.createElement('link')
          link.rel = 'preload'
          link.as = 'image'
          link.href = cfImageLoader({ src: img.url, width: 1200 })
          document.head.appendChild(link)
        })
      })
      .catch(() => {
        preloadedPhotosCache.current.set(memberUuid, [headshot])
      })
  }, [isMobile])

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
      'brow': 'Brows',
      'lamination': 'Brows',
      'microblading': 'Brows',
      'threading': 'Brows',
      'lift': 'Lash Lifts',
      'perm': 'Lash Lifts',
      'tint': 'Tinting',
      'dye': 'Tinting',
      'wax': 'Waxing',
      'facial': 'Skincare',
      'hydrafacial': 'Skincare',
      'dermaplaning': 'Skincare',
      'skin': 'Skincare',
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
        className="relative py-12 md:py-20 overflow-x-hidden"
        style={{ backgroundColor: '#f0e0db' }}
      >
        {/* Section Header */}
        <div className="text-center mb-12 px-4">
          <h2
            className="text-2xl md:text-5xl font-display font-medium tracking-wide mb-6"
            style={{ color: '#cc947f' }}
          >
            Find Your Stylist
          </h2>
          <div className="w-24 h-px bg-terracotta/30 mx-auto mb-6" />
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-base md:text-lg leading-relaxed text-pretty" style={{ color: '#cc947f' }}>
              LashPop Studios is home to a collective of independent beauty businesses, each offering their own services, pricing, schedules,&nbsp;and&nbsp;policies.
            </p>
            <p className="text-xs md:text-sm leading-relaxed uppercase tracking-wider font-medium mt-10" style={{ color: '#cc947f' }}>
              <span className="font-semibold block md:inline">Click the profiles</span>
              <span className="block md:inline"> below to find a stylist that fits your vibe.</span>
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

                  // Last card alone in a 2-col mobile row — center it instead of stranding left
                  const isLastOrphan = index === sortedTeamMembers.length - 1 && sortedTeamMembers.length % 2 === 1

                  // Vagaro is source of truth for staff photos. member.image is already
                  // resolved Vagaro-first by the server (with local imageUrl as fallback).
                  // Local DAM cropSquareUrl is only used if member.image is empty.
                  const cardImage: string = member.image || member.cropSquareUrl || PLACEHOLDER_IMAGE
                  const isPlaceholder = isPlaceholderImage(cardImage)

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
                      className={`cursor-pointer ${isLastOrphan ? 'col-span-2 flex justify-center' : ''}`}
                      style={isLastOrphan ? { width: '100%' } : undefined}
                    >
                      {/* Arch Card Container */}
                      <div
                        className="relative flex flex-col h-full bg-ivory rounded-[20px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 active:scale-[0.98] border border-terracotta/10"
                        style={isLastOrphan ? { width: 'calc(50% - 0.375rem)' } : undefined}
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
                      {/* Service Tags - Horizontally scrollable row */}
                      {memberCategories.length > 0 && (
                        <div className="absolute top-2 left-0 right-0 px-3 z-20">
                          <div
                            data-tags-scroll
                            className="overflow-x-auto scrollbar-hide"
                          >
                            <div className="flex gap-1 min-w-max">
                              {memberCategories.slice(0, 4).map((category, idx) => (
                                <span
                                  key={`${member.id}-cat-${idx}`}
                                  className="px-2 py-0.5 text-xs font-sans font-normal bg-cream text-charcoal rounded-full whitespace-nowrap"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Arch Image Container */}
                      <div className="relative px-3 pt-6">
                        <div className="relative h-48 overflow-hidden rounded-t-full rounded-b-lg bg-stone-100">
                          <Image
                            src={cardImage}
                            alt={member.name}
                            fill
                            // Fade in on load instead of snapping in — Vagaro
                            // photos are unoptimized hotlinks with no blur
                            // placeholder, so without the fade the gray
                            // skeleton flips to a full-color photo abruptly.
                            //
                            // object-top: Vagaro source photos vary in
                            // framing — some are wide (Ava/Rachel/Evie), some
                            // are tight crops where the subject's face sits in
                            // the upper third (Emily, Bethany, Kelly, etc).
                            // With default object-position 50% 50%, the arched
                            // slot lands on the chest/torso band of tight
                            // crops and the face is gone, reading as "blurry
                            // and zoomed in". Anchoring to top preserves the
                            // face across all framing styles (matches the
                            // takeover hero, which already does this).
                            className={`${isPlaceholder ? "object-contain p-4" : "object-cover object-top"} transition-opacity duration-300 opacity-0`}
                            onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                            // Each card occupies ~50vw on mobile and ~25vw on
                            // desktop. The previous 155px static hint was
                            // under-fetching on 3x displays, causing the
                            // "blurry on mobile" complaint.
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            unoptimized={isPlaceholder}
                          />
                        </div>
                      </div>

                      {/* Content Below Image */}
                      <div className="px-4 py-3 text-center">
                        {/* Name */}
                        <h3 className="text-lg font-serif font-light text-gray-900 mb-0.5 truncate">
                          {displayName}
                        </h3>

                        {/* Title/Role — reserve 2 lines so a wrapping role doesn't push siblings out of alignment */}
                        <p className="text-xs font-sans font-light text-gray-500 line-clamp-2 leading-tight min-h-[2lh]">
                          {member.name.toLowerCase().startsWith('emily')
                            ? 'LashPop Owner'
                            : member.type === 'employee'
                              ? 'LashPop Team Artist'
                              : member.businessName || 'Independent Artist'}
                        </p>
                      </div>

                      {/* Bottom IG section — single row, multi-handle joined with · so every footer has identical height */}
                      {(() => {
                        const handles = parseInstagramHandles(member.instagram, member.instagramUrl)
                        if (handles.length === 0) return null
                        const isMulti = handles.length > 1
                        return (
                          <div className="mt-auto w-full border-t border-warm-sand/40 bg-white/30 h-9 px-2 flex items-center justify-center gap-1.5">
                            {handles.map(({ handle, url }, i) => (
                              <React.Fragment key={handle}>
                                {i > 0 && <span className="text-dusty-rose/50 text-[11px] leading-none">·</span>}
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  onTouchEnd={(e) => {
                                    e.stopPropagation()
                                    window.open(url, '_blank')
                                  }}
                                  className="flex items-center gap-1 min-w-0 active:opacity-70 transition-opacity"
                                >
                                  <Instagram className="w-3 h-3 text-dusty-rose flex-shrink-0" />
                                  <span className={`${isMulti ? 'text-[9px]' : 'text-[10px]'} font-sans font-medium tracking-wide text-dusty-rose truncate`}>
                                    {handle}
                                  </span>
                                </a>
                              </React.Fragment>
                            ))}
                          </div>
                        )
                      })()}

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
            {/* Desktop Grid — full-page takeover opens on click */}
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedTeamMembers.map((member, absoluteIndex) => {
                  const memberCategories = member.serviceCategories?.length
                    ? member.serviceCategories
                    : getTeamMemberCategories(member.specialties)
                  const isSelected = selectedMember?.id === member.id
                  const indexInRow = absoluteIndex % columnsPerRow
                  // A solo card in the final row of the responsive grid used to
                  // be re-positioned to col-start-2 to "center" it, but the
                  // resulting layout read as off — the orphan looked stranded
                  // in column 2 with empty space to her left. The grid already
                  // starts a new row in column 1 by default, so dropping the
                  // override lets the orphan land left-aligned (col-start-1)
                  // matching the rest of the page's reading rhythm.
                  // (Variable kept for now in case we want a different
                  // treatment later; nothing reads it.)
                  const isLastOrphan = absoluteIndex === sortedTeamMembers.length - 1 && sortedTeamMembers.length % columnsPerRow === 1

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 60, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{
                        duration: 0.7,
                        delay: indexInRow * 0.12,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      className="relative group cursor-pointer"
                      onClick={() => handleMemberClick(member, absoluteIndex)}
                      onMouseEnter={() => {
                        setHoveredId(member.id)
                        preloadPhotosForMember(member.uuid, member.image)
                      }}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <motion.div
                        className={`relative flex flex-col h-full bg-ivory rounded-[20px] overflow-hidden shadow-md transition-all duration-300 border border-terracotta/10 ${
                          isSelected ? 'ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream' : ''
                        }`}
                        whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                        animate={{ scale: isSelected ? 1.02 : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {memberCategories.length > 0 && (
                          <DraggableChipRow categories={memberCategories} />
                        )}

                        <div className="relative px-4 pt-8">
                          <div className="relative h-72 overflow-hidden rounded-t-full rounded-b-lg bg-stone-100">
                            <Image
                              src={member.image}
                              alt={member.name}
                              fill
                              // Fade in on load instead of snapping — see
                              // mobile-card variant above for rationale.
                              // object-top — same reason as mobile: Vagaro
                              // source photos vary in framing tightness and
                              // a centered crop drops the face out of the
                              // arched slot on tightly-framed portraits.
                              className={`${isPlaceholderImage(member.image) ? "object-contain p-6" : "object-cover object-top transition-transform duration-700 group-hover:scale-105"} transition-opacity duration-300 opacity-0`}
                              onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                              unoptimized={isPlaceholderImage(member.image)}
                            />
                          </div>
                        </div>

                        <div className="px-6 py-5 text-center">
                          <h3 className="text-2xl font-serif font-light text-gray-900 mb-1 truncate">
                            {member.name}
                          </h3>
                          {/* Reserve 2 lines so wrapping roles can't push siblings out of vertical alignment */}
                          <p className="font-sans font-light text-gray-500 line-clamp-2 leading-tight min-h-[2lh]">
                            {member.name.toLowerCase().startsWith('emily')
                              ? 'LashPop Owner'
                              : member.type === 'employee'
                                ? 'LashPop Team Artist'
                                : member.businessName || 'Independent Artist'}
                          </p>
                        </div>

                        {(() => {
                          const handles = parseInstagramHandles(member.instagram, member.instagramUrl)
                          if (handles.length === 0) return null
                          const isMulti = handles.length > 1
                          return (
                            <div className="mt-auto w-full border-t border-warm-sand/40 bg-white/30 h-11 px-3 flex items-center justify-center gap-2 hover:bg-white/50 transition-colors">
                              {handles.map(({ handle, url }, i) => (
                                <React.Fragment key={handle}>
                                  {i > 0 && <span className="text-dusty-rose/50 text-sm leading-none">·</span>}
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 min-w-0 hover:opacity-70 transition-opacity"
                                  >
                                    <Instagram className="w-3.5 h-3.5 text-dusty-rose flex-shrink-0" />
                                    <span className={`${isMulti ? 'text-[10px]' : 'text-xs'} font-sans font-medium tracking-wide text-dusty-rose truncate`}>
                                      {handle}
                                    </span>
                                  </a>
                                </React.Fragment>
                              ))}
                            </div>
                          )
                        })()}

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

                        {isHighlighted(member.id) && !isSelected && (
                          <div className="absolute inset-0 ring-2 ring-dusty-rose ring-offset-2 ring-offset-cream rounded-[20px] pointer-events-none" />
                        )}
                      </motion.div>
                    </motion.div>
                  )
                })}

              </div>
            </div>
          </div>
        )}

        {/* Join The Team CTA */}
        <div className="text-center px-4 mt-12 md:mt-20">
          <a
            href="/work-with-us"
            className="inline-block px-6 py-3 md:px-8 md:py-3.5 rounded-full border-2 transition-all duration-300 hover:bg-[#ac4d3c] hover:text-white hover:border-[#ac4d3c]"
            style={{
              borderColor: '#ac4d3c',
              color: '#ac4d3c',
            }}
          >
            <span className="text-sm font-medium tracking-[0.1em] uppercase">
              Join The Team
            </span>
          </a>
        </div>

        {/* Team Group Photo - Full Width, taller crop */}
        <div className="mt-12 md:mt-20">
          <div className="relative w-full overflow-hidden aspect-[767/409] max-h-[820px]">
            <Image
              src="/lashpop-images/team/team-group-photo.jpg"
              alt="The LashPop Studios team"
              fill
              priority={false}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* Desktop full-page takeover — renders behind the site header (z-50) */}
      <MemberTakeover
        members={sortedTeamMembers}
        selectedIndex={selectedMember && !isMobile ? selectedMemberIndex : null}
        portfolioImages={portfolioImages}
        isLoadingPortfolio={isLoadingPortfolio}
        onClose={() => setSelectedMember(null)}
        onSelectIndex={(idx) => {
          const m = sortedTeamMembers[idx]
          if (m) {
            setSelectedMemberIndex(idx)
            setSelectedMember(m)
          }
        }}
      />

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
                {isMobile && (
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

                      // Once we've moved enough to decide direction, lock it in.
                      // 25px raises the bar above casual taps/scrolls so a tiny drift
                      // doesn't get misread as a member-change swipe.
                      if (target.dataset.isHorizontalSwipe === 'undecided' && (deltaX > 25 || deltaY > 25)) {
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
                      const threshold = 120
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

                        {/* Pagination dots — fade out after 60px scroll so
                            they stop overlapping content. */}
                        <div
                          className="flex items-center gap-1.5 transition-opacity duration-300"
                          style={{ opacity: mobileChromeOpaque ? 1 : 0 }}
                        >
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
                          {(() => {
                            const handles = parseInstagramHandles(selectedMember.instagram, selectedMember.instagramUrl)
                            if (handles.length === 0) return null
                            return handles.map((h) => (
                              <a
                                key={h.handle}
                                href={h.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`@${h.handle} on Instagram`}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md"
                              >
                                <Instagram className="w-5 h-5 text-white" />
                              </a>
                            ))
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Base background - prevents flash during image swap */}
                    <div className="absolute inset-0 z-0 bg-cream" />

                    {/* Fixed Hero Image - crossfades between team members, with photo carousel */}
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
                          <div
                            className="relative h-[70vh] overflow-hidden"
                            // NOTE: Touch handlers for the photo carousel
                            // (swipe to cycle photos, tap to advance) used to
                            // live on this element. They were unreachable —
                            // the scrollable content overlay (z-10) covers
                            // the entire takeover including the visible photo
                            // area, so hit-testing routed every touch to the
                            // content layer (z-10) instead of the photo zone
                            // (z-[1]). The handlers have been moved to the
                            // 65vh spacer inside the content overlay (below),
                            // where they actually receive the user's touches.
                            // See the spacer for the live handlers.
                          >
                            {/* Photo carousel - swipe or tap to cycle album photos */}
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={portfolioImages.length > 0 ? `photo-${currentImageIndex}` : 'headshot'}
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                {(() => {
                                  const curPhoto = portfolioImages.length > 0 ? portfolioImages[currentImageIndex] : null
                                  const drawerSrc = portfolioImages.length > 0 ? portfolioImages[currentImageIndex]?.url : selectedMember.image
                                  const isPlaceholder = isPlaceholderImage(drawerSrc)
                                  // The headshot (index 0) is framed to fill the
                                  // hero — keep object-cover/object-top. Work
                                  // photos (index > 0) are tight close-ups of
                                  // lash/brow work and get butchered by cover
                                  // crop in a 70vh portrait frame, so we show
                                  // them WHOLE via object-contain and fill the
                                  // letterbox with a blurred copy of the same
                                  // image (ambient backdrop). One extra render
                                  // per swap, same URL → browser cache hits.
                                  const isHeadshot = currentImageIndex === 0
                                  const useContain = !isPlaceholder && !isHeadshot
                                  return (
                                    <>
                                      {useContain && (
                                        <Image
                                          src={drawerSrc}
                                          alt=""
                                          aria-hidden
                                          fill
                                          priority
                                          className="object-cover scale-110 blur-2xl opacity-60"
                                        />
                                      )}
                                      <Image
                                        src={drawerSrc}
                                        alt={selectedMember.name}
                                        fill
                                        className={
                                          isPlaceholder
                                            ? "object-contain p-8"
                                            : useContain
                                              ? "object-contain"
                                              : "object-cover object-top"
                                        }
                                        priority
                                        placeholder={curPhoto?.blurDataUrl ? 'blur' : 'empty'}
                                        blurDataURL={curPhoto?.blurDataUrl ?? undefined}
                                        unoptimized={isPlaceholder}
                                      />
                                    </>
                                  )
                                })()}
                              </motion.div>
                            </AnimatePresence>

                            {/* Photo indicator - subtle tap hint when multiple photos */}
                            {portfolioImages.length > 1 && (
                              <div className="absolute bottom-12 left-0 right-0 z-10 flex justify-center">
                                <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                                  <span className="text-white/90 text-[10px] font-sans">{currentImageIndex + 1}/{portfolioImages.length}</span>
                                </div>
                              </div>
                            )}

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
                          setMobileChromeOpaque(target.scrollTop < 60)
                        }}
                      >
                        {/* Spacer to position content below the image initially.
                            ALSO owns the photo-carousel touch handlers — this
                            spacer sits ABOVE the visible photo (the content
                            overlay covers the whole takeover at z-10, so this
                            spacer is the real hit-target for any touch that
                            visually lands on the photo). The handlers used to
                            live on the photo zone itself, but the photo zone
                            is at z-[1] under this overlay and never receives
                            touches. That's why horizontal swipes on the
                            portrait kept bubbling up to the outer wrapper and
                            advancing the stylist instead of cycling photos.

                            Horizontal-swipe behavior:
                            - Cycles portfolio photos when there are >1.
                            - Always stopPropagation on touchstart so the
                              outer member-swipe wrapper never sees a "start"
                              in this band — even on single-photo stylists,
                              a horizontal swipe over the portrait must NOT
                              switch stylist.
                            Vertical-swipe behavior:
                            - Touches still bubble for vertical motion (we
                              only stopPropagation on touchstart/end, and the
                              browser handles native scroll independently of
                              React event propagation), so dragging up to
                              read the bio still scrolls normally. */}
                        <div
                          className="h-[65vh]"
                          onTouchStart={(e) => {
                            // Always stop the start from reaching the outer
                            // member-swipe wrapper. Without a recorded start,
                            // the outer wrapper's touchend has no anchor for
                            // its threshold check and the member doesn't
                            // switch — even if subsequent moves leak through.
                            e.stopPropagation()
                            const touch = e.touches[0]
                            const target = e.currentTarget as HTMLDivElement
                            target.dataset.photoStartX = touch.clientX.toString()
                            target.dataset.photoStartY = touch.clientY.toString()
                            target.dataset.photoGesture = 'undecided'
                          }}
                          onTouchMove={(e) => {
                            // Stop ALL moves from bubbling. Native scroll is
                            // a browser behavior tied to the event itself,
                            // not React's synthetic-event tree, so blocking
                            // React propagation does not block vertical
                            // scroll. We block propagation so the outer
                            // member-swipe wrapper — which fell back to
                            // startX=0 when its own touchstart never fired —
                            // can't misread a vertical drag as a giant
                            // horizontal swipe and switch stylists.
                            e.stopPropagation()
                            const target = e.currentTarget as HTMLDivElement
                            const startX = parseFloat(target.dataset.photoStartX || '0')
                            const startY = parseFloat(target.dataset.photoStartY || '0')
                            const touch = e.touches[0]
                            const deltaX = Math.abs(touch.clientX - startX)
                            const deltaY = Math.abs(touch.clientY - startY)
                            if (target.dataset.photoGesture === 'undecided' && (deltaX > 12 || deltaY > 12)) {
                              target.dataset.photoGesture = deltaX > deltaY ? 'horizontal' : 'vertical'
                            }
                          }}
                          onTouchEnd={(e) => {
                            // Always stop the end too — paired with
                            // touchstart/move stopPropagation, this guarantees
                            // the outer member-swipe wrapper never gets a
                            // complete touch sequence from a gesture that
                            // started over the photo zone.
                            e.stopPropagation()
                            const target = e.currentTarget as HTMLDivElement
                            const gesture = target.dataset.photoGesture
                            const startX = parseFloat(target.dataset.photoStartX || '0')
                            const touch = e.changedTouches[0]
                            const deltaX = touch.clientX - startX
                            if (gesture === 'horizontal') {
                              if (portfolioImages.length > 1 && Math.abs(deltaX) > 50) {
                                if (deltaX < 0) {
                                  setCurrentImageIndex(prev => (prev + 1) % portfolioImages.length)
                                } else {
                                  setCurrentImageIndex(prev => (prev - 1 + portfolioImages.length) % portfolioImages.length)
                                }
                              }
                            } else if (gesture === 'undecided' && portfolioImages.length > 1) {
                              // True tap — cycle forward
                              setCurrentImageIndex(prev => (prev + 1) % portfolioImages.length)
                            }
                          }}
                        />

                        {/* All content wrapped together */}
                        <div className="relative">
                          {/* Fade the hero photo into the cream content. Sits ABOVE the
                              name block (negative top) so the block's own cream backing
                              can begin exactly at the name — see the note on the block. */}
                          <div className="absolute inset-x-0 -top-20 h-20 bg-gradient-to-t from-cream to-transparent pointer-events-none z-0" />

                          {/* Name and biz — solid cream backing. This used to float
                              transparently on the gradient, but a stylist with a SECOND
                              Instagram handle wraps the subtitle to two lines on narrower
                              phones, growing this block past the fixed-height gradient and
                              letting the hero photo bleed through behind the text. Backing
                              it with cream masks the photo at any block height or width. */}
                          <div className="relative px-5 pb-4 pointer-events-auto z-10 bg-cream">
                            <h1 className="font-serif text-3xl leading-tight" style={{ color: 'rgb(61, 54, 50)' }}>
                              <span className="font-bold">{selectedMember.name.split(' ')[0]}</span>{selectedMember.name.includes(' ') ? ` ${selectedMember.name.split(' ').slice(1).join(' ')}` : ''}
                            </h1>
                            {(() => {
                              const handles = parseInstagramHandles(selectedMember.instagram, selectedMember.instagramUrl)
                              const label = selectedMember.type === 'independent' && selectedMember.businessName
                                ? selectedMember.businessName
                                : 'LashPop Artist'
                              if (handles.length === 0) {
                                return (
                                  <p className="font-sans text-xs uppercase tracking-wider font-medium text-dusty-rose mt-1.5">
                                    {label}
                                  </p>
                                )
                              }
                              return (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                  {handles.map((h, idx) => (
                                    <a
                                      key={h.handle}
                                      href={h.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 font-sans text-dusty-rose hover:text-dusty-rose/80 transition-colors"
                                    >
                                      <Instagram className="w-3.5 h-3.5" />
                                      <span className="text-xs uppercase tracking-wider font-medium">{idx === 0 ? label : `@${h.handle}`}</span>
                                    </a>
                                  ))}
                                </div>
                              )
                            })()}
                          </div>

                          {/* Portfolio Image Thumbnails - below Instagram, above About */}
                          {/* bg-cream here so the dimmed (opacity-70) non-active thumbs
                              dim against cream instead of letting the hero photo behind
                              the modal bleed through them as a faux panorama. */}
                          {portfolioImages.length > 1 && (
                            <div className="relative px-5 pb-4 pointer-events-auto z-10 bg-cream">
                              <div
                                className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1 touch-pan-x"
                                // Any horizontal scroll on this thumbnail strip
                                // bubbles up to the outer mobile member-swipe
                                // wrapper. Isolate the touches so a sideways
                                // drag on the strip cycles thumbs without
                                // flipping the active stylist.
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                              >
                                {portfolioImages.map((img, idx) => (
                                  <button
                                    key={img.id || `thumb-${idx}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCurrentImageIndex(idx)
                                    }}
                                    className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-cream transition-all duration-200 ${
                                      idx === currentImageIndex
                                        ? 'ring-2 ring-dusty-rose ring-offset-1 ring-offset-cream scale-105'
                                        : 'opacity-70 hover:opacity-100'
                                    }`}
                                  >
                                    <Image
                                      src={img.url}
                                      alt={`Photo ${idx + 1}`}
                                      fill
                                      className="object-cover"
                                      sizes="56px"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Content Sections */}
                          <div className="relative px-5 pb-6 space-y-6 bg-cream pointer-events-auto z-0">
                          {/* Bio Section */}
                          {selectedMember.bio && (
                            <div>
                              <h3 className="font-serif text-lg mb-3" style={{ color: 'rgb(61, 54, 50)' }}>About</h3>
                              <p className="leading-relaxed text-sm" style={{ color: 'rgb(61, 54, 50)' }}>{selectedMember.bio}</p>
                            </div>
                          )}

                          {/* Credentials */}
                          <MemberCredentialsList credentials={selectedMember.credentials} />

                          {/* Services */}
                          {(selectedMember.serviceCategories?.length || getTeamMemberCategories(selectedMember.specialties).length > 0) && (
                            <div>
                              <h3 className="font-serif text-lg mb-3" style={{ color: 'rgb(61, 54, 50)' }}>Services</h3>
                              <div
                                className="overflow-x-auto scrollbar-hide -mx-1 px-1 touch-pan-x"
                                // Same isolation as the portfolio thumb strip
                                // — horizontal scroll on the chip row should
                                // never bubble out as a member-swipe.
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                              >
                                <div className="flex gap-1.5 min-w-max">
                                  {(selectedMember.serviceCategories?.length
                                    ? selectedMember.serviceCategories
                                    : getTeamMemberCategories(selectedMember.specialties)
                                  ).map((category, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 text-xs font-medium bg-sage/10 rounded-full whitespace-nowrap"
                                      style={{ color: 'rgb(61, 54, 50)' }}
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
                              <h3 className="font-serif text-lg mb-3" style={{ color: 'rgb(61, 54, 50)' }}>
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
                                          key={fact.id || `quickfact-${index}`}
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
                              <h3 className="font-serif text-lg mb-2 flex items-center gap-2" style={{ color: 'rgb(61, 54, 50)' }}>
                                <Sparkles className="w-4 h-4 text-dusty-rose" />
                                Get to know {selectedMember.name.split(' ')[0]}
                              </h3>
                              <p className="text-sm leading-relaxed" style={{ color: 'rgb(61, 54, 50)' }}>{selectedMember.funFact}</p>
                            </div>
                          )}

                            {/* External "Book with {firstName}" CTA — only
                                renders when this stylist books outside the
                                Lashpop Vagaro instance (e.g. Grace). */}
                            {selectedMember.usesLashpopBooking === false && selectedMember.bookingUrl ? (
                              <div className="pt-2">
                                <a
                                  href={selectedMember.bookingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full text-center rounded-full bg-dusty-rose px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-dusty-rose/90"
                                >
                                  {`Book with ${selectedMember.name.split(' ')[0]}`}
                                </a>
                              </div>
                            ) : null}

                            {/* Bottom spacer for safe area */}
                            <div className="h-8 safe-area-bottom" />
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
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