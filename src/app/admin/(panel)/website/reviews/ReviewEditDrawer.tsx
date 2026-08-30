"use client"

/**
 * Per-review override drawer for /admin/website/reviews.
 *
 * Surfaces every column the AI editor or auto-promote can touch:
 *   - quality_score (override + lock)
 *   - team_member_id (re-tag, with "suggest stylist" via mesh-claude)
 *   - show_on_website (force-show or force-hide; clears hidden_reason)
 *   - editor_notes (read-only LLM justification + admin can edit)
 *
 * Any field the admin edits gets pushed into reviews.admin_locked_fields so
 * the next editor pass leaves it alone. The "Unlock from editor" checkbox
 * removes specific column locks.
 */
import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Loader2, X, Sparkles, RotateCw, Lock, Unlock } from "lucide-react"

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface ReviewRow {
  id: string
  source: string
  reviewerName: string
  reviewText: string
  rating: number
  reviewDate: string | null
  subject: string | null
  qualityScore: number | null
  editorNotes: string | null
  showOnWebsite: boolean | null
  hiddenReason: string | null
  teamMemberId: string | null
  adminLockedFields: string[] | null
}

interface TeamOption {
  id: string
  name: string
  isActive: boolean
}

interface Props {
  review: ReviewRow
  teamOptions: TeamOption[]
  returnFocusId?: string
  onClose: () => void
  onSaved: () => void
}

export default function ReviewEditDrawer({ review, teamOptions, returnFocusId, onClose, onSaved }: Props) {
  const locks = new Set(review.adminLockedFields ?? [])
  const titleId = useId()
  const descriptionId = useId()
  const qualityId = useId()
  const stylistId = useId()
  const visibilityId = useId()
  const notesId = useId()
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  const [qualityScore, setQualityScore] = useState<number | null>(review.qualityScore)
  const [editorNotes, setEditorNotes] = useState<string>(review.editorNotes ?? "")
  const [teamMemberId, setTeamMemberId] = useState<string | null>(review.teamMemberId)
  const [showOnWebsite, setShowOnWebsite] = useState<boolean>(review.showOnWebsite !== false)
  const [unlockFields, setUnlockFields] = useState<Set<string>>(new Set())

  const [suggesting, setSuggesting] = useState(false)
  const [rescoring, setRescoring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [suggestion, setSuggestion] = useState<{
    teamMemberId: string | null
    teamMemberName: string | null
    confidence: number | null
    reason: string | null
  } | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const previousOverscrollBehavior = document.body.style.overscrollBehavior
    document.body.style.overflow = "hidden"
    document.body.style.overscrollBehavior = "none"

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== "Tab") return
      const drawer = drawerRef.current
      if (!drawer) return

      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => !element.hidden && element.getClientRects().length > 0)

      if (focusable.length === 0) {
        event.preventDefault()
        drawer.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !drawer.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !drawer.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      document.body.style.overscrollBehavior = previousOverscrollBehavior
      const returnTarget = returnFocusId ? document.getElementById(returnFocusId) : null
      if (returnTarget instanceof HTMLElement && returnTarget.isConnected) {
        returnTarget.focus()
      } else if (opener?.isConnected) {
        opener.focus()
      }
    }
  }, [returnFocusId])

  function toggleUnlock(column: string) {
    const next = new Set(unlockFields)
    if (next.has(column)) {
      next.delete(column)
    } else {
      next.add(column)
    }
    setUnlockFields(next)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setStatusMessage("Saving review changes…")
    try {
      const body: Record<string, unknown> = {}
      if (qualityScore !== review.qualityScore) body.qualityScore = qualityScore
      if ((editorNotes || null) !== (review.editorNotes || null)) body.editorNotes = editorNotes || null
      if (teamMemberId !== review.teamMemberId) body.teamMemberId = teamMemberId
      if (showOnWebsite !== (review.showOnWebsite !== false)) body.showOnWebsite = showOnWebsite
      if (unlockFields.size) body.unlock = Array.from(unlockFields)
      if (Object.keys(body).length === 0) {
        setStatusMessage("No changes to save.")
        onClose()
        return
      }
      const res = await fetch(`/api/admin/website/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `HTTP ${res.status}`)
      }
      setStatusMessage("Review changes saved.")
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatusMessage("Review changes were not saved. Check the message above.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSuggest() {
    setSuggesting(true)
    setError(null)
    setSuggestion(null)
    setStatusMessage("Finding a stylist suggestion…")
    try {
      const res = await fetch(`/api/admin/website/reviews/${review.id}/suggest-stylist`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "suggest failed")
      setSuggestion(data)
      setStatusMessage("Stylist suggestion ready. Review it before applying.")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatusMessage("A stylist suggestion could not be created. Check the message above.")
    } finally {
      setSuggesting(false)
    }
  }

  async function handleRescore() {
    setRescoring(true)
    setError(null)
    setStatusMessage("Re-scoring this review…")
    try {
      const res = await fetch(`/api/admin/website/reviews/${review.id}/rescore`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "rescore failed")
      setQualityScore(data.score)
      setEditorNotes(data.notes ?? "")
      setStatusMessage("Score and notes updated. Save to keep these changes.")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatusMessage("This review could not be re-scored. Check the message above.")
    } finally {
      setRescoring(false)
    }
  }

  function LockHint({ column }: { column: string }) {
    if (!locks.has(column)) return null
    const isUnlocked = unlockFields.has(column)
    return (
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs text-dune/60 focus-within:ring-2 focus-within:ring-golden focus-within:ring-offset-2">
        <input
          type="checkbox"
          name={`review-unlock-${review.id}-${column}`}
          autoComplete="off"
          checked={isUnlocked}
          onChange={() => toggleUnlock(column)}
          className="size-5 accent-golden"
        />
        {isUnlocked ? <Unlock className="size-4" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
        {isUnlocked ? "Unlock (let editor manage)" : "Locked from editor"}
      </label>
    )
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/30"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={saving || suggesting || rescoring}
        tabIndex={-1}
        className="flex h-dvh w-full max-w-xl flex-col overflow-hidden overscroll-contain bg-ivory shadow-2xl sm:h-full sm:border-l sm:border-sage/20"
      >
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-sage/30 bg-ivory px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold text-dune">Edit review</h2>
            <p id={descriptionId} className="sr-only">
              Edit website display settings for {review.reviewerName}&apos;s review.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close review editor"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-sage/30 bg-white text-dune/65 hover:border-sage/60 hover:text-dune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {/* Metadata */}
          <section className="space-y-1 pb-4 border-b border-sage/20">
            <p className="text-sm text-dune">
              <span className="font-medium">{review.reviewerName}</span>
              <span className="text-dune/50"> · {review.source} · {review.rating}★</span>
              {review.reviewDate && (
                <span className="text-dune/50">
                  {" · "}
                  {new Date(review.reviewDate).toLocaleDateString()}
                </span>
              )}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-dune/80">{review.reviewText}</p>
            {review.hiddenReason && (
              <p className="mt-2 break-words text-xs text-amber-700">
                Currently hidden — reason: <code className="break-all">{review.hiddenReason}</code>
              </p>
            )}
          </section>

          {/* Quality score */}
          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={qualityId} className="block text-sm font-medium text-dune">
                Quality score (1-10)
              </label>
              <button
                type="button"
                onClick={handleRescore}
                disabled={rescoring}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-golden/30 bg-white px-3 text-xs font-semibold text-golden hover:border-golden/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rescoring ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <RotateCw className="size-4" aria-hidden="true" />
                )}
                Re-score with Claude
              </button>
            </div>
            <input
              id={qualityId}
              name="review-quality-score"
              autoComplete="off"
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              value={qualityScore ?? ""}
              onChange={e =>
                setQualityScore(e.target.value === "" ? null : Number(e.target.value))
              }
              className="min-h-11 w-24 rounded-lg border border-sage/40 bg-white px-3 py-2 focus:border-golden focus:outline-none focus:ring-2 focus:ring-golden/25"
            />
            {review.editorNotes && (
              <p className="text-xs text-dune/60 italic">
                Editor notes: {review.editorNotes}
              </p>
            )}
            <LockHint column="quality_score" />
          </section>

          {/* Team member tag */}
          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={stylistId} className="block text-sm font-medium text-dune">
                Tagged stylist
              </label>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={suggesting}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-golden/30 bg-white px-3 text-xs font-semibold text-golden hover:border-golden/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggesting ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                Suggest from text
              </button>
            </div>
            <select
              id={stylistId}
              name="review-tagged-stylist"
              autoComplete="off"
              value={teamMemberId ?? ""}
              onChange={e => setTeamMemberId(e.target.value || null)}
              className="min-h-11 w-full rounded-lg border border-sage/40 bg-white px-3 py-2 focus:border-golden focus:outline-none focus:ring-2 focus:ring-golden/25"
            >
              <option value="">(none — venue review)</option>
              {teamOptions
                .filter(t => t.isActive)
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              <option disabled>— inactive —</option>
              {teamOptions
                .filter(t => !t.isActive)
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} (inactive)
                  </option>
                ))}
            </select>
            {suggestion && (
              <div
                className="space-y-1 rounded-lg border border-sage/20 bg-sage/10 px-3 py-3 text-xs text-dune/70"
                role="status"
                aria-live="polite"
              >
                <p>
                  Suggestion:{" "}
                  <span className="font-medium text-dune">
                    {suggestion.teamMemberName ?? "(no specific stylist)"}
                  </span>
                  {suggestion.confidence != null && ` · confidence ${suggestion.confidence}/10`}
                </p>
                {suggestion.reason && <p className="italic">{suggestion.reason}</p>}
                {suggestion.teamMemberId && suggestion.teamMemberId !== teamMemberId && (
                  <button
                    type="button"
                    onClick={() => setTeamMemberId(suggestion.teamMemberId)}
                    className="mt-1 inline-flex min-h-11 items-center rounded-lg border border-golden/30 bg-white px-3 font-semibold text-golden hover:border-golden/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                  >
                    Apply
                  </button>
                )}
              </div>
            )}
            <LockHint column="team_member_id" />
          </section>

          {/* Visibility */}
          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-dune">Visibility</legend>
            <div className="flex items-center gap-3">
              <label htmlFor={visibilityId} className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 focus-within:ring-2 focus-within:ring-golden focus-within:ring-offset-2">
                <input
                  id={visibilityId}
                  name="review-website-visibility"
                  autoComplete="off"
                  type="checkbox"
                  checked={showOnWebsite}
                  onChange={e => setShowOnWebsite(e.target.checked)}
                  className="size-5 rounded accent-golden"
                />
                <span className="text-sm text-dune">
                  {showOnWebsite ? "Visible on website" : "Hidden"}
                </span>
              </label>
            </div>
            <LockHint column="show_on_website" />
          </fieldset>

          {/* Editor notes (read/edit) */}
          <section className="space-y-2">
            <label htmlFor={notesId} className="block text-sm font-medium text-dune">
              Editor notes
            </label>
            <textarea
              id={notesId}
              name="review-editor-notes"
              autoComplete="off"
              value={editorNotes}
              onChange={e => setEditorNotes(e.target.value)}
              rows={3}
              placeholder="(empty)"
              className="w-full resize-y rounded-lg border border-sage/40 bg-white px-3 py-3 text-sm leading-6 focus:border-golden focus:outline-none focus:ring-2 focus:ring-golden/25"
            />
            <LockHint column="editor_notes" />
          </section>

          {error && (
            <div
              className="break-words rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}
        </div>

        <footer className="sticky bottom-0 z-10 shrink-0 border-t border-sage/30 bg-ivory px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:py-4">
          <p
            className={`min-h-5 text-xs ${error ? "text-red-700" : "text-dune/60"}`}
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-lg border border-sage/40 bg-white px-4 text-sm font-semibold text-dune/70 hover:border-sage/70 hover:text-dune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-golden px-5 text-sm font-semibold text-white hover:bg-golden/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {saving ? "Saving…" : "Save & lock"}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
