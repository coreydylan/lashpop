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
import { useAdminMode } from '@/contexts/AdminModeContext'
import { Editable } from '@/components/admin-mode/Editable'
import { EditableList } from '@/components/admin-mode/EditableList'
import { EditableImage } from '@/components/admin-mode/EditableImage'
import { StaffGalleryEditor, type PhotoItem } from '@/components/admin-mode/StaffGalleryEditor'

const CRED_TYPES: TeamMemberCredential['type'][] = [
  'certification', 'license', 'training', 'award', 'education', 'founder',
]

// Quick-fact types + their default labels, mirrored from QuickFactCard's
// DEFAULT_LABELS so the editor's type chips read the same as the public render.
const QUICK_FACT_LABELS: Record<string, string> = {
  coffee: 'Go-To Coffee',
  drink: 'Favorite Drink',
  tv_show: 'Favorite TV Show',
  movie: 'Favorite Movie',
  hobby: 'Hobby',
  hidden_talent: 'Hidden Talent',
  fun_fact: 'Fun Fact',
  pet: 'Pet',
  music: 'Favorite Music',
  food: 'Favorite Food',
  book: 'Favorite Book',
  travel: 'Dream Destination',
  sport: 'Sport',
  zodiac: 'Zodiac Sign',
  custom: 'Quick Fact',
}
const QUICK_FACT_TYPES: string[] = Object.keys(QUICK_FACT_LABELS)

/** PATCH a single team member field via the (now auth-guarded) admin endpoint. */
async function patchTeamMember(uuid: string | undefined, payload: Record<string, unknown>) {
  if (!uuid) throw new Error('Missing member id')
  const res = await fetch('/api/admin/website/team', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId: uuid, ...payload }),
  })
  if (!res.ok) {
    const m = await res.json().catch(() => null)
    throw new Error(m?.error || 'Failed to save')
  }
}

/** A quick fact as edited inline. `id` is absent for freshly-added rows. */
interface EditableQuickFact {
  id?: string
  factType: string
  value: string
  customLabel?: string | null
}

/**
 * Persist a whole quick-facts list for one member by diffing `next` against the
 * server's current `prev`.
 *
 * The /quick-facts endpoint is per-row (POST create / PUT update / DELETE) plus
 * a PATCH reorder — there is no single whole-list replace. EditableList hands us
 * the full ordered list on save, so we translate that into the minimal set of
 * row calls: delete rows that vanished, create rows without an id, update
 * changed rows, then PATCH the final id order so displayOrder matches the UI.
 */
async function saveQuickFacts(
  uuid: string | undefined,
  prev: QuickFact[],
  next: EditableQuickFact[]
) {
  if (!uuid) throw new Error('Missing member id')

  const post = async (path: string, method: string, body: unknown) => {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const m = await res.json().catch(() => null)
      throw new Error(m?.error || 'Failed to save quick facts')
    }
    return res.json().catch(() => null)
  }

  const base = '/api/admin/website/team/quick-facts'

  // 1) Delete rows that are no longer present.
  const keptIds = new Set(next.map(f => f.id).filter(Boolean) as string[])
  for (const old of prev) {
    if (!keptIds.has(old.id)) {
      await post(`${base}?id=${encodeURIComponent(old.id)}`, 'DELETE', {})
    }
  }

  // 2) Create new rows / update changed ones, tracking the resolved id order.
  const prevById = new Map(prev.map(f => [f.id, f]))
  const orderedIds: string[] = []
  for (const fact of next) {
    const factType = fact.factType || 'custom'
    const value = fact.value ?? ''
    const customLabel = fact.customLabel ?? null
    if (!fact.id) {
      const created = await post(base, 'POST', {
        teamMemberId: uuid,
        factType,
        value,
        customLabel,
      })
      const newId = created?.fact?.id
      if (newId) orderedIds.push(newId)
    } else {
      const before = prevById.get(fact.id)
      const changed =
        !before ||
        before.factType !== factType ||
        before.value !== value ||
        (before.customLabel ?? null) !== customLabel
      if (changed) {
        await post(base, 'PUT', { id: fact.id, factType, value, customLabel })
      }
      orderedIds.push(fact.id)
    }
  }

  // 3) Persist the final order so displayOrder reflects the on-screen sequence.
  if (orderedIds.length > 0) {
    await post(base, 'PATCH', { teamMemberId: uuid, factIds: orderedIds })
  }
}

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
  // Inline-admin override context.
  bioOverride?: boolean
  vagaroBio?: string
  imageOverride?: boolean
  vagaroPhotoUrl?: string
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
  const { enabled: adminEnabled, refresh: adminRefresh } = useAdminMode()

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

  // Admin-mode gallery state. Seeded from the public `workPhotos` so the grid
  // paints instantly (source defaults to 'album'), then replaced by the real
  // dual-sourced list from the photos endpoint, which carries the `source` each
  // per-photo tool branches on. Public (non-admin) render never touches this.
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoItem[]>([])
  useEffect(() => {
    setGalleryPhotos(
      workPhotos.map(p => ({
        id: p.id,
        fileName: '',
        filePath: p.url,
        width: p.width ?? null,
        height: p.height ?? null,
        caption: p.caption ?? null,
        isPrimary: false,
        source: 'album' as const,
      }))
    )
  }, [workPhotos])

  const refreshGallery = useCallback(async () => {
    if (!member?.uuid) return
    try {
      const res = await fetch(`/api/dam/team/${encodeURIComponent(member.uuid)}/photos`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data?.photos)) {
        setGalleryPhotos(data.photos as PhotoItem[])
      }
    } catch {
      // Non-fatal: keep the current grid; the editor surfaces its own errors.
    }
    // Also re-pull the admin context so any cross-surface caches refresh.
    adminRefresh()
  }, [member?.uuid, adminRefresh])

  // When admin mode is on, pull the accurate dual-sourced list once per member.
  useEffect(() => {
    if (adminEnabled && member?.uuid) void refreshGallery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEnabled, member?.uuid])

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
                      {adminEnabled ? (
                        <EditableImage
                          id={`portrait-${member.uuid}`}
                          label={`${member.name.split(' ')[0]} — portrait`}
                          src={member.image || PLACEHOLDER_IMAGE}
                          alt={member.name}
                          className="!block h-full w-full"
                          unoptimized={isPlaceholderImage(member.image || PLACEHOLDER_IMAGE) || isVagaroPhoto(member.image)}
                          damFilterTags={['team']}
                          vagaro={
                            member.vagaroPhotoUrl
                              ? {
                                  isOverridden: !!member.imageOverride,
                                  onUseVagaro: async () => {
                                    await patchTeamMember(member.uuid, { imageOverride: false })
                                    adminRefresh()
                                  },
                                }
                              : undefined
                          }
                          onReplace={async asset => {
                            await patchTeamMember(member.uuid, {
                              imageUrl: asset.filePath,
                              imageOverride: true,
                            })
                            adminRefresh()
                          }}
                        />
                      ) : (
                        <Image
                          src={member.image || PLACEHOLDER_IMAGE}
                          alt={member.name}
                          fill
                          priority
                          className={isPlaceholderImage(member.image || PLACEHOLDER_IMAGE) ? 'object-contain p-8' : 'object-cover object-top'}
                          sizes="(max-width: 1024px) 100vw, 540px"
                          unoptimized={isPlaceholderImage(member.image || PLACEHOLDER_IMAGE) || isVagaroPhoto(member.image)}
                        />
                      )}
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
                    {member.bio || adminEnabled ? (
                      <section className="pb-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                          About
                        </p>
                        <Editable
                          id={`bio-${member.uuid}`}
                          label={`${member.name.split(' ')[0]} — bio`}
                          kind="multiline"
                          as="p"
                          className="max-w-[62ch] text-lg leading-relaxed text-charcoal/85"
                          value={member.bio ?? ''}
                          placeholder="Add a bio…"
                          onSave={async next => {
                            // Clearing the field reverts to the Vagaro bio rather than
                            // pinning an empty override that would hide the About section.
                            if (next.trim() === '' && member.vagaroBio) {
                              await patchTeamMember(member.uuid, { bioOverride: false })
                            } else {
                              await patchTeamMember(member.uuid, { bio: next })
                            }
                          }}
                          editorNote={
                            !member.bioOverride && member.vagaroBio
                              ? 'Vagaro currently provides this bio. Saving will override it on the site.'
                              : undefined
                          }
                          editorAction={
                            member.bioOverride && member.vagaroBio
                              ? {
                                  label: 'Revert to Vagaro',
                                  onClick: async () => {
                                    await patchTeamMember(member.uuid, { bioOverride: false })
                                    adminRefresh()
                                  },
                                }
                              : undefined
                          }
                        />
                      </section>
                    ) : null}

                    {credentials.length > 0 || adminEnabled ? (
                      <section className="pb-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                          Credentials
                        </p>
                        {adminEnabled ? (
                          <EditableList<TeamMemberCredential>
                            id={`credentials-${member.uuid}`}
                            label={`${member.name.split(' ')[0]} — credentials`}
                            items={credentials}
                            getKey={c => `${c.type}:${c.name}`}
                            noun="credential"
                            mode="card"
                            validateRow={c => (c.name.trim() ? null : 'Name is required')}
                            onSave={async next => {
                              await patchTeamMember(member.uuid, { credentials: next })
                            }}
                            makeNew={() => ({ type: 'certification', name: '' })}
                            describeForDelete={c => (c.name ? `"${c.name}"` : 'this credential')}
                            renderRow={cred => {
                              const Icon = CRED_ICON[cred.type] || Award
                              return (
                                <span className="flex items-start gap-3 text-charcoal">
                                  <Icon className="mt-1 h-4 w-4 flex-shrink-0 text-dusty-rose" />
                                  <span className="text-base">
                                    <span className="font-medium">{cred.name || 'Untitled credential'}</span>
                                    {cred.issuer ? <span className="opacity-50"> · {cred.issuer}</span> : null}
                                  </span>
                                </span>
                              )
                            }}
                            renderEditor={({ draft, set }) => (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {CRED_TYPES.map(t => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => set({ type: t })}
                                      className={`min-h-0 rounded-full px-2.5 py-1 text-xs capitalize ${
                                        draft.type === t ? 'bg-dusty-rose text-white' : 'bg-stone-100 text-stone-600'
                                      }`}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  value={draft.name}
                                  onChange={e => set({ name: e.target.value })}
                                  placeholder="Name (e.g. Licensed Esthetician)"
                                  className="w-full rounded border border-stone-300 p-2 text-sm text-stone-900"
                                />
                                <input
                                  value={draft.issuer ?? ''}
                                  onChange={e => set({ issuer: e.target.value })}
                                  placeholder="Issued by (optional)"
                                  className="w-full rounded border border-stone-300 p-2 text-sm text-stone-900"
                                />
                              </div>
                            )}
                          />
                        ) : (
                          <ul className="space-y-3">
                            {credentials.map((cred, idx) => {
                              const Icon = CRED_ICON[cred.type] || Award
                              return (
                                <li key={idx} className="flex items-start gap-3 text-charcoal">
                                  <Icon className="mt-1 h-4 w-4 flex-shrink-0 text-dusty-rose" />
                                  <span className="text-base">
                                    <span className="font-medium">{cred.name}</span>
                                    {cred.issuer ? <span className="opacity-50"> · {cred.issuer}</span> : null}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
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

                    {adminEnabled ? (
                      <section className="pb-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
                          Get to know {member.name.split(' ')[0]}
                        </p>
                        <EditableList<EditableQuickFact>
                          id={`quickfacts-${member.uuid}`}
                          label={`${member.name.split(' ')[0]} — quick facts`}
                          items={(member.quickFacts ?? []).map(f => ({
                            id: f.id,
                            factType: f.factType,
                            value: f.value,
                            customLabel: f.customLabel ?? null,
                          }))}
                          getKey={f => f.id ?? `new:${f.factType}:${f.value}`}
                          noun="quick fact"
                          mode="card"
                          onSave={async next => {
                            await saveQuickFacts(member.uuid, member.quickFacts ?? [], next)
                          }}
                          makeNew={() => ({ factType: 'custom', value: '', customLabel: null })}
                          describeForDelete={f =>
                            f.value ? `"${f.value}"` : 'this quick fact'
                          }
                          renderRow={fact => (
                            <span className="flex items-baseline gap-2 text-charcoal">
                              <span className="text-xs font-medium uppercase tracking-wider text-dusty-rose">
                                {fact.customLabel || QUICK_FACT_LABELS[fact.factType] || 'Quick fact'}
                              </span>
                              <span className="text-base">{fact.value || 'Untitled fact'}</span>
                            </span>
                          )}
                          renderEditor={({ draft, set }) => (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {QUICK_FACT_TYPES.map(t => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => set({ factType: t })}
                                    className={`min-h-0 rounded-full px-2.5 py-1 text-xs ${
                                      draft.factType === t
                                        ? 'bg-dusty-rose text-white'
                                        : 'bg-stone-100 text-stone-600'
                                    }`}
                                  >
                                    {QUICK_FACT_LABELS[t] ?? t}
                                  </button>
                                ))}
                              </div>
                              <input
                                value={draft.customLabel ?? ''}
                                onChange={e => set({ customLabel: e.target.value || null })}
                                placeholder={`Label (optional, defaults to "${
                                  QUICK_FACT_LABELS[draft.factType] ?? 'Quick fact'
                                }")`}
                                className="w-full rounded border border-stone-300 p-2 text-sm text-stone-900"
                              />
                              <input
                                value={draft.value}
                                onChange={e => set({ value: e.target.value })}
                                placeholder="Value (e.g. Oat-milk latte)"
                                className="w-full rounded border border-stone-300 p-2 text-sm text-stone-900"
                              />
                            </div>
                          )}
                        />
                      </section>
                    ) : member.quickFacts && member.quickFacts.length > 0 ? (
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
                        <Editable
                          id={`funfact-${member.uuid}`}
                          label={`${member.name.split(' ')[0]} — fun fact`}
                          kind="multiline"
                          as="p"
                          className="max-w-[62ch] text-lg leading-relaxed text-charcoal/85"
                          value={member.funFact ?? ''}
                          placeholder="Add a fun fact…"
                          onSave={async next => {
                            await patchTeamMember(member.uuid, { funFact: next })
                          }}
                        />
                      </section>
                    ) : null}

                    <section className="pb-2">
                      {adminEnabled ? (
                        <StaffGalleryEditor
                          teamMemberId={member.uuid!}
                          photos={galleryPhotos}
                          onRefresh={refreshGallery}
                        />
                      ) : (
                        <PortfolioBlock
                          photos={workPhotos}
                          loading={isLoadingPortfolio}
                          firstName={member.name.split(' ')[0]}
                          onOpenPhoto={idx => setLightboxIdx(idx)}
                        />
                      )}
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
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
        unoptimized={isVagaroPhoto(photo.url)}
      />
    </div>
  )
}
