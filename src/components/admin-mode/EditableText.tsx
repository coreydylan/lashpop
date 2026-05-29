'use client'

/**
 * EditableText — inline text editing primitive for admin mode.
 *
 * When admin mode is OFF this is a pure pass-through: it renders `value` inside
 * the configured element with no extra DOM, no listeners, no hydration risk.
 *
 * When ON it adds a hover/touch affordance; clicking opens an inline editor
 * (input or textarea) with explicit Save / Cancel. While the editor is open and
 * changed, it registers a DirtyBlock so the floating chrome can show the count
 * and run "Save all". On success it optimistically shows the new value and calls
 * router.refresh() so server-rendered dependents (e.g. SEO JSON-LD) reconcile.
 *
 * The call site owns persistence via `onSave(next)` — that's where the specific
 * PATCH/PUT endpoint lives — keeping this component endpoint-agnostic.
 */

import React, {
  ElementType,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Pencil, Check, X, Loader2, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { useAdminMode } from '@/contexts/AdminModeContext'

export interface EditableTextProps {
  /** Stable id for the dirty registry. Falls back to a generated id. */
  id?: string
  /** Human label shown in the chrome's dirty list, e.g. "Emily — bio". */
  label: string
  value: string
  onSave: (next: string) => Promise<void>
  /** Element used to render the display value (default 'span'). */
  as?: ElementType
  className?: string
  /** Render as a multi-line textarea instead of a single-line input. */
  multiline?: boolean
  placeholder?: string
  /** Override how the saved value is displayed (formatting, links, etc.). */
  renderDisplay?: (value: string) => React.ReactNode
  /** Extra note shown inside the editor (e.g. Vagaro-override warning). */
  editorNote?: React.ReactNode
  /** Optional secondary action in the editor footer (e.g. "Revert to Vagaro"). */
  editorAction?: { label: string; onClick: () => void | Promise<void> }
  /** Soft cap: shows an "n/max" counter and blocks Save when exceeded. */
  maxLength?: number
  /** Custom validator. Return an error message to block Save, or null when valid. */
  validate?: (value: string) => string | null
}

const ACCENT = '#C9A9A6'

export function EditableText({
  id,
  label,
  value,
  onSave,
  as,
  className,
  multiline = false,
  placeholder,
  renderDisplay,
  editorNote,
  editorAction,
  maxLength,
  validate,
}: EditableTextProps) {
  const { enabled, registerDirty, clearDirty, refresh, pushUndo } = useAdminMode()
  const generatedId = useId()
  const blockId = id ?? generatedId
  const As: ElementType = as ?? 'span'
  const noteId = `${blockId}-note`
  const errorId = `${blockId}-error`

  const [saved, setSaved] = useState(value)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep `saved` in sync with the server-provided `value`, but only react to a
  // genuine prop CHANGE — not to the editing->false transition. Otherwise, right
  // after an optimistic save (saved=next, editing=false) the effect would re-run
  // while `value` still holds the OLD server value (router.refresh pending) and
  // clobber the just-saved text with a stale flash.
  const prevValueProp = useRef(value)
  useEffect(() => {
    if (value !== prevValueProp.current) {
      prevValueProp.current = value
      if (!editing) setSaved(value)
    }
  }, [value, editing])

  const draftRef = useRef(draft)
  draftRef.current = draft
  // Track the last-saved value so the undo entry can re-apply it without stale closures.
  const savedRef = useRef(saved)
  savedRef.current = saved

  // justSaved checkmark timer — cleared on unmount so we never setState on an
  // unmounted block (e.g. a takeover that closes right after a save).
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current)
  }, [])

  const doSave = useCallback(
    async (opts?: { skipRefresh?: boolean }) => {
      const next = draftRef.current
      const prev = savedRef.current
      setSaving(true)
      setError(null)
      try {
        await onSave(next)
        setSaved(next)
        setEditing(false)
        setSaving(false)
        setJustSaved(true)
        clearDirty(blockId)
        if (flashTimer.current) clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setJustSaved(false), 1800)
        // Record an undo that re-applies the prior value via the same save path.
        // (The undo's onSave does NOT push a new undo — it bypasses doSave.)
        if (prev !== next) {
          pushUndo({
            id: `${blockId}-${next.length}`,
            label,
            run: async () => {
              await onSave(prev)
              setSaved(prev)
            },
          })
        }
        // "Save all" passes skipRefresh and issues a single refresh itself.
        if (!opts?.skipRefresh) refresh()
      } catch (e) {
        setSaving(false)
        setError(e instanceof Error ? e.message : 'Save failed')
        throw e
      }
    },
    [onSave, clearDirty, blockId, refresh, pushUndo, label]
  )

  const doDiscard = useCallback(() => {
    setDraft(saved)
    setEditing(false)
    setError(null)
    clearDirty(blockId)
  }, [saved, clearDirty, blockId])

  // Stable refs so the registered DirtyBlock always runs the latest logic.
  const saveRef = useRef(doSave)
  saveRef.current = doSave
  const discardRef = useRef(doDiscard)
  discardRef.current = doDiscard

  const isDirty = editing && draft !== saved
  useEffect(() => {
    if (isDirty) {
      registerDirty({
        id: blockId,
        label,
        // saveAll batches: skip the per-block refresh, the provider does one.
        save: () => saveRef.current({ skipRefresh: true }),
        discard: () => discardRef.current(),
      })
    } else {
      clearDirty(blockId)
    }
    return () => clearDirty(blockId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, blockId, label])

  const onEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      doDiscard()
    } else if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      // Mirror the Save button's guard so a second keypress can't fire a
      // concurrent doSave() while the first PATCH is still in flight, and
      // so invalid drafts can't be committed via the keyboard.
      if (!saving && draft !== saved && !blockedByValidation) doSave()
    }
  }

  const runEditorAction = async () => {
    if (!editorAction) return
    setSaving(true)
    setError(null)
    try {
      await editorAction.onClick()
      setEditing(false)
      setSaving(false)
      clearDirty(blockId)
    } catch (e) {
      setSaving(false)
      setError(e instanceof Error ? e.message : `${editorAction.label} failed`)
    }
  }

  // ---- Validation (BP-4): immediate, inline. Over-limit or a non-null
  // validate() result blocks Save. The counter goes amber when over.
  const overLimit = maxLength != null && draft.length > maxLength
  const validateError = validate ? validate(draft) : null
  const validationMessage = overLimit
    ? `${draft.length - maxLength} over the ${maxLength}-character limit`
    : validateError
  const blockedByValidation = overLimit || validateError != null

  // ---- Public render: zero admin DOM ----
  if (!enabled) {
    return <As className={className}>{renderDisplay ? renderDisplay(saved) : saved}</As>
  }

  const fieldClass =
    'w-full rounded border border-stone-300 bg-white px-2 py-1 font-sans text-sm text-stone-900 outline-none focus-visible:ring-2 focus-visible:ring-[#C9A9A6] focus-visible:ring-offset-1'
  const showValidation = validationMessage != null
  const describedBy =
    clsx(editorNote && noteId, (error || showValidation) && errorId) || undefined

  // ---- Admin: editor open. Wrapper is a <div> (never a span) and forwards
  // `className` so the block's margins are preserved while editing. ----
  if (editing) {
    return (
      <div className={clsx('relative block', className)} data-admin-editing>
        <div className="rounded-md bg-white/95 p-1.5 shadow-lg" style={{ outline: `2px solid ${ACCENT}` }}>
          {multiline ? (
            <textarea
              autoFocus
              aria-label={label}
              aria-describedby={describedBy}
              value={draft}
              placeholder={placeholder}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onEditorKeyDown}
              rows={Math.min(10, Math.max(2, draft.split('\n').length))}
              className={clsx(fieldClass, 'resize-y')}
            />
          ) : (
            <input
              autoFocus
              type="text"
              aria-label={label}
              aria-describedby={describedBy}
              value={draft}
              placeholder={placeholder}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onEditorKeyDown}
              className={fieldClass}
            />
          )}

          {editorNote ? (
            <div id={noteId} className="mt-1.5 text-[11px] leading-snug text-stone-500">
              {editorNote}
            </div>
          ) : null}
          {error || showValidation ? (
            <div id={errorId} aria-live="polite" className="mt-1.5 text-[11px] text-red-600">
              {error || validationMessage}
            </div>
          ) : null}

          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => doSave()}
              disabled={saving || draft === saved || blockedByValidation}
              title={
                blockedByValidation
                  ? validationMessage ?? 'Fix the highlighted issue to save'
                  : draft === saved
                    ? 'No changes to save'
                    : 'Save'
              }
              className="inline-flex min-h-0 items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: '#1C1917' }}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
            {maxLength != null ? (
              <span
                className={clsx(
                  'text-[11px] tabular-nums',
                  !editorAction && 'ml-auto',
                  overLimit ? 'font-medium text-amber-600' : 'text-stone-400'
                )}
                aria-live="polite"
              >
                {draft.length}/{maxLength}
              </span>
            ) : null}
            <button
              type="button"
              onClick={doDiscard}
              disabled={saving}
              className="inline-flex min-h-0 items-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            {editorAction ? (
              <button
                type="button"
                onClick={runEditorAction}
                disabled={saving}
                className="ml-auto inline-flex min-h-0 items-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-800"
              >
                <RotateCcw className="h-3 w-3" />
                {editorAction.label}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  // ---- Admin: idle (display + affordance) ----
  const startEditing = () => {
    setDraft(saved)
    setEditing(true)
  }

  return (
    <As
      className={clsx(className, 'group/admin relative cursor-text rounded-sm')}
      style={{ outline: `1px dashed ${ACCENT}`, outlineOffset: 2, background: `${ACCENT}14` }}
      onClick={startEditing}
      data-admin-editable
    >
      {renderDisplay
        ? renderDisplay(saved)
        : saved || <span className="italic text-stone-400">{placeholder ?? 'Empty'}</span>}
      <button
        type="button"
        aria-label={`Edit ${label}`}
        onClick={e => {
          e.stopPropagation()
          startEditing()
        }}
        /* Positioned just inside the top-right corner (not negative offsets) so an
           overflow-hidden ancestor — e.g. the founder section — can never clip it. */
        className="absolute right-0.5 top-0.5 z-10 inline-flex h-6 w-6 min-h-0 min-w-0 items-center justify-center rounded-full text-white shadow"
        style={{ background: ACCENT }}
      >
        {justSaved ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3 w-3" />}
      </button>
    </As>
  )
}
