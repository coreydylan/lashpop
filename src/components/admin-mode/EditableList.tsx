'use client'

/**
 * EditableList<T> — repeatable rows primitive for admin mode.
 *
 * When admin mode is OFF this is a pure pass-through: it renders each item via
 * `renderRow` with no admin chrome, no listeners, no Reorder DOM (zero hydration
 * risk) — exactly like EditableText.
 *
 * When ON it shows the same rows wrapped in the shared editable language:
 *  - top-LEFT structure rail: ⠿ grip (drag-reorder, framer-motion Reorder)
 *  - top-RIGHT edit intent: ✎ pencil (chip = edit in place; card = expand a sheet)
 *  - a "+ Add" affordance and an empty state ("No X yet… + Add your first one")
 *
 * ONE dirty block is registered for the WHOLE list (working draft != saved).
 * Persistence is endpoint-agnostic: the call site owns the network call via
 * `onSave(next)` (whole-list save, like EditableText.onSave). Optimistic local
 * state + router.refresh() on individual Save-all (skipped when skipRefresh).
 * NO toasts — feedback is the universal 1800ms ✓ flash + the dirty count.
 *
 * Two display modes:
 *  - 'chip'  → short single-value rows; ✎ edits the row IN PLACE (renderEditor
 *              renders inline beside the chip).
 *  - 'card'  → richer rows; ✎ expands a per-row sheet (2px solid) with the editor
 *              and a Cancel / Save / 🗑 Delete footer.
 *
 * Reorder auto-disables under 3 items (nothing to meaningfully reorder).
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { ADMIN, AdminIcons, COPY, editableIdleStyle } from './adminTokens'
import { useDirtyBlock } from './useDirtyBlock'
import { useConfirm } from './useConfirm'

export interface EditableListRenderEditor<T> {
  /** The in-progress copy of this row. Mutate via `set`, never in place. */
  draft: T
  /** Patch the working row; merges a partial onto the current draft. */
  set: (patch: Partial<T>) => void
}

export interface EditableListProps<T> {
  /** Stable id for the dirty registry. Falls back to a generated id. */
  id?: string
  /** Human label shown in the chrome's dirty list, e.g. "Emily — credentials". */
  label: string
  /** The server-provided list. */
  items: T[]
  /** Stable key per item (used for React keys + Reorder identity). */
  getKey: (item: T) => string
  /** Whole-list save. Resolves on success, throws on failure. */
  onSave: (next: T[]) => Promise<void>
  /** 'card' (default) opens a per-row sheet; 'chip' edits in place. */
  mode?: 'chip' | 'card'
  /** Idle display for a single row (no admin chrome). */
  renderRow: (item: T) => React.ReactNode
  /** In-place editor (chip) / sheet body (card) for one row. */
  renderEditor: (ctx: EditableListRenderEditor<T>) => React.ReactNode
  /** Factory for a brand-new blank row when "+ Add" is tapped. */
  makeNew: () => T
  /**
   * Per-row validation. Return an error message to block this row's Save
   * (and Save-all while it's the open row), or null when the row is valid.
   * Used e.g. to require a credential's Name.
   */
  validateRow?: (item: T) => string | null
  /** Drag-reorder. Default true, but auto-off under 3 items. */
  reorderable?: boolean
  /** Singular noun for the empty state + delete confirm ("credential"). */
  noun?: string
  /** Used in the destructive confirm, e.g. (item) => `"${item.name}"`. */
  describeForDelete?: (item: T) => string
  className?: string
}

/** Internal: a draft row carries a stable client id so React keys survive edits
 *  even before the row has a server-assigned key (e.g. a freshly-added blank). */
interface Draft<T> {
  cid: string
  item: T
}

let __cidSeq = 0
const nextCid = () => `__el${++__cidSeq}`

function toDrafts<T>(items: T[], getKey: (i: T) => string): Draft<T>[] {
  return items.map(item => ({ cid: getKey(item) || nextCid(), item }))
}

/** Stable JSON-ish signature so we can tell "draft differs from saved". */
function sig<T>(items: T[]): string {
  try {
    return JSON.stringify(items)
  } catch {
    return String(items.length)
  }
}

export function EditableList<T>(props: EditableListProps<T>) {
  const {
    id,
    label,
    items,
    getKey,
    onSave,
    mode = 'card',
    renderRow,
    renderEditor,
    makeNew,
    validateRow,
    reorderable = true,
    noun = 'item',
    describeForDelete,
    className,
  } = props

  const { enabled, refresh } = useAdminMode()
  const generatedId = useId()
  const blockId = id ?? generatedId
  const { confirm, dialog } = useConfirm()

  // Optimistic last-saved snapshot + a working draft list.
  const [saved, setSaved] = useState<T[]>(items)
  const [drafts, setDrafts] = useState<Draft<T>[]>(() => toDrafts(items, getKey))
  const [editingCid, setEditingCid] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep `saved` in sync with a genuine `items` prop CHANGE only (not our own
  // optimistic transitions). Mirrors EditableText's prevValueProp guard so a
  // pending router.refresh() can't clobber a just-saved list with stale data.
  const prevSig = useRef(sig(items))
  useEffect(() => {
    const s = sig(items)
    if (s !== prevSig.current) {
      prevSig.current = s
      if (editingCid === null) {
        setSaved(items)
        setDrafts(toDrafts(items, getKey))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, editingCid])

  const draftItems = useMemo(() => drafts.map(d => d.item), [drafts])
  const isDirty = sig(draftItems) !== sig(saved)

  // justSaved ✓ flash timer — cleared on unmount.
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    []
  )

  // Latest draft list in a ref so the registered DirtyBlock saves current data.
  const draftItemsRef = useRef(draftItems)
  draftItemsRef.current = draftItems

  const doSave = useCallback(
    async (opts?: { skipRefresh?: boolean }) => {
      const next = draftItemsRef.current
      setSaving(true)
      setError(null)
      try {
        await onSave(next)
        setSaved(next)
        setEditingCid(null)
        setSaving(false)
        setJustSaved(true)
        if (flashTimer.current) clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setJustSaved(false), 1800)
        if (!opts?.skipRefresh) refresh()
      } catch (e) {
        setSaving(false)
        setError(e instanceof Error ? e.message : COPY.saveError)
        throw e
      }
    },
    [onSave, refresh]
  )

  const doDiscard = useCallback(() => {
    setDrafts(toDrafts(saved, getKey))
    setEditingCid(null)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved])

  // ONE dirty block for the whole list.
  useDirtyBlock({
    id: blockId,
    label,
    dirty: enabled && isDirty,
    save: doSave,
    discard: doDiscard,
  })

  // ---- Row mutation helpers (all operate on the working draft) ----
  const setRow = useCallback((cid: string, patch: Partial<T>) => {
    setDrafts(prev =>
      prev.map(d => (d.cid === cid ? { ...d, item: { ...d.item, ...patch } } : d))
    )
  }, [])

  const addRow = useCallback(() => {
    const cid = nextCid()
    setDrafts(prev => [...prev, { cid, item: makeNew() }])
    setEditingCid(cid) // open the new row immediately
  }, [makeNew])

  const removeRow = useCallback((cid: string) => {
    setDrafts(prev => prev.filter(d => d.cid !== cid))
    setEditingCid(prev => (prev === cid ? null : prev))
  }, [])

  const reorder = useCallback((next: Draft<T>[]) => {
    setDrafts(next)
  }, [])

  // ---- Public render: zero admin DOM ----
  if (!enabled) {
    return (
      <div className={className}>
        {saved.map(item => (
          <React.Fragment key={getKey(item)}>{renderRow(item)}</React.Fragment>
        ))}
      </div>
    )
  }

  const canReorder = reorderable && drafts.length >= 3
  const errorId = `${blockId}-error`

  // ---- Admin: empty state ----
  if (drafts.length === 0) {
    return (
      <div className={className}>
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-md px-4 py-6 text-center"
          style={editableIdleStyle}
        >
          <p className="text-sm text-stone-500">No {noun}s yet…</p>
          <AddButton onClick={addRow} label={COPY.addFirst(noun)} />
        </div>
        {error ? (
          <p id={errorId} className="mt-1.5 text-[11px] text-red-600">
            {error}
          </p>
        ) : null}
        {dialog}
      </div>
    )
  }

  return (
    <div className={className} data-admin-list>
      <Reorder.Group
        as="div"
        axis="y"
        values={drafts}
        onReorder={reorder}
        className="flex flex-col gap-2"
      >
        {drafts.map(d => (
          <Row
            key={d.cid}
            draft={d}
            mode={mode}
            canReorder={canReorder}
            editing={editingCid === d.cid}
            saving={saving}
            justSaved={justSaved}
            rowError={validateRow ? validateRow(d.item) : null}
            renderRow={renderRow}
            renderEditor={renderEditor}
            onStartEdit={() => {
              setError(null)
              setEditingCid(d.cid)
            }}
            onStopEdit={() => setEditingCid(null)}
            onSet={patch => setRow(d.cid, patch)}
            onSaveAll={() => doSave()}
            onDelete={async () => {
              const desc = describeForDelete
                ? describeForDelete(d.item)
                : noun
              if (await confirm(COPY.removeConfirm(desc))) removeRow(d.cid)
            }}
          />
        ))}
      </Reorder.Group>

      {error ? (
        <p id={errorId} className="mt-2 text-[11px] text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex items-center gap-3">
        <AddButton onClick={addRow} label={`Add ${noun}`} />
        <span className="text-[11px] text-stone-400">{COPY.goLiveHint}</span>
      </div>

      {dialog}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row — one repeatable entry. Handles its own drag controls + edit affordance.
// ---------------------------------------------------------------------------
interface RowProps<T> {
  draft: Draft<T>
  mode: 'chip' | 'card'
  canReorder: boolean
  editing: boolean
  saving: boolean
  justSaved: boolean
  /** Non-null = this row fails validation; its Save is disabled with this message. */
  rowError: string | null
  renderRow: (item: T) => React.ReactNode
  renderEditor: (ctx: EditableListRenderEditor<T>) => React.ReactNode
  onStartEdit: () => void
  onStopEdit: () => void
  onSet: (patch: Partial<T>) => void
  onSaveAll: () => void
  onDelete: () => void
}

function Row<T>({
  draft,
  mode,
  canReorder,
  editing,
  saving,
  justSaved,
  rowError,
  renderRow,
  renderEditor,
  onStartEdit,
  onStopEdit,
  onSet,
  onSaveAll,
  onDelete,
}: RowProps<T>) {
  const dragControls = useDragControls()
  const Grip = AdminIcons.grip
  const Pencil = AdminIcons.editText
  const Saved = AdminIcons.saved
  const Cancel = AdminIcons.cancel
  const Trash = AdminIcons.remove
  const Spinner = AdminIcons.spinner

  const editorCtx: EditableListRenderEditor<T> = { draft: draft.item, set: onSet }

  // Idle escalation cue: solid strong border while this row is being edited.
  const containerStyle: React.CSSProperties = editing
    ? { outline: `2px solid ${ADMIN.accentStrong}`, outlineOffset: 2, background: '#fff', borderRadius: 6 }
    : editableIdleStyle

  return (
    <Reorder.Item
      as="div"
      value={draft}
      // Drag only from the grip so taps on text/buttons never start a drag.
      dragListener={false}
      dragControls={dragControls}
      className="relative"
      style={containerStyle}
    >
      <div className="flex items-start gap-2 px-2 py-2">
        {/* Top-LEFT structure rail: ⠿ grip */}
        {canReorder ? (
          <button
            type="button"
            aria-label="Drag to reorder"
            onPointerDown={e => dragControls.start(e)}
            className="mt-0.5 inline-flex h-9 w-9 min-h-0 min-w-0 cursor-grab touch-none items-center justify-center rounded text-stone-400 hover:text-stone-700 active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            <Grip className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-1" aria-hidden />
        )}

        {/* Body: idle row OR (chip-mode) in-place editor */}
        <div className="min-w-0 flex-1">
          {editing && mode === 'chip' ? (
            <div className="flex flex-col gap-2">
              {renderEditor(editorCtx)}
              <EditorFooter
                saving={saving}
                rowError={rowError}
                onCancel={onStopEdit}
                onSave={onSaveAll}
                onDelete={onDelete}
                Saved={Saved}
                Cancel={Cancel}
                Trash={Trash}
                Spinner={Spinner}
              />
            </div>
          ) : (
            <div className="min-h-[44px] py-1 text-sm text-stone-800">
              {renderRow(draft.item)}
            </div>
          )}
        </div>

        {/* Top-RIGHT edit intent: ✎ pencil (only when not editing) */}
        {!editing ? (
          <button
            type="button"
            aria-label="Edit"
            onClick={onStartEdit}
            className="inline-flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-full text-white shadow"
            style={{ background: ADMIN.accent }}
          >
            {justSaved ? <Saved className="h-4 w-4" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </div>

      {/* CARD mode: expanding per-row sheet beneath the row */}
      {editing && mode === 'card' ? (
        <div
          className="mx-2 mb-2 rounded-md bg-white p-3 shadow-lg"
          style={{ outline: `2px solid ${ADMIN.accentStrong}` }}
          data-admin-sheet
        >
          <div className="flex flex-col gap-3">{renderEditor(editorCtx)}</div>
          <div className="mt-3 border-t border-stone-100 pt-3">
            <EditorFooter
              saving={saving}
              rowError={rowError}
              onCancel={onStopEdit}
              onSave={onSaveAll}
              onDelete={onDelete}
              Saved={Saved}
              Cancel={Cancel}
              Trash={Trash}
              Spinner={Spinner}
            />
          </div>
        </div>
      ) : null}
    </Reorder.Item>
  )
}

// ---------------------------------------------------------------------------
// Shared editor footer: 🗑 Delete (left) · Cancel / Save (right)
// ---------------------------------------------------------------------------
function EditorFooter(props: {
  saving: boolean
  rowError: string | null
  onCancel: () => void
  onSave: () => void
  onDelete: () => void
  Saved: React.ComponentType<{ className?: string }>
  Cancel: React.ComponentType<{ className?: string }>
  Trash: React.ComponentType<{ className?: string }>
  Spinner: React.ComponentType<{ className?: string }>
}) {
  const { saving, rowError, onCancel, onSave, onDelete, Saved, Cancel, Trash, Spinner } = props
  return (
    <div className="flex flex-col gap-1.5">
      {rowError ? (
        <p aria-live="polite" className="text-[11px] text-red-600">
          {rowError}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-xs font-medium text-stone-500 hover:text-red-600 disabled:opacity-50"
        >
          <Trash className="h-3.5 w-3.5" />
          Delete
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="ml-auto inline-flex min-h-[44px] items-center gap-1 rounded-lg px-4 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
        >
          <Cancel className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || rowError != null}
          title={rowError ?? 'Save'}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-4 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: ADMIN.ink }}
        >
          {saving ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : <Saved className="h-3.5 w-3.5" />}
          Save
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// + Add affordance (dashed, idle accent) — empty state + list footer.
// ---------------------------------------------------------------------------
function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  const Plus = AdminIcons.add
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 text-sm font-medium text-stone-700 transition-colors hover:text-stone-900"
      style={{
        outline: `1px dashed ${ADMIN.accent}`,
        outlineOffset: 2,
        background: `${ADMIN.accent}14`,
      }}
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  )
}