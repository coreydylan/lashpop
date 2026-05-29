'use client'

/**
 * EditableControls — three small inline-admin primitives sharing the design
 * system in adminTokens.ts:
 *
 *   • EditableToggle  — eye / eye-off "show on site" control (top-LEFT, structure).
 *   • EditableNumber  — "– n +" stepper with a unit; lives inside SectionSettingsDrawer.
 *   • EditableOrder   — drag-to-reorder grid/list with an always-visible ⠿ grip and
 *                       a mobile "Moving X (i of n)" Up/Down banner fallback.
 *
 * Every one of them obeys the universal rules:
 *   - admin mode OFF  → pure pass-through, ZERO admin chrome / DOM (like EditableText).
 *   - ONE save model  → defer to the dirty registry via useDirtyBlock; the call site
 *                        owns the real network call through an onChange/onReorder prop.
 *                        Optimistic local state + router.refresh() on individual save,
 *                        skipped when Save-all passes { skipRefresh }. No toasts.
 *   - Touch-first     → all tap targets >= 44px on mobile, affordances visible w/o hover.
 *   - Corner contract → structure (grip / eye) sits top-LEFT.
 *   - 1800ms green ✓ flash on the affordance after a successful save.
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import clsx from 'clsx'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { ADMIN, AdminIcons, COPY, editableIdleStyle } from './adminTokens'
import { useDirtyBlock } from './useDirtyBlock'

type SaveOpts = { skipRefresh?: boolean }

/** Shared 1800ms green ✓ flash, cleared on unmount so we never setState late. */
function useJustSaved(): [boolean, () => void] {
  const [justSaved, setJustSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  const flash = useCallback(() => {
    setJustSaved(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setJustSaved(false), 1800)
  }, [])
  return [justSaved, flash]
}

/* ───────────────────────────── EditableToggle ───────────────────────────── */

export interface EditableToggleProps {
  /** Stable id for the dirty registry. Falls back to a generated id. */
  id?: string
  /** Human label shown in the chrome's dirty list, e.g. "Emily — show on site". */
  label: string
  /** Current "show on site" state. true = visible, false = hidden. */
  visible: boolean
  /** Persist the new visibility. The call site owns the endpoint. */
  onChange: (visible: boolean) => Promise<void>
  className?: string
}

/**
 * The 44px eye control for "show on site". This renders ONLY the toggle button +
 * its plain-English label — dimming the card and painting the diagonal "Hidden
 * from your site" ribbon is the CALLER's job (the toggle has no idea what shape
 * the card it governs is). Off → pure pass-through (renders nothing).
 */
export function EditableToggle({
  id,
  label,
  visible,
  onChange,
  className,
}: EditableToggleProps) {
  const { enabled, refresh } = useAdminMode()
  const generatedId = useId()
  const blockId = id ?? generatedId

  const [saved, setSaved] = useState(visible)
  const [draft, setDraft] = useState(visible)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, flash] = useJustSaved()

  // Reconcile with the server prop only on a genuine change (mirrors EditableText).
  const prevProp = useRef(visible)
  useEffect(() => {
    if (visible !== prevProp.current) {
      prevProp.current = visible
      setSaved(visible)
      setDraft(visible)
    }
  }, [visible])

  const draftRef = useRef(draft)
  draftRef.current = draft

  const doSave = useCallback(
    async (opts?: SaveOpts) => {
      const next = draftRef.current
      setSaving(true)
      setError(null)
      try {
        await onChange(next)
        setSaved(next)
        setSaving(false)
        flash()
        if (!opts?.skipRefresh) refresh()
      } catch (e) {
        setSaving(false)
        setError(e instanceof Error ? e.message : COPY.saveError)
        throw e
      }
    },
    [onChange, refresh, flash]
  )

  const doDiscard = useCallback(() => {
    setDraft(saved)
    setError(null)
  }, [saved])

  useDirtyBlock({
    id: blockId,
    label,
    dirty: draft !== saved,
    save: doSave,
    discard: doDiscard,
  })

  if (!enabled) return null

  const Icon = draft ? AdminIcons.show : AdminIcons.hide
  const text = draft ? COPY.hideFromSite : COPY.showOnSite // label = the ACTION the tap performs

  return (
    <span className={clsx('inline-flex flex-col items-start gap-0.5', className)}>
      <button
        type="button"
        aria-label={`${label} — ${text}`}
        aria-pressed={!draft}
        title={text}
        disabled={saving}
        onClick={() => setDraft(d => !d)}
        className="group/toggle inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md px-2 disabled:opacity-50"
        style={
          draft
            ? { background: `${ADMIN.accent}14`, outline: `1px dashed ${ADMIN.accent}`, outlineOffset: 1 }
            : { background: `${ADMIN.accentStrong}1a`, outline: `1px solid ${ADMIN.accentStrong}`, outlineOffset: 1 }
        }
      >
        {saving ? (
          <AdminIcons.spinner className="h-4 w-4 animate-spin" style={{ color: ADMIN.accentStrong }} />
        ) : justSaved ? (
          <AdminIcons.saved className="h-4 w-4" style={{ color: '#059669' }} />
        ) : (
          <Icon className="h-4 w-4" style={{ color: draft ? ADMIN.ink : ADMIN.accentStrong }} />
        )}
        <span className="text-[11px] font-medium" style={{ color: draft ? ADMIN.ink : ADMIN.accentStrong }}>
          {text}
        </span>
      </button>
      {error ? <span className="text-[11px] text-red-600">{error}</span> : null}
    </span>
  )
}

/* ───────────────────────────── EditableNumber ───────────────────────────── */

export interface EditableNumberProps {
  /** Stable id for the dirty registry. Falls back to a generated id. */
  id?: string
  /** Plain-English field label, e.g. "Time on each photo". */
  label: string
  value: number
  /** Plain unit shown after the value, e.g. "sec", "photos". */
  unit: string
  min?: number
  max?: number
  step?: number
  /** Persist the new number. The call site owns the endpoint. */
  onChange: (value: number) => Promise<void>
  className?: string
}

/**
 * A "– n +" stepper meant to live inside a SectionSettingsDrawer (never floating
 * on the page). Off → pure pass-through: renders "n unit" plain text.
 */
export function EditableNumber({
  id,
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
  className,
}: EditableNumberProps) {
  const { enabled, refresh } = useAdminMode()
  const generatedId = useId()
  const blockId = id ?? generatedId

  const [saved, setSaved] = useState(value)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, flash] = useJustSaved()

  const prevProp = useRef(value)
  useEffect(() => {
    if (value !== prevProp.current) {
      prevProp.current = value
      setSaved(value)
      setDraft(value)
    }
  }, [value])

  const clamp = useCallback(
    (n: number) => {
      let next = n
      if (typeof min === 'number') next = Math.max(min, next)
      if (typeof max === 'number') next = Math.min(max, next)
      return next
    },
    [min, max]
  )

  const draftRef = useRef(draft)
  draftRef.current = draft

  const doSave = useCallback(
    async (opts?: SaveOpts) => {
      const next = draftRef.current
      setSaving(true)
      setError(null)
      try {
        await onChange(next)
        setSaved(next)
        setSaving(false)
        flash()
        if (!opts?.skipRefresh) refresh()
      } catch (e) {
        setSaving(false)
        setError(e instanceof Error ? e.message : COPY.saveError)
        throw e
      }
    },
    [onChange, refresh, flash]
  )

  const doDiscard = useCallback(() => {
    setDraft(saved)
    setError(null)
  }, [saved])

  const dirty = draft !== saved
  useDirtyBlock({ id: blockId, label, dirty, save: doSave, discard: doDiscard })

  if (!enabled) {
    return (
      <span className={className}>
        {value} {unit}
      </span>
    )
  }

  const atMin = typeof min === 'number' && draft - step < min
  const atMax = typeof max === 'number' && draft + step > max

  const stepBtn =
    'inline-flex h-[44px] w-[44px] items-center justify-center rounded-md text-lg font-semibold text-stone-800 disabled:opacity-40'

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <span className="text-[13px] font-medium text-stone-700">{label}</span>
      <div
        className="inline-flex items-center gap-1 self-start rounded-lg p-0.5"
        style={editableIdleStyle}
        data-admin-editable
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={saving || atMin}
          onClick={() => setDraft(d => clamp(d - step))}
          className={stepBtn}
        >
          –
        </button>
        <span className="min-w-[64px] text-center text-sm font-semibold tabular-nums text-stone-900">
          {justSaved ? (
            <AdminIcons.saved className="mr-1 inline h-4 w-4 align-middle" style={{ color: '#059669' }} />
          ) : null}
          {draft} {unit}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={saving || atMax}
          onClick={() => setDraft(d => clamp(d + step))}
          className={stepBtn}
        >
          +
        </button>
        {saving ? <AdminIcons.spinner className="ml-1 h-4 w-4 animate-spin text-stone-500" /> : null}
      </div>
      {error ? <span className="text-[11px] text-red-600">{error}</span> : null}
    </div>
  )
}

/* ───────────────────────────── EditableOrder ────────────────────────────── */

export interface EditableOrderProps<T> {
  /** Stable id for the dirty registry. Falls back to a generated id. */
  id?: string
  /** Human label shown in the chrome's dirty list, e.g. "Team — order". */
  label: string
  items: T[]
  /** Stable string key for each item (used as the reorder value + React key). */
  getKey: (item: T) => string
  /** Render one item's content. The grip overlay is added by EditableOrder. */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Persist the new order as an array of keys. The call site owns the endpoint. */
  onReorder: (orderedIds: string[]) => Promise<void>
  /** Layout of the wrapped list. 'grid' (default, wraps) or 'list' (column). */
  layout?: 'grid' | 'list'
  className?: string
  /** Singular noun for the mobile banner, e.g. "Emily". Falls back to "item". */
  itemNoun?: (item: T) => string
}

/**
 * Wraps a grid/list to drag-reorder via framer-motion Reorder. Every item shows
 * an always-visible ⠿ grip (top-LEFT, structure) that is both the drag handle
 * (desktop) and the entry point to the mobile Up/Down banner fallback. Off →
 * pure pass-through: renders items in DOM order with no admin DOM.
 */
export function EditableOrder<T>({
  id,
  label,
  items,
  getKey,
  renderItem,
  onReorder,
  layout = 'grid',
  className,
  itemNoun,
}: EditableOrderProps<T>) {
  const { enabled, refresh } = useAdminMode()
  const generatedId = useId()
  const blockId = id ?? generatedId

  // Map of key -> item so we can render in `order` sequence cheaply.
  const byKey = new Map(items.map(it => [getKey(it), it]))
  const serverOrder = items.map(getKey)

  const [savedOrder, setSavedOrder] = useState<string[]>(serverOrder)
  const [order, setOrder] = useState<string[]>(serverOrder)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, flash] = useJustSaved()
  // Mobile banner: key of the item currently being moved via Up/Down, or null.
  const [movingKey, setMovingKey] = useState<string | null>(null)

  // Reconcile with the server only when the set of keys (membership or order)
  // actually changes — additions/removals from the call site must win.
  const serverSig = serverOrder.join(' ')
  const prevSig = useRef(serverSig)
  useEffect(() => {
    if (serverSig !== prevSig.current) {
      prevSig.current = serverSig
      setSavedOrder(serverOrder)
      setOrder(serverOrder)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSig])

  const orderRef = useRef(order)
  orderRef.current = order

  const doSave = useCallback(
    async (opts?: SaveOpts) => {
      const next = orderRef.current
      setSaving(true)
      setError(null)
      try {
        await onReorder(next)
        setSavedOrder(next)
        setSaving(false)
        flash()
        if (!opts?.skipRefresh) refresh()
      } catch (e) {
        setSaving(false)
        setError(e instanceof Error ? e.message : COPY.saveError)
        throw e
      }
    },
    [onReorder, refresh, flash]
  )

  const doDiscard = useCallback(() => {
    setOrder(savedOrder)
    setMovingKey(null)
    setError(null)
  }, [savedOrder])

  const dirty = order.join(' ') !== savedOrder.join(' ')
  useDirtyBlock({ id: blockId, label, dirty, save: doSave, discard: doDiscard })

  // ---- Public render: zero admin DOM ----
  if (!enabled) {
    const Wrapper = layout === 'grid' ? 'div' : 'ul'
    return (
      <Wrapper className={className}>
        {items.map((item, i) => renderItem(item, i))}
      </Wrapper>
    )
  }

  const moveBy = (key: string, delta: number) => {
    setOrder(prev => {
      const i = prev.indexOf(key)
      const j = i + delta
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const movingIndex = movingKey ? order.indexOf(movingKey) : -1
  const movingItem = movingKey ? byKey.get(movingKey) : undefined
  const movingName =
    movingItem && itemNoun ? itemNoun(movingItem) : 'item'

  return (
    <div className={clsx('relative', className)} data-admin-order>
      <Reorder.Group
        axis="y"
        as={layout === 'grid' ? 'div' : 'ul'}
        values={order}
        onReorder={setOrder}
        className={layout === 'grid' ? 'contents' : undefined}
      >
        {order.map((key, index) => {
          const item = byKey.get(key)
          if (!item) return null
          return (
            <OrderItem
              key={key}
              value={key}
              isMoving={movingKey === key}
              onGripActivate={() =>
                setMovingKey(prev => (prev === key ? null : key))
              }
            >
              {renderItem(item, index)}
            </OrderItem>
          )
        })}
      </Reorder.Group>

      {/* Mobile Up/Down banner fallback — visible whenever an item is "picked up"
          via its grip. Up/Down are 44px tap targets; Done commits to the dirty
          registry (still defers to Save all). */}
      {movingKey && movingIndex >= 0 ? (
        <div
          className="fixed inset-x-0 bottom-0 z-[10000] flex items-center justify-between gap-2 px-3 py-2 text-white shadow-2xl sm:mx-auto sm:max-w-md sm:rounded-t-xl"
          style={{ background: ADMIN.ink }}
          role="toolbar"
          aria-label={`Reordering ${label}`}
        >
          <span className="text-sm font-medium">
            Moving {movingName} ({movingIndex + 1} of {order.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Move up"
              disabled={movingIndex === 0}
              onClick={() => moveBy(movingKey, -1)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg font-semibold disabled:opacity-40 hover:bg-white/10"
            >
              ↑ Up
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={movingIndex === order.length - 1}
              onClick={() => moveBy(movingKey, 1)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg font-semibold disabled:opacity-40 hover:bg-white/10"
            >
              ↓ Down
            </button>
            <button
              type="button"
              onClick={() => setMovingKey(null)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-3 text-sm font-semibold"
              style={{ background: ADMIN.accent, color: ADMIN.ink }}
            >
              {justSaved ? <AdminIcons.saved className="h-4 w-4" /> : 'Done'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
      {saving ? (
        <span className="absolute right-1 top-1 z-10 inline-flex items-center">
          <AdminIcons.spinner className="h-4 w-4 animate-spin text-stone-500" />
        </span>
      ) : null}
    </div>
  )
}

/**
 * One reorderable cell. Wraps the caller's content in a Reorder.Item and overlays
 * an always-visible ⠿ grip (top-LEFT). Pointer-down on the grip starts a framer
 * drag (desktop); a plain click toggles the mobile Up/Down banner via onGripActivate.
 */
function OrderItem({
  value,
  isMoving,
  onGripActivate,
  children,
}: {
  value: string
  isMoving: boolean
  onGripActivate: () => void
  children: React.ReactNode
}) {
  const controls = useDragControls()
  const dragged = useRef(false)

  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      className="relative"
      style={
        isMoving
          ? { outline: `2px solid ${ADMIN.accentStrong}`, outlineOffset: 2, borderRadius: 4 }
          : undefined
      }
    >
      {children}
      <button
        type="button"
        aria-label="Drag to reorder, or tap for up / down"
        // Start the framer drag on pointer-down (desktop); a click with no drag
        // toggles the mobile banner so touch users get an explicit Up/Down path.
        onPointerDown={e => {
          dragged.current = false
          controls.start(e)
        }}
        onPointerMove={() => {
          dragged.current = true
        }}
        onClick={() => {
          if (!dragged.current) onGripActivate()
        }}
        className="absolute left-1 top-1 z-20 inline-flex h-9 w-9 min-h-0 min-w-0 cursor-grab touch-none items-center justify-center rounded-md text-white shadow active:cursor-grabbing"
        style={{ background: isMoving ? ADMIN.accentStrong : ADMIN.accent }}
      >
        <AdminIcons.grip className="h-4 w-4" />
      </button>
    </Reorder.Item>
  )
}
