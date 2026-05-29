'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Instagram,
  ZoomIn,
  Award,
  FileCheck,
  GraduationCap,
  Trophy,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { QuickFactsGrid, type QuickFact } from '@/components/team/QuickFactCard'
import type { TeamMemberCredential } from '@/db/schema/team_members'

// Local type mirrors the consumer's TeamMember shape — kept in sync intentionally
// so this component can be lifted out of EnhancedTeamSectionClient without a refactor.
export interface TakeoverTeamMember {
  id: number
  uuid?: string
  name: string
  role: string
  type: 'employee' | 'independent'
  businessName?: string
  image: string
  bio?: string
  serviceCategories?: string[]
  specialties: string[]
  funFact?: string
  quickFacts?: QuickFact[]
  credentials?: TeamMemberCredential[] | null
  instagram?: string
  instagramUrl?: string
  bookingUrl: string
  usesLashpopBooking?: boolean
}

export interface PortfolioImage {
  id: string
  url: string
  width?: number
  height?: number
  caption?: string
}

interface MemberTakeoverProps {
  members: TakeoverTeamMember[]
  selectedIndex: number | null
  portfolioImages: PortfolioImage[]
  isLoadingPortfolio: boolean
  onClose: () => void
  onSelectIndex: (idx: number) => void
}

const PLACEHOLDER_IMAGE = '/placeholder-team.svg'
function isPlaceholderImage(src: string) {
  return src.endsWith('.svg') || src.includes('placeholder')
}
function isVagaroPhoto(src: string | undefined | null) {
  return !!src && src.includes('ssl.cf2.rackcdn.com')
}

const CRED_ICON: Record<string, typeof Award> = {
  founder: Sparkles,
  license: FileCheck,
  certification: Award,
  training: BookOpen,
  education: GraduationCap,
  award: Trophy,
}

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

function roleSubtitle(m: TakeoverTeamMember): string {
  if (m.name.toLowerCase().startsWith('emily')) return 'LashPop Studios'
  if (m.type === 'employee') return 'LashPop Studios'
  return m.businessName || 'Independent Artist'
}

export function MemberTakeover({
  members,
  selectedIndex,
  portfolioImages,
  isLoadingPortfolio,
  onClose,
  onSelectIndex,
}: MemberTakeoverProps) {
  const [mounted, setMounted] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number>(-1)
  const [chromeOpaque, setChromeOpaque] = useState(true)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setMounted(true), [])

  const isOpen = selectedIndex !== null
  const member = selectedIndex !== null ? members[selectedIndex] ?? null : null

  // Fade the top dots + close pill out once Corey starts scrolling so they
  // don't overlap content. Threshold matches the mobile carousel.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setChromeOpaque(el.scrollTop < 60)
  }, [])

  useEffect(() => {
    if (!isOpen) setChromeOpaque(true)
  }, [isOpen, selectedIndex])

  // Strip the leading headshot entry — parent prepends it for the carousel,
  // but in the takeover the headshot already lives in the sidebar.
  const workPhotos = useMemo<PortfolioImage[]>(() => {
    return portfolioImages.filter(p => p.id !== 'headshot')
  }, [portfolioImages])

  const lightboxOpen = lightboxIdx >= 0 && lightboxIdx < workPhotos.length

  const goPrev = useCallback(() => {
    if (selectedIndex === null) return
    const next = (selectedIndex - 1 + members.length) % members.length
    setLightboxIdx(-1)
    onSelectIndex(next)
  }, [members.length, onSelectIndex, selectedIndex])

  const goNext = useCallback(() => {
    if (selectedIndex === null) return
    const next = (selectedIndex + 1) % members.length
    setLightboxIdx(-1)
    onSelectIndex(next)
  }, [members.length, onSelectIndex, selectedIndex])

  const goLightboxPrev = useCallback(() => {
    if (workPhotos.length <= 1) return
    setLightboxIdx(prev => (prev - 1 + workPhotos.length) % workPhotos.length)
  }, [workPhotos.length])

  const goLightboxNext = useCallback(() => {
    if (workPhotos.length <= 1) return
    setLightboxIdx(prev => (prev + 1) % workPhotos.length)
  }, [workPhotos.length])

  // Body scroll lock when takeover is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // Layered keyboard handling: lightbox > artist nav.
  //
  // The callback handles are stashed in refs so the listener doesn't have
  // to be re-attached on every parent render (previously the dep array
  // included `onClose`/`goPrev`/`goNext`, all of which are new function
  // refs each render). That re-attach was harmless in theory but produced
  // intermittent "ESC does nothing" reports — likely the cleanup running
  // mid-keypress in some browsers.
  const handlersRef = useRef({ onClose, goPrev, goNext, goLightboxPrev, goLightboxNext, lightboxOpen })
  useEffect(() => {
    handlersRef.current = { onClose, goPrev, goNext, goLightboxPrev, goLightboxNext, lightboxOpen }
  })

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      const h = handlersRef.current
      if (e.key === 'Escape') {
        // Block default browser ESC behavior so e.g. focused inputs in the
        // page underneath don't swallow it.
        e.preventDefault()
        if (h.lightboxOpen) {
          setLightboxIdx(-1)
        } else {
          h.onClose()
        }
        return
      }
      if (h.lightboxOpen) {
        if (e.key === 'ArrowLeft') h.goLightboxPrev()
        if (e.key === 'ArrowRight') h.goLightboxNext()
      } else {
        if (e.key === 'ArrowLeft') h.goPrev()
        if (e.key === 'ArrowRight') h.goNext()
      }
    }
    // Capture phase so we run before any focused element (input, button, iframe
    // proxy) gets a chance to consume the keydown.
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [isOpen])

  if (!mounted || !member) return null

  const prevName = members[(selectedIndex! - 1 + members.length) % members.length]?.name.split(' ')[0]
  const nextName = members[(selectedIndex! + 1) % members.length]?.name.split(' ')[0]

  const handles = parseInstagramHandles(member.instagram, member.instagramUrl)
  const firstHandle = handles[0]

  const categories = member.serviceCategories?.length
    ? member.serviceCategories
    : member.specialties

  const credentials = member.credentials ?? []

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Surface — sits below the site header (z-50), above page content */}
          <motion.div
            key="takeover-surface"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 bg-cream overflow-hidden"
            style={{ top: '80px' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`takeover-content-${member.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full overflow-y-auto"
                ref={scrollRef}
                onScroll={handleScroll}
              >
                <div className="mx-auto grid max-w-[1400px] gap-12 px-8 pb-20 pt-12 lg:gap-24 lg:px-20 lg:pt-14 lg:grid-cols-[38%_62%]">
                  {/* Sidebar — sticky portrait + identity + book */}
                  <aside className="lg:sticky lg:top-14 lg:self-start">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-warm-sand/30 shadow-[0_20px_40px_rgba(45,40,35,0.12)]">
                      <Image
                        src={member.image || PLACEHOLDER_IMAGE}
                        alt={member.name}
                        fill
                        priority
                        className={isPlaceholderImage(member.image || PLACEHOLDER_IMAGE) ? 'object-contain p-8' : 'object-cover object-top'}
                        sizes="(max-width: 1024px) 100vw, 540px"
                        unoptimized={isPlaceholderImage(member.image || PLACEHOLDER_IMAGE) || isVagaroPhoto(member.image)}
                      />
                    </div>

                    <div className="pt-8">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                        {member.role}
                      </p>
                      <h1 className="mt-2.5 font-serif text-5xl font-medium leading-[1.05] text-charcoal">
                        {member.name}
                      </h1>
                      {firstHandle ? (
                        <a
                          href={firstHandle.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-base font-medium text-dusty-rose hover:text-dusty-rose/80 transition-colors"
                        >
                          <Instagram className="h-4 w-4" />
                          @{firstHandle.handle}
                        </a>
                      ) : null}
                      <p className="mt-2 text-sm text-charcoal/55">{roleSubtitle(member)}</p>

                      {member.usesLashpopBooking === false && member.bookingUrl ? (
                        <a
                          href={member.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-dusty-rose px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-dusty-rose/90"
                        >
                          {`Book with ${member.name.split(' ')[0]}`}
                        </a>
                      ) : null}
                    </div>
                  </aside>

                  {/* Main column */}
                  <div className="min-w-0">
                    {member.bio ? (
                      <section className="pb-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                          About
                        </p>
                        <p className="max-w-[62ch] text-lg leading-relaxed text-charcoal/85">
                          {member.bio}
                        </p>
                      </section>
                    ) : null}

                    {credentials.length > 0 ? (
                      <section className="pb-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                          Credentials
                        </p>
                        <ul className="space-y-3">
                          {credentials.map((cred, idx) => {
                            const Icon = CRED_ICON[cred.type] || Award
                            return (
                              <li key={idx} className="flex items-start gap-3 text-charcoal">
                                <Icon className="mt-1 h-4 w-4 flex-shrink-0 text-dusty-rose" />
                                <span className="text-base">
                                  <span className="font-medium">{cred.name}</span>
                                  {cred.issuer ? (
                                    <span className="opacity-50"> · {cred.issuer}</span>
                                  ) : null}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </section>
                    ) : null}

                    {categories && categories.length > 0 ? (
                      <section className="pb-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                          Services
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {categories.map((cat, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-sage/10 px-4 py-2 text-sm font-medium text-charcoal"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {member.quickFacts && member.quickFacts.length > 0 ? (
                      <section className="pb-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                          Get to know {member.name.split(' ')[0]}
                        </p>
                        <QuickFactsGrid facts={member.quickFacts} />
                      </section>
                    ) : member.funFact ? (
                      <section className="pb-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                          Fun Fact
                        </p>
                        <p className="max-w-[62ch] text-lg leading-relaxed text-charcoal/85">
                          {member.funFact}
                        </p>
                      </section>
                    ) : null}

                    <section className="pb-2">
                      <PortfolioBlock
                        photos={workPhotos}
                        loading={isLoadingPortfolio}
                        firstName={member.name.split(' ')[0]}
                        onOpenPhoto={idx => setLightboxIdx(idx)}
                      />
                    </section>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Top indicator — bare dots, viewport-centered, no chrome.
              Each dot is an opaque solid color so it stays legible on any
              scrolling content without needing a backdrop pill. */}
          <motion.div
            key="takeover-indicator"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: lightboxOpen || !chromeOpaque ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, delay: lightboxOpen ? 0 : 0.15 }}
            className="pointer-events-none fixed inset-x-0 z-[45] flex justify-center"
            style={{ top: 'calc(80px + 22px)' }}
          >
            <div className="flex items-center gap-2">
              {members.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === selectedIndex ? 'w-6 bg-dusty-rose' : 'w-1.5 bg-charcoal/35'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Close — X + ESC in a matching cream backdrop */}
          <motion.button
            key="takeover-close"
            initial={{ opacity: 0 }}
            animate={{ opacity: lightboxOpen ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: lightboxOpen ? 0 : 0.15 }}
            onClick={onClose}
            aria-label="Close (ESC)"
            className="fixed right-6 z-[45] flex h-10 w-10 items-center justify-center rounded-full bg-cream/85 text-charcoal/55 backdrop-blur-md hover:text-charcoal transition-opacity"
            style={{
              top: 'calc(80px + 22px)',
              pointerEvents: lightboxOpen ? 'none' : 'auto',
              opacity: chromeOpaque ? 1 : 0.35,
            }}
          >
            <X className="h-4 w-4" />
          </motion.button>

          {/* Artist nav arrows — outer wrapper is pointer-events-none so the
              full 44px hitbox doesn't intercept clicks meant for photos in the
              right/left column of content. Only the visible icon itself takes
              clicks via pointer-events-auto on the inner button. */}
          <motion.div
            key="takeover-prev-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: lightboxOpen ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: lightboxOpen ? 0 : 0.15 }}
            className="group pointer-events-none fixed left-6 z-[45] flex h-11 w-11 items-center justify-center"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous artist"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-charcoal/55 transition-all hover:bg-white/60 hover:text-charcoal"
              style={{ pointerEvents: lightboxOpen ? 'none' : 'auto' }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] tracking-wide text-charcoal/55 opacity-0 transition-opacity group-hover:opacity-100">
              {prevName}
            </span>
          </motion.div>
          <motion.div
            key="takeover-next-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: lightboxOpen ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: lightboxOpen ? 0 : 0.15 }}
            className="group pointer-events-none fixed right-6 z-[45] flex h-11 w-11 items-center justify-center"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <button
              type="button"
              onClick={goNext}
              aria-label="Next artist"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-charcoal/55 transition-all hover:bg-white/60 hover:text-charcoal"
              style={{ pointerEvents: lightboxOpen ? 'none' : 'auto' }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] tracking-wide text-charcoal/55 opacity-0 transition-opacity group-hover:opacity-100">
              {nextName}
            </span>
          </motion.div>

          {/* Portfolio lightbox */}
          <AnimatePresence>
            {lightboxOpen ? (
              <motion.div
                key="lightbox"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-x-0 bottom-0 z-[48] flex items-center justify-center p-20"
                style={{ top: '80px' }}
              >
                {/* Backdrop */}
                <button
                  type="button"
                  aria-label="Close photo"
                  onClick={() => setLightboxIdx(-1)}
                  className="absolute inset-0 cursor-default bg-[rgba(20,15,12,0.85)] backdrop-blur-xl"
                />

                <motion.div
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex max-h-full max-w-full flex-col items-center gap-4"
                >
                  <LightboxPhoto photo={workPhotos[lightboxIdx]} />
                  <p className="text-center text-[13px] tracking-[0.08em] text-white/70">
                    <strong className="font-medium text-white">{member.name}</strong>
                    {' · '}
                    {lightboxIdx + 1} of {workPhotos.length}
                  </p>
                </motion.div>

                <button
                  type="button"
                  onClick={() => setLightboxIdx(-1)}
                  aria-label="Close photo"
                  className="fixed right-6 z-[49] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur hover:bg-white/25 transition-colors"
                  style={{ top: 'calc(80px + 20px)' }}
                >
                  <X className="h-5 w-5" />
                </button>

                {workPhotos.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goLightboxPrev}
                      aria-label="Previous photo"
                      className="fixed left-6 z-[49] flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur transition-all hover:scale-110 hover:bg-white/25"
                      style={{ top: 'calc(50% + 40px)', transform: 'translateY(-50%)' }}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={goLightboxNext}
                      aria-label="Next photo"
                      className="fixed right-6 z-[49] flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur transition-all hover:scale-110 hover:bg-white/25"
                      style={{ top: 'calc(50% + 40px)', transform: 'translateY(-50%)' }}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(overlay, document.body)
}

function PortfolioBlock({
  photos,
  loading,
  firstName,
  onOpenPhoto,
}: {
  photos: PortfolioImage[]
  loading: boolean
  firstName: string
  onOpenPhoto: (idx: number) => void
}) {
  if (loading) {
    return (
      <>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
          Portfolio
        </p>
        <div className="flex items-center justify-center rounded-2xl bg-cream/40 p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dusty-rose border-t-transparent" />
        </div>
      </>
    )
  }

  const count = photos.length
  if (count === 0) {
    return (
      <>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
          Portfolio
        </p>
        <div className="rounded-2xl border border-warm-sand/30 bg-cream/40 p-10 text-center">
          <p className="mb-2 font-serif text-2xl text-charcoal/70">
            {firstName} is just getting started.
          </p>
          <p className="text-sm text-charcoal/50">
            Be one of {firstName}&apos;s first clients to feature here.
          </p>
        </div>
      </>
    )
  }

  const heading = count >= 8 ? 'Selected Work' : count >= 4 ? 'Recent Work' : 'Featured Work'

  // 1-3 photos → uniform-height row, native-aspect widths
  if (count <= 3) {
    return (
      <>
        <div className="mb-5 flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
            {heading}
          </p>
          <span className="text-xs uppercase tracking-wider text-charcoal/40">
            {count} {count === 1 ? 'photo' : 'photos'} · click to enlarge
          </span>
        </div>
        <div className="flex gap-4" style={{ height: 380 }}>
          {photos.map((p, idx) => {
            const ar = p.width && p.height ? `${p.width}/${p.height}` : '1/1'
            return (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => onOpenPhoto(idx)}
                className="group relative overflow-hidden rounded-2xl bg-warm-sand/20 cursor-zoom-in transition-transform hover:scale-[1.02] hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
                style={{ aspectRatio: ar, height: '100%' }}
              >
                <Image
                  src={p.url}
                  alt={`Portfolio ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  unoptimized={isVagaroPhoto(p.url)}
                />
                <span className="pointer-events-none absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <ZoomIn className="h-3.5 w-3.5 text-charcoal" />
                </span>
              </button>
            )
          })}
        </div>
      </>
    )
  }

  // 4+ photos → masonry (2 cols for 4-7, 3 cols for 8+)
  const cols = count >= 8 ? 3 : 2
  return (
    <>
      <div className="mb-5 flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
          {heading}
        </p>
        <span className="text-xs uppercase tracking-wider text-charcoal/40">
          {count} photos · click to enlarge
        </span>
      </div>
      <div style={{ columnCount: cols, columnGap: 14 }}>
        {photos.map((p, idx) => (
          <button
            key={p.id || idx}
            type="button"
            onClick={() => onOpenPhoto(idx)}
            className="group relative mb-3.5 block w-full overflow-hidden rounded-xl bg-warm-sand/20 cursor-zoom-in transition-transform hover:scale-[1.02] hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
            style={{ breakInside: 'avoid' }}
          >
            <Image
              src={p.url}
              alt={`Portfolio ${idx + 1}`}
              width={p.width || 600}
              height={p.height || 600}
              className="block w-full h-auto"
              sizes={cols === 3 ? '(max-width: 1024px) 50vw, 25vw' : '(max-width: 1024px) 50vw, 30vw'}
              unoptimized={isVagaroPhoto(p.url)}
            />
            <span className="pointer-events-none absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5 text-charcoal" />
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function LightboxPhoto({ photo }: { photo: PortfolioImage }) {
  const [loaded, setLoaded] = useState(false)

  // DAM assets store width/height as null, so we can't drive the layout from
  // intrinsic dimensions. Use a plain <img> with max-w / max-h — the browser
  // sizes the element to the source's natural aspect ratio, so there's no
  // dark frame around portrait/square photos. CF Image transformations still
  // happen at the URL level via cdn.lashpopstudios.com (loader replicates
  // src/lib/cf-image-loader.ts for R2 URLs); Vagaro photos pass through.
  const src = (() => {
    const m = photo.url.match(/^https?:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/)
    if (m) {
      return `https://cdn.lashpopstudios.com/cdn-cgi/image/width=1600,quality=85,format=auto,fit=scale-down/${m[1]}`
    }
    return photo.url
  })()

  return (
    <div className="relative">
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        className={`block rounded-lg shadow-[0_30px_80px_rgba(0,0,0,0.5)] transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          maxWidth: 'min(1200px, 92vw)',
          maxHeight: 'calc(100vh - 80px - 200px)',
          width: 'auto',
          height: 'auto',
        }}
      />
      {!loaded ? (
        <div
          aria-hidden
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(2px)',
            animation: 'lightbox-shimmer 1.6s linear infinite',
            backgroundImage:
              'linear-gradient(110deg, rgba(255,255,255,0.04) 8%, rgba(255,255,255,0.12) 18%, rgba(255,255,255,0.04) 33%)',
            backgroundSize: '200% 100%',
            minWidth: '300px',
            minHeight: '300px',
          }}
        />
      ) : null}
      <style jsx>{`
        @keyframes lightbox-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
