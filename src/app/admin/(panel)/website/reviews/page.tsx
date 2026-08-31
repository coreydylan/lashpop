"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Settings,
  Star,
} from 'lucide-react'

import ReviewEditDrawer, { type ReviewRow } from './ReviewEditDrawer'

interface Review {
  id: string
  source: string
  sourceUrl: string
  reviewerName: string
  subject: string | null
  reviewText: string
  rating: number
  reviewDate: string | null
  isSelected: boolean
  displayOrder: number
  isLiveAuto?: boolean
  qualityScore?: number | null
  editorNotes?: string | null
  showOnWebsite?: boolean | null
  hiddenReason?: string | null
  teamMemberId?: string | null
  adminLockedFields?: string[] | null
}

type FilterSource = 'all' | 'google' | 'yelp' | 'vagaro'

interface TeamOption {
  id: string
  name: string
  isActive: boolean
}

const SOURCE_OPTIONS: Array<{ value: FilterSource; label: string }> = [
  { value: 'all', label: 'All sources' },
  { value: 'google', label: 'Google' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'vagaro', label: 'Vagaro' },
]

const reviewDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export default function ReviewsManagerPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [filterSource, setFilterSource] = useState<FilterSource>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([])
  const [editing, setEditing] = useState<Review | null>(null)
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [openActions, setOpenActions] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchTeamOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/website/team')
      if (!response.ok) return
      const data = await response.json()
      const list = (data?.teamMembers ?? data?.members ?? data ?? []) as Array<{
        id: string
        name: string
        isActive?: boolean
        is_active?: boolean
      }>
      setTeamOptions(
        list.map((member) => ({
          id: member.id,
          name: member.name,
          isActive: member.isActive ?? member.is_active ?? true,
        })),
      )
    } catch {
      // Team assignment remains optional if this supporting request fails.
    }
  }, [])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const response = await fetch('/api/admin/website/reviews')
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Reviews could not be loaded.')
      }

      const allReviews = (data.reviews || []) as Review[]
      const selectedIds = (data.selectedIds || []) as string[]
      const marked = allReviews.map((review) => ({
        ...review,
        isSelected: selectedIds.includes(review.id),
      }))

      setSelectedReviews(
        marked
          .filter((review) => review.isSelected)
          .sort((first, second) => first.displayOrder - second.displayOrder),
      )
      setReviews(marked.filter((review) => !review.isSelected))
      setHasChanges(false)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Reviews could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchReviews()
    void fetchTeamOptions()
  }, [fetchReviews, fetchTeamOptions])

  const allReviews = useMemo(() => [...selectedReviews, ...reviews], [reviews, selectedReviews])

  const filteredReviews = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return reviews.filter((review) => {
      const matchesSource = filterSource === 'all' || review.source.toLowerCase() === filterSource
      const matchesSearch =
        normalizedQuery === '' ||
        review.reviewerName.toLowerCase().includes(normalizedQuery) ||
        review.reviewText.toLowerCase().includes(normalizedQuery)

      return matchesSource && matchesSearch
    })
  }, [filterSource, reviews, searchQuery])

  const toggleSelection = (review: Review) => {
    if (review.isSelected) {
      setSelectedReviews((current) => current.filter((item) => item.id !== review.id))
      setReviews((current) => [...current, { ...review, isSelected: false }])
    } else {
      setReviews((current) => current.filter((item) => item.id !== review.id))
      setSelectedReviews((current) => [
        ...current,
        { ...review, isSelected: true, displayOrder: current.length },
      ])
    }

    setOpenActions(null)
    setSaveError(null)
    setHasChanges(true)
  }

  const moveSelectedReview = (reviewId: string, direction: -1 | 1) => {
    setSelectedReviews((current) => {
      const currentIndex = current.findIndex((review) => review.id === reviewId)
      const nextIndex = currentIndex + direction
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) return current

      const next = [...current]
      const [moved] = next.splice(currentIndex, 1)
      next.splice(nextIndex, 0, moved)
      return next.map((review, index) => ({ ...review, displayOrder: index }))
    })
    setOpenActions(null)
    setSaveError(null)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!hasChanges || saving) return

    setSaving(true)
    setSaved(false)
    setSaveError(null)

    try {
      const response = await fetch('/api/admin/website/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedReviews: selectedReviews.map((review, index) => ({
            id: review.id,
            displayOrder: index,
          })),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Homepage review changes could not be saved.')
      }

      setSaved(true)
      setHasChanges(false)
      window.setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Homepage review changes could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-medium text-dune/70">
          <LoaderCircle className="size-5 animate-spin text-terracotta motion-reduce:animate-none" aria-hidden="true" />
          Loading reviews…
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="border-b border-sage/20 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">Website reviews</p>
            <h1 className="mt-1 text-balance font-serif text-3xl leading-tight text-dune">Manage reviews</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-dune/70">
              Choose and order homepage reviews. Edit website visibility and link reviews to stylists.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <Link href="/admin/website/review-settings" className="btn btn-secondary inline-flex items-center justify-center gap-2">
              <Settings className="size-4" aria-hidden="true" />
              Settings
            </Link>
            <button type="button" onClick={() => void fetchReviews()} className="btn btn-secondary inline-flex items-center justify-center gap-2">
              <RefreshCw className="size-4" aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !hasChanges}
              className={`btn col-span-2 inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40 sm:order-first sm:col-span-1 ${saved ? 'btn-secondary border-ocean-mist/30 bg-ocean-mist/20' : 'btn-primary'}`}
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : saved ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </div>

        {(saveError || hasChanges || saved) ? (
          <div className="mt-3 text-sm" role="status" aria-live="polite">
            {saveError ? <p className="text-terracotta">{saveError} Try again, or refresh to reload the latest reviews.</p> : null}
            {!saveError && hasChanges ? <p className="text-dune/65">Unsaved homepage changes</p> : null}
            {!saveError && saved ? <p className="text-ocean-mist">Homepage review order saved.</p> : null}
          </div>
        ) : null}
      </header>

      {loadError ? (
        <div className="flex items-start gap-3 border border-terracotta/25 bg-terracotta/10 p-4 text-sm leading-6 text-terracotta" role="alert">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">Reviews are unavailable.</p>
            <p>{loadError} Refresh this page to try again.</p>
          </div>
        </div>
      ) : null}

      <SummaryStrip reviews={allReviews} selectedCount={selectedReviews.length} />

      <section aria-labelledby="homepage-reviews-heading" className="border-y border-golden/25 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-golden/20 px-4 py-4 sm:px-5">
          <div>
            <h2 id="homepage-reviews-heading" className="font-serif text-xl text-dune">Chosen for the homepage</h2>
            <p className="mt-1 text-xs leading-5 text-dune/60">Use the action menu to change the order or remove a review.</p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-golden">{selectedReviews.length}</span>
        </div>

        {selectedReviews.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Star className="mx-auto size-6 text-dune/25" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-dune">No homepage reviews selected</p>
            <p className="mt-1 text-xs text-dune/60">Open a review&apos;s action menu below, then choose Add to homepage.</p>
          </div>
        ) : (
          <ol className="divide-y divide-golden/15">
            {selectedReviews.map((review, index) => (
              <li key={review.id}>
                <ReviewListRow
                  review={review}
                  order={index + 1}
                  expanded={expandedReview === review.id}
                  actionsOpen={openActions === review.id}
                  canMoveUp={index > 0}
                  canMoveDown={index < selectedReviews.length - 1}
                  onToggleActions={() => setOpenActions((current) => (current === review.id ? null : review.id))}
                  onToggleExpanded={() => setExpandedReview((current) => (current === review.id ? null : review.id))}
                  onEdit={() => {
                    setOpenActions(null)
                    setEditing(review)
                  }}
                  onToggleHomepage={() => toggleSelection(review)}
                  onMoveUp={() => moveSelectedReview(review.id, -1)}
                  onMoveDown={() => moveSelectedReview(review.id, 1)}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="all-reviews-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="all-reviews-heading" className="font-serif text-xl text-dune">Available reviews</h2>
            <p className="mt-1 text-xs text-dune/60">Search reviewer names and review text, or filter by source.</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-dune/55">{filteredReviews.length}</span>
        </div>

        <div className="grid gap-3 border-y border-sage/20 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-dune/70">Search reviews</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dune/45" aria-hidden="true" />
              <input
                type="search"
                name="review-search"
                autoComplete="off"
                placeholder="Name or review text…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-h-11 w-full border border-sage/30 bg-cream/35 py-2 pl-10 pr-3 text-base text-dune placeholder:text-dune/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta sm:text-sm"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-dune/70">Source</span>
            <select
              name="review-source"
              value={filterSource}
              onChange={(event) => setFilterSource(event.target.value as FilterSource)}
              className="min-h-11 w-full border border-sage/30 bg-cream/35 px-3 text-base text-dune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta sm:text-sm"
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="border-y border-sage/20 bg-white">
          {filteredReviews.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <AlertCircle className="mx-auto size-6 text-dune/25" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-dune">No reviews match</p>
              <p className="mt-1 text-xs text-dune/60">
                {searchQuery || filterSource !== 'all'
                  ? 'Clear the search or choose a different source.'
                  : 'New public reviews will appear here automatically.'}
              </p>
              {(searchQuery || filterSource !== 'all') ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterSource('all')
                  }}
                  className="mt-4 min-h-11 px-3 text-sm font-semibold text-terracotta hover:text-dune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <ol className="divide-y divide-sage/15">
              {filteredReviews.map((review) => (
                <li key={review.id}>
                  <ReviewListRow
                    review={review}
                    expanded={expandedReview === review.id}
                    actionsOpen={openActions === review.id}
                    onToggleActions={() => setOpenActions((current) => (current === review.id ? null : review.id))}
                    onToggleExpanded={() => setExpandedReview((current) => (current === review.id ? null : review.id))}
                    onEdit={() => {
                      setOpenActions(null)
                      setEditing(review)
                    }}
                    onToggleHomepage={() => toggleSelection(review)}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {editing ? (
        <ReviewEditDrawer
          review={editing as ReviewRow}
          teamOptions={teamOptions}
          returnFocusId={`review-actions-trigger-${editing.id}`}
          onClose={() => setEditing(null)}
          onSaved={() => void fetchReviews()}
        />
      ) : null}
    </div>
  )
}

function SummaryStrip({ reviews, selectedCount }: { reviews: Review[]; selectedCount: number }) {
  const metrics = [
    { label: 'All reviews', value: reviews.length },
    { label: 'Chosen for homepage', value: selectedCount },
    { label: '5-star reviews', value: reviews.filter((review) => review.rating === 5).length },
    { label: 'Review sources', value: new Set(reviews.map((review) => review.source)).size },
  ]

  return (
    <dl className="grid grid-cols-2 gap-px border-y border-sage/20 bg-sage/20 sm:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-white px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dune/55">{metric.label}</dt>
          <dd className="mt-1 font-serif text-xl tabular-nums text-dune">{metric.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ReviewListRow({
  review,
  order,
  expanded,
  actionsOpen,
  canMoveUp = false,
  canMoveDown = false,
  onToggleActions,
  onToggleExpanded,
  onEdit,
  onToggleHomepage,
  onMoveUp,
  onMoveDown,
}: {
  review: Review
  order?: number
  expanded: boolean
  actionsOpen: boolean
  canMoveUp?: boolean
  canMoveDown?: boolean
  onToggleActions: () => void
  onToggleExpanded: () => void
  onEdit: () => void
  onToggleHomepage: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const status = review.showOnWebsite === false
    ? 'Hidden'
    : review.isSelected
      ? 'Homepage'
      : review.isLiveAuto
        ? 'Shown automatically'
        : null

  return (
    <article className="px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        {typeof order === 'number' ? (
          <span className="mt-0.5 w-6 shrink-0 font-mono text-xs tabular-nums text-golden" aria-label={`Homepage position ${order}`}>
            {String(order).padStart(2, '0')}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 truncate text-sm font-semibold text-dune">{review.reviewerName}</h3>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-dune/55">{review.source}</span>
            {status ? (
              <span className="border-l border-sage/30 pl-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-terracotta">{status}</span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dune/60">
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={`size-3.5 ${index < review.rating ? 'fill-golden text-golden' : 'text-sage/35'}`}
                  aria-hidden="true"
                />
              ))}
            </span>
            <span className="sr-only">{review.rating} out of 5 stars</span>
            {typeof review.qualityScore === 'number' ? <span>Quality {review.qualityScore}/10</span> : null}
            {(review.adminLockedFields?.length ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" aria-hidden="true" /> Manually set
              </span>
            ) : null}
          </div>

          <p
            className={`mt-2 break-words text-sm leading-6 text-dune/75 ${expanded ? '' : 'line-clamp-2'}`}
            aria-label={`Full review: “${review.reviewText}”`}
          >
            “{review.reviewText}”
          </p>

          {review.reviewDate ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-dune/55">
              <Calendar className="size-3.5" aria-hidden="true" />
              <time dateTime={review.reviewDate}>{reviewDateFormatter.format(new Date(review.reviewDate))}</time>
            </p>
          ) : null}
        </div>

        <button
          id={`review-actions-trigger-${review.id}`}
          type="button"
          onClick={onToggleActions}
          aria-label={`${actionsOpen ? 'Close' : 'Open'} actions for review by ${review.reviewerName}`}
          aria-expanded={actionsOpen}
          aria-controls={`review-actions-${review.id}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-sage/25 bg-cream/30 text-dune/65 transition-colors hover:border-sage/45 hover:bg-cream/70 hover:text-dune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
        </button>
      </div>

      {actionsOpen ? (
        <div id={`review-actions-${review.id}`} className="mt-4 grid grid-cols-2 gap-px border-t border-sage/20 bg-sage/20 pt-px sm:ml-9 sm:grid-cols-3" role="group" aria-label={`Actions for review by ${review.reviewerName}`}>
          <RowAction onClick={onEdit} icon={Pencil} label="Edit details" />
          <RowAction onClick={onToggleExpanded} icon={expanded ? ChevronUp : ChevronDown} label={expanded ? 'Show less' : 'Read full review'} />
          <RowAction onClick={onToggleHomepage} icon={review.isSelected ? EyeOff : Eye} label={review.isSelected ? 'Remove from homepage' : 'Add to homepage'} />
          {review.isSelected && onMoveUp ? <RowAction onClick={onMoveUp} icon={ArrowUp} label="Move earlier" disabled={!canMoveUp} /> : null}
          {review.isSelected && onMoveDown ? <RowAction onClick={onMoveDown} icon={ArrowDown} label="Move later" disabled={!canMoveDown} /> : null}
        </div>
      ) : null}
    </article>
  )
}

function RowAction({
  onClick,
  icon: Icon,
  label,
  disabled = false,
}: {
  onClick: () => void
  icon: typeof Pencil
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-11 min-w-0 items-center gap-2 bg-white px-3 py-2 text-left text-xs font-semibold text-dune transition-colors hover:bg-cream/55 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta disabled:cursor-not-allowed disabled:text-dune/30"
    >
      <Icon className="size-4 shrink-0 text-terracotta" aria-hidden="true" />
      <span className="min-w-0 leading-4">{label}</span>
    </button>
  )
}
