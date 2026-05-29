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
}: EditableTextProps) {
  const { enabled, registerDirty, clearDirty, refresh } = useAdminMode()
  const generatedId = useId()
  const blockId = id ?? generatedId
  const As: ElementType = as ?? 'span'

  const [saved, setSaved] = useState(value)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep `saved` in sync with server-provided `value` when we're not mid-edit
  // (e.g. after a router.refresh() pulls fresh data).
  useEffect(() => {
    if (!editing) setSaved(value)
  }, [value, editing])

  const draftRef = useRef(draft)
  draftRef.current = draft

  const doSave = useCallback(async () => {
    const next = draftRef.current
    setSaving(true)
    setError(null)
    try {
      await onSave(next)
      setSaved(next)
      setEditing(false)
      setSaving(false)
      setJustSaved(true)
      clearDirty(blockId)
      window.setTimeout(() => setJustSaved(false), 1800)
      refresh()
    } catch (e) {
      setSaving(false)
      setError(e instanceof Error ? e.message : 'Save failed')
      throw e
    }
  }, [onSave, clearDirty, blockId, refresh])

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
        save: () => saveRef.current(),
        discard: () => discardRef.current(),
      })
    } else {
      clearDirty(blockId)
    }
    return () => clearDirty(blockId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, blockId, label])

  // ---- Public render: zero admin DOM ----
  if (!enabled) {
    return <As className={className}>{renderDisplay ? renderDisplay(saved) : saved}</As>
  }

  // ---- Admin: editor open ----
  if (editing) {
    return (
      <span className="relative block" data-admin-editing>
        <div
          className="rounded-md bg-white/95 p-2 shadow-lg"
          style={{ outline: `2px solid ${ACCENT}` }}
        >
          {multiline ? (
            <textarea
              autoFocus
              value={draft}
              placeholder={placeholder}
              onChange={e => setDraft(e.target.value)}
              rows={Math.max(3, draft.split('\n').length + 1)}
              className="w-full resize-y rounded border border-stone-300 bg-white p-2 font-sans text-sm text-stone-900 focus:outline-none"
            />
          ) : (
            <input
              autoFocus
              value={draft}
              placeholder={placeholder}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') doSave()
                if (e.key === 'Escape') doDiscard()
              }}
              className="w-full rounded border border-stone-300 bg-white p-2 font-sans text-sm text-stone-900 focus:outline-none"
            />
          )}

          {editorNote ? (
            <div className="mt-1.5 text-[11px] leading-snug text-stone-500">{editorNote}</div>
          ) : null}
          {error ? <div className="mt-1.5 text-[11px] text-red-600">{error}</div> : null}

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => doSave()}
              disabled={saving || draft === saved}
              className="inline-flex min-h-0 items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: '#1C1917' }}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
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
                onClick={async () => {
                  await editorAction.onClick()
                  setEditing(false)
                  clearDirty(blockId)
                }}
                disabled={saving}
                className="ml-auto inline-flex min-h-0 items-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-800"
              >
                <RotateCcw className="h-3 w-3" />
                {editorAction.label}
              </button>
            ) : null}
          </div>
        </div>
      </span>
    )
  }

  // ---- Admin: idle (display + affordance) ----
  return (
    <As
      className={clsx(className, 'group/admin relative cursor-text rounded-sm')}
      style={{ outline: `1px dashed ${ACCENT}66`, outlineOffset: 2 }}
      onClick={() => {
        setDraft(saved)
        setEditing(true)
      }}
      data-admin-editable
    >
      {renderDisplay ? renderDisplay(saved) : saved || <span className="text-stone-400">{placeholder ?? 'Empty'}</span>}
      <button
        type="button"
        aria-label={`Edit ${label}`}
        onClick={e => {
          e.stopPropagation()
          setDraft(saved)
          setEditing(true)
        }}
        className="absolute -right-1 -top-1 z-10 inline-flex h-6 w-6 min-h-0 min-w-0 items-center justify-center rounded-full text-white shadow opacity-70 transition-opacity group-hover/admin:opacity-100"
        style={{ background: ACCENT }}
      >
        {justSaved ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3 w-3" />}
      </button>
    </As>
  )
}
