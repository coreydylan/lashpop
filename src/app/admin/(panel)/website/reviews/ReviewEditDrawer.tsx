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
import { useEffect, useState } from "react"
import { Loader2, X, Sparkles, RotateCw, Lock, Unlock } from "lucide-react"

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
  onClose: () => void
  onSaved: () => void
}

export default function ReviewEditDrawer({ review, teamOptions, onClose, onSaved }: Props) {
  const locks = new Set(review.adminLockedFields ?? [])

  const [qualityScore, setQualityScore] = useState<number | null>(review.qualityScore)
  const [editorNotes, setEditorNotes] = useState<string>(review.editorNotes ?? "")
  const [teamMemberId, setTeamMemberId] = useState<string | null>(review.teamMemberId)
  const [showOnWebsite, setShowOnWebsite] = useState<boolean>(review.showOnWebsite !== false)
  const [unlockFields, setUnlockFields] = useState<Set<string>>(new Set())

  const [suggesting, setSuggesting] = useState(false)
  const [rescoring, setRescoring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<{
    teamMemberId: string | null
    teamMemberName: string | null
    confidence: number | null
    reason: string | null
  } | null>(null)

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [onClose])

  function toggleUnlock(column: string) {
    const next = new Set(unlockFields)
    next.has(column) ? next.delete(column) : next.add(column)
    setUnlockFields(next)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {}
      if (qualityScore !== review.qualityScore) body.qualityScore = qualityScore
      if ((editorNotes || null) !== (review.editorNotes || null)) body.editorNotes = editorNotes || null
      if (teamMemberId !== review.teamMemberId) body.teamMemberId = teamMemberId
      if (showOnWebsite !== (review.showOnWebsite !== false)) body.showOnWebsite = showOnWebsite
      if (unlockFields.size) body.unlock = Array.from(unlockFields)
      if (Object.keys(body).length === 0) {
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
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleSuggest() {
    setSuggesting(true)
    setError(null)
    setSuggestion(null)
    try {
      const res = await fetch(`/api/admin/website/reviews/${review.id}/suggest-stylist`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "suggest failed")
      setSuggestion(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSuggesting(false)
    }
  }

  async function handleRescore() {
    setRescoring(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/website/reviews/${review.id}/rescore`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "rescore failed")
      setQualityScore(data.score)
      setEditorNotes(data.notes ?? "")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRescoring(false)
    }
  }

  function LockHint({ column }: { column: string }) {
    if (!locks.has(column)) return null
    const isUnlocked = unlockFields.has(column)
    return (
      <label className="text-xs text-dune/60 inline-flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={isUnlocked}
          onChange={() => toggleUnlock(column)}
          className="w-3 h-3"
        />
        {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        {isUnlocked ? "Unlock (let editor manage)" : "Locked from editor"}
      </label>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-ivory shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-ivory border-b border-sage/30 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-dune">Edit review</h2>
          <button onClick={onClose} className="text-dune/60 hover:text-dune">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-6">
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
            <p className="text-sm text-dune/80 whitespace-pre-wrap mt-2">{review.reviewText}</p>
            {review.hiddenReason && (
              <p className="text-xs text-amber-700 mt-2">
                Currently hidden — reason: <code>{review.hiddenReason}</code>
              </p>
            )}
          </section>

          {/* Quality score */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="quality" className="block text-sm font-medium text-dune">
                Quality score (1-10)
              </label>
              <button
                type="button"
                onClick={handleRescore}
                disabled={rescoring}
                className="inline-flex items-center gap-1 text-xs text-golden hover:underline disabled:opacity-50"
              >
                {rescoring ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCw className="w-3 h-3" />
                )}
                Re-score with Claude
              </button>
            </div>
            <input
              id="quality"
              type="number"
              min={1}
              max={10}
              value={qualityScore ?? ""}
              onChange={e =>
                setQualityScore(e.target.value === "" ? null : Number(e.target.value))
              }
              className="w-24 px-3 py-2 border border-sage/40 rounded-lg focus:outline-none focus:border-golden"
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
            <div className="flex items-center justify-between">
              <label htmlFor="stylist" className="block text-sm font-medium text-dune">
                Tagged stylist
              </label>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={suggesting}
                className="inline-flex items-center gap-1 text-xs text-golden hover:underline disabled:opacity-50"
              >
                {suggesting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Suggest from text
              </button>
            </div>
            <select
              id="stylist"
              value={teamMemberId ?? ""}
              onChange={e => setTeamMemberId(e.target.value || null)}
              className="w-full px-3 py-2 border border-sage/40 rounded-lg bg-white focus:outline-none focus:border-golden"
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
              <div className="text-xs text-dune/70 bg-sage/10 px-3 py-2 rounded-lg space-y-1">
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
                    className="text-golden hover:underline"
                  >
                    Apply
                  </button>
                )}
              </div>
            )}
            <LockHint column="team_member_id" />
          </section>

          {/* Visibility */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-dune">Visibility</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnWebsite}
                  onChange={e => setShowOnWebsite(e.target.checked)}
                  className="w-4 h-4 rounded text-golden focus:ring-golden"
                />
                <span className="text-sm text-dune">
                  {showOnWebsite ? "Visible on website" : "Hidden"}
                </span>
              </label>
            </div>
            <LockHint column="show_on_website" />
          </section>

          {/* Editor notes (read/edit) */}
          <section className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-dune">
              Editor notes
            </label>
            <textarea
              id="notes"
              value={editorNotes}
              onChange={e => setEditorNotes(e.target.value)}
              rows={3}
              placeholder="(empty)"
              className="w-full px-3 py-2 text-sm border border-sage/40 rounded-lg focus:outline-none focus:border-golden"
            />
            <LockHint column="editor_notes" />
          </section>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <footer className="sticky bottom-0 bg-ivory border-t border-sage/30 px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-dune/70 hover:text-dune"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-golden text-white rounded-lg font-medium hover:bg-golden/90 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save & lock
          </button>
        </footer>
      </div>
    </div>
  )
}
