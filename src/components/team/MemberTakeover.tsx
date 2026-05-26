'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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

  useEffect(() => setMounted(true), [])

  const isOpen = selectedIndex !== null
  const member = selectedIndex !== null ? members[selectedIndex] ?? null : null

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

  // Layered keyboard handling: lightbox > artist nav
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxIdx(-1)
        else onClose()
        return
      }
      if (lightboxOpen) {
        if (e.key === 'ArrowLeft') goLightboxPrev()
        if (e.key === 'ArrowRight') goLightboxNext()
      } else {
        if (e.key === 'ArrowLeft') goPrev()
        if (e.key === 'ArrowRight') goNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, lightboxOpen, goPrev, goNext, goLightboxPrev, goLightboxNext, onClose])

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

          {/* Top indicator — pagination dots + active member name, centered below header */}
          <motion.div
            key="takeover-indicator"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: lightboxOpen ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, delay: lightboxOpen ? 0 : 0.15 }}
            className="fixed left-1/2 z-[45] flex -translate-x-1/2 items-center gap-3 rounded-full border border-terracotta/15 bg-white/95 px-[18px] py-2 shadow-[0_6px_20px_rgba(0,0,0,0.08)] backdrop-blur"
            style={{ top: 'calc(80px + 16px)', pointerEvents: lightboxOpen ? 'none' : 'auto' }}
          >
            <div className="flex gap-1.5">
              {members.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === selectedIndex ? 'w-[18px] bg-dusty-rose' : 'w-1.5 bg-charcoal/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs tracking-wide text-charcoal">
              <strong className="font-semibold text-charcoal">{member.name}</strong>
              <span className="text-charcoal/50"> · {selectedIndex! + 1} of {members.length}</span>
            </span>
          </motion.div>

          {/* Close button — top right, X + ESC keyboard hint */}
          <motion.button
            key="takeover-close"
            initial={{ opacity: 0 }}
            animate={{ opacity: lightboxOpen ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: lightboxOpen ? 0 : 0.15 }}
            onClick={onClose}
            aria-label="Close (ESC)"
            className="group fixed right-6 z-[45] flex items-center gap-2 rounded-full border border-terracotta/15 bg-white/95 py-2 pl-2.5 pr-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur hover:bg-white transition-colors"
            style={{ top: 'calc(80px + 16px)', pointerEvents: lightboxOpen ? 'none' : 'auto' }}
          >
            <X className="h-4 w-4 text-dune" />
            <span className="rounded-md border border-charcoal/15 bg-cream/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-charcoal/70 group-hover:bg-cream">
              ESC
            </span>
          </motion.button>

          {/* Artist nav arrows */}
          <motion.button
            key="takeover-prev"
            initial={{ opacity: 0 }}
            animate={{ opacity: lightboxOpen ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: lightboxOpen ? 0 : 0.15 }}
            onClick={goPrev}
            aria-label="Previous artist"
            className="group fixed left-6 z-[45] flex h-14 w-14 items-center justify-center rounded-full border border-terracotta/15 bg-white/85 text-dune shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur transition-all hover:scale-110 hover:bg-white"
            style={{ top: '50%', transform: 'translateY(-50%)', pointerEvents: lightboxOpen ? 'none' : 'auto' }}
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-xs text-charcoal shadow-md opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
              Prev: {prevName}
            </span>
          </motion.button>
          <motion.button
            key="takeover-next"
            initial={{ opacity: 0 }}
            animate={{ opacity: lightboxOpen ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: lightboxOpen ? 0 : 0.15 }}
            onClick={goNext}
            aria-label="Next artist"
            className="group fixed right-6 z-[45] flex h-14 w-14 items-center justify-center rounded-full border border-terracotta/15 bg-white/85 text-dune shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur transition-all hover:scale-110 hover:bg-white"
            style={{ top: '50%', transform: 'translateY(-50%)', pointerEvents: lightboxOpen ? 'none' : 'auto' }}
          >
            <ChevronRight className="h-6 w-6" />
            <span className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-xs text-charcoal shadow-md opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
              Next: {nextName}
            </span>
          </motion.button>

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
  const ar = photo.width && photo.height ? photo.width / photo.height : 1
  // Maximize photo size while preserving aspect — calc(100vh - header - padding - caption)
  return (
    <div
      className="relative max-h-full max-w-full"
      style={{ aspectRatio: ar, maxHeight: 'calc(100vh - 80px - 200px)' }}
    >
      <Image
        src={photo.url}
        alt=""
        fill
        priority
        className="rounded-lg object-contain shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        sizes="90vw"
        unoptimized={isVagaroPhoto(photo.url)}
      />
    </div>
  )
}
