'use client'

/**
 * SectionSettingsDrawer — the off-page settings surface for inline admin mode.
 *
 * For config with no on-page representation (SEO, slideshow timing, map pin,
 * instagram, robots). Opened by a section's ⚙ chip (top-right) or the chrome's
 * section index. Desktop = a fixed right-side rail (~360px); mobile = a
 * bottom-sheet with a drag handle (max-h dvh, scrollable). Live preview is the
 * point — the caller supplies the preview + fields as `children`.
 *
 * Save model (one rule, no exceptions): while `dirty`, the drawer registers a
 * DirtyBlock with the provider via useDirtyBlock so the chrome shows the count
 * and "Save all" can batch it. Persistence is endpoint-agnostic — the call site
 * owns the network call via `onSave`. Save runs optimistically + router.refresh()
 * on an individual save and skips the refresh when batched by Save-all. NO toasts;
 * feedback is the universal 1800ms green ✓ flash on the Save button.
 *
 * When admin mode is OFF (!enabled) the drawer + chip render NOTHING — pure
 * pass-through, zero admin chrome/DOM, exactly like EditableText.
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { useConfirm } from './useConfirm'
import { useDirtyBlock } from './useDirtyBlock'
import { ADMIN, AdminIcons, COPY } from './adminTokens'

export interface SectionSettingsDrawerProps {
  /** Whether the drawer is open. Controlled by the call site (the ⚙ chip). */
  open: boolean
  /** Close request (chrome ✕, backdrop tap, Esc). Caller flips `open`. */
  onClose: () => void
  /** Section name, e.g. "Slideshow" or "Page SEO — Home". */
  title: string
  /** Whether there are unsaved edits in this drawer. Drives the dirty registry. */
  dirty?: boolean
  /**
   * Persist the current edits. Endpoint-agnostic — the call site owns the write.
   * Resolves on success, throws on failure. `skipRefresh` is passed by Save-all
   * so the provider can issue a single router.refresh().
   */
  onSave?: (opts?: { skipRefresh?: boolean }) => Promise<void>
  /** Revert local edits to last-saved. Called on Cancel and on discardAll. */
  onCancel?: () => void
  /** The fields + live preview for this section. */
  children: React.ReactNode
  /** Optional node rendered under a "▸ Advanced" disclosure (noindex, canonical…). */
  advanced?: React.ReactNode
  /** Stable id for the dirty registry. Falls back to a generated id. */
  id?: string
}

const RAIL_WIDTH = 360

/**
 * SectionGearButton — the ⚙ chip placed top-RIGHT on a section while admin mode
 * is on (corner contract: top-right = edit intent). Solid-fill so it reads
 * distinct from the dashed editable text cue. Renders nothing when admin is off.
 */
export function SectionGearButton({
  onClick,
  label = 'Section settings',
  className,
}: {
  onClick: () => void
  label?: string
  className?: string
}) {
  const { enabled } = useAdminMode()
  if (!enabled) return null

  const Gear = AdminIcons.settings
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      title={label}
      className={clsx(
        'absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition-colors',
        className
      )}
      style={{ background: ADMIN.ink }}
    >
      <Gear className="h-4 w-4" />
    </button>
  )
}

export function SectionSettingsDrawer({
  open,
  onClose,
  title,
  dirty = false,
  onSave,
  onCancel,
  children,
  advanced,
  id,
}: SectionSettingsDrawerProps) {
  const { enabled, refresh } = useAdminMode()
  const generatedId = useId()
  const blockId = id ?? generatedId

  const { confirm, dialog } = useConfirm()

  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // justSaved checkmark timer — cleared on unmount so we never setState on an
  // unmounted block (mirrors EditableText).
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    []
  )

  // ---- Save: optimistic flash + refresh (skip when batched by Save-all) ----
  const doSave = useCallback(
    async (opts?: { skipRefresh?: boolean }) => {
      if (!onSave) return
      setSaving(true)
      setError(null)
      try {
        await onSave({ skipRefresh: opts?.skipRefresh })
        setSaving(false)
        setJustSaved(true)
        if (flashTimer.current) clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setJustSaved(false), 1800)
        // "Save all" passes skipRefresh and issues a single refresh itself.
        if (!opts?.skipRefresh) refresh()
      } catch (e) {
        setSaving(false)
        setError(e instanceof Error ? e.message : COPY.saveError)
        throw e
      }
    },
    [onSave, refresh]
  )

  const doCancel = useCallback(() => {
    onCancel?.()
    setError(null)
  }, [onCancel])

  // Register with the provider while dirty so the chrome shows the count and
  // Save-all can batch this drawer. save() forwards skipRefresh through.
  useDirtyBlock({
    id: blockId,
    label: title,
    dirty: Boolean(enabled && dirty),
    save: opts => doSave({ skipRefresh: opts?.skipRefresh ?? false }),
    discard: () => doCancel(),
  })

  // Closing with unsaved edits: confirm (re-uses the one destructive string so
  // nothing is silently lost), then discard local edits and close.
  const requestClose = useCallback(async () => {
    if (dirty) {
      const ok = await confirm(COPY.removeConfirm('your unsaved changes'))
      if (!ok) return
      doCancel()
    }
    onClose()
  }, [dirty, confirm, doCancel, onClose])

  // Esc closes (with the same unsaved-edits guard) while open.
  useEffect(() => {
    if (!enabled || !open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        void requestClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, open, requestClose])

  // ---- Pure pass-through when admin mode is off or before hydration ----
  if (!enabled || !mounted) return null

  const Gear = AdminIcons.settings
  const Saved = AdminIcons.saved
  const Spinner = AdminIcons.spinner
  const Close = AdminIcons.cancel

  const header = (
    <div
      className="flex items-center gap-2 px-4 py-3 text-white"
      style={{ background: ADMIN.ink }}
    >
      <Gear className="h-4 w-4 shrink-0 opacity-90" />
      <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
      {dirty ? (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Unsaved
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => void requestClose()}
        aria-label="Close settings"
        className="inline-flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
      >
        <Close className="h-4 w-4" />
      </button>
    </div>
  )

  const body = (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="space-y-4">{children}</div>

      {advanced ? (
        <div className="mt-5 border-t border-stone-200 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            aria-expanded={showAdvanced}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            <span
              className="inline-block transition-transform"
              style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none' }}
              aria-hidden
            >
              ▸
            </span>
            Advanced
          </button>
          {showAdvanced ? (
            <div className="mt-2 space-y-4 text-sm text-stone-700">{advanced}</div>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 text-[11px] leading-snug text-stone-400">{COPY.goLiveHint}</p>
    </div>
  )

  const footer = (
    <div className="border-t border-stone-200 bg-white px-4 py-3">
      {error ? (
        <div className="mb-2 text-[11px] text-red-600" role="alert">
          {error}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={doCancel}
          disabled={saving || !dirty}
          className="min-h-[44px] flex-1 rounded-lg px-4 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void doSave()}
          disabled={saving || !dirty}
          title={dirty ? 'Save' : 'No changes to save'}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: ADMIN.ink }}
        >
          {saving ? (
            <Spinner className="h-4 w-4 animate-spin" />
          ) : justSaved ? (
            <Saved className="h-4 w-4 text-emerald-400" />
          ) : null}
          {justSaved && !saving ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )

  // z-[10000]: above page content; an open drawer is the design's intent to
  // collapse page chrome to a single layer. The confirm dialog uses z-[10001].
  const surface = (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label={title}>
          {/* Backdrop — tap to request close (mobile-friendly; guards unsaved). */}
          <motion.div
            className="absolute inset-0 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => void requestClose()}
          />

          {/* Desktop: fixed right-side rail (~360px). */}
          <motion.aside
            className="absolute right-0 top-0 hidden h-full flex-col bg-white shadow-2xl md:flex"
            style={{ width: RAIL_WIDTH }}
            initial={{ x: RAIL_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: RAIL_WIDTH }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            {header}
            {body}
            {footer}
          </motion.aside>

          {/* Mobile: bottom-sheet with a drag handle, scrollable to dvh. */}
          <motion.aside
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white shadow-2xl md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) void requestClose()
            }}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-2.5">
              <span className="h-1.5 w-10 rounded-full bg-stone-300" aria-hidden />
            </div>
            {header}
            {body}
            {footer}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  )

  return createPortal(
    <>
      {surface}
      {dialog}
    </>,
    document.body
  )
}
