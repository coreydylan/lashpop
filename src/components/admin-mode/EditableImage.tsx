'use client'

/**
 * EditableImage / EditableImageList — image-editing primitives for admin mode.
 *
 * When admin mode is OFF both are PURE pass-throughs: they render exactly the
 * <Image> / tile grid a public visitor sees, with zero admin chrome, listeners,
 * or extra DOM — same contract as EditableText.
 *
 * When ON:
 *  - EditableImage shows the universal dashed "editable" outline + a top-RIGHT
 *    🖼 affordance (corner contract = edit intent). Tapping reveals a small
 *    toolbar: Replace · ⟳ Rotate · 🗑 · (optional) Describe photo (alt). "Replace"
 *    opens MiniDamExplorer; Rotate applies an INSTANT CSS transform preview while
 *    `onRotate` re-encodes, then swaps to the returned url/width/height. When the
 *    image is sourced from Vagaro and not yet overridden it surfaces
 *    "Using Vagaro photo · ⤺".
 *  - EditableImageList renders tiles (⠿ grip + ★ set-primary in the top-LEFT =
 *    structure corner, 🖼 swap top-RIGHT) plus a dashed "+ Add a photo" tile.
 *    Add / remove / rotate / set-primary are immediate awaited calls that still
 *    flow through optimistic UI; only a PENDING REORDER registers a DirtyBlock so
 *    it defers to "Save all".
 *
 * The call site owns every network call via the on* props — these components are
 * endpoint-agnostic. Individual saves optimistically update local state and call
 * router.refresh() (skipped when batched by Save-all). No toasts.
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import Image from 'next/image'
import clsx from 'clsx'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { ADMIN, AdminIcons, COPY, editableIdleStyle } from './adminTokens'
import { useDirtyBlock } from './useDirtyBlock'
import { useConfirm } from './useConfirm'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** Vagaro source disclosure: when a photo is inherited from Vagaro (not yet
 *  overridden by an admin edit) we surface "Using Vagaro photo · ⤺revert". */
export interface VagaroImageSource {
  isOverridden: boolean
  /** Revert back to the Vagaro-supplied photo. */
  onUseVagaro: () => void | Promise<void>
}

export interface EditableImageProps {
  /** Stable id for the dirty registry / a11y wiring. Falls back to a generated id. */
  id?: string
  /** Human label shown in chrome + a11y, e.g. "Emily — portrait". */
  label: string
  src: string
  width?: number
  height?: number
  alt?: string
  /** Vagaro source disclosure (portraits etc.). */
  vagaro?: VagaroImageSource
  /** Persist a newly chosen asset. Resolves on success, throws on failure. */
  onReplace: (asset: Asset) => Promise<void>
  /** Rotate by `deg` (cumulative absolute degrees). Returns the re-encoded url + dims. */
  onRotate?: (deg: number) => Promise<{ url: string; width: number; height: number }>
  /** Persist alt text ("Describe photo"). */
  onAltSave?: (alt: string) => Promise<void>
  /** Pre-filter the DAM picker to relevant tags (e.g. ["website:hero"]). */
  damFilterTags?: string[]
  className?: string
  /** Pass through to next/image (e.g. for non-optimizable hosts). */
  unoptimized?: boolean
}

interface ListImage {
  id: string
  url: string
  width?: number
  height?: number
  alt?: string
  primary?: boolean
}

export interface EditableImageListProps {
  /** Stable id for the dirty registry. Falls back to a generated id. */
  id?: string
  /** Human label shown in chrome, e.g. "Recent Work". */
  label: string
  images: ListImage[]
  /** Add one or more photos (picker opens with allowMultiple). */
  onAdd: (assets: Asset[]) => Promise<void>
  /** Remove a photo (confirmed). */
  onRemove: (imageId: string) => Promise<void>
  /** Persist a new order. DEFERS to Save-all via a dirty block. */
  onReorder: (orderedIds: string[]) => Promise<void>
  /** Mark a photo as primary / featured. */
  onSetPrimary: (imageId: string) => Promise<void>
  /** Per-tile rotate (optional). */
  onRotate?: (
    imageId: string,
    deg: number
  ) => Promise<{ url: string; width: number; height: number }>
  damFilterTags?: string[]
  className?: string
  unoptimized?: boolean
}

// ---------------------------------------------------------------------------
// Small shared bits
// ---------------------------------------------------------------------------

const FLASH_MS = 1800

/** Round a CSS-preview rotation onto the next 90° step. */
function nextRotation(current: number): number {
  return current + 90
}

/** A charcoal pill button used across the toolbars (>=44px tall on mobile). */
function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
  tone = 'default',
  className,
}: {
  onClick: () => void
  disabled?: boolean
  title?: string
  children: React.ReactNode
  tone?: 'default' | 'ghost' | 'danger'
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-50 sm:min-h-0 sm:py-1.5',
        tone === 'default' && 'text-white',
        tone === 'ghost' && 'text-stone-600 hover:bg-stone-100',
        tone === 'danger' && 'text-white',
        className
      )}
      style={
        tone === 'default'
          ? { background: ADMIN.ink }
          : tone === 'danger'
          ? { background: ADMIN.accentStrong }
          : undefined
      }
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// EditableImage
// ---------------------------------------------------------------------------

export function EditableImage({
  id,
  label,
  src,
  width,
  height,
  alt,
  vagaro,
  onReplace,
  onRotate,
  onAltSave,
  damFilterTags,
  className,
  unoptimized,
}: EditableImageProps) {
  const { enabled, refresh } = useAdminMode()
  const generatedId = useId()
  const blockId = id ?? generatedId

  // Optimistic local view of the persisted image.
  const [view, setView] = useState({ src, width, height, alt: alt ?? '' })
  const prevSrcProp = useRef(src)
  useEffect(() => {
    if (src !== prevSrcProp.current) {
      prevSrcProp.current = src
      setView({ src, width, height, alt: alt ?? '' })
    }
  }, [src, width, height, alt])

  const [open, setOpen] = useState(false)
  const [picker, setPicker] = useState(false)
  const [altEditing, setAltEditing] = useState(false)
  const [altDraft, setAltDraft] = useState(alt ?? '')
  const [busy, setBusy] = useState<null | 'replace' | 'rotate' | 'alt' | 'vagaro'>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Instant CSS preview applied while onRotate re-encodes. */
  const [previewRotation, setPreviewRotation] = useState(0)

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    []
  )
  const flash = useCallback(() => {
    setJustSaved(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setJustSaved(false), FLASH_MS)
  }, [])

  const ReplaceIcon = AdminIcons.swapImage
  const RotateIcon = AdminIcons.revert
  const RevertIcon = AdminIcons.revert
  const SavedIcon = AdminIcons.saved
  const Spinner = AdminIcons.spinner

  const handleSelect = useCallback(
    async (asset: Asset) => {
      setPicker(false)
      setBusy('replace')
      setError(null)
      try {
        await onReplace(asset)
        setView(v => ({ ...v, src: asset.filePath, width: undefined, height: undefined }))
        setPreviewRotation(0)
        flash()
        refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : COPY.saveError)
      } finally {
        setBusy(null)
      }
    },
    [onReplace, flash, refresh]
  )

  const handleRotate = useCallback(async () => {
    if (!onRotate || busy) return
    const target = nextRotation(previewRotation)
    setPreviewRotation(target) // instant CSS preview
    setBusy('rotate')
    setError(null)
    try {
      const res = await onRotate(target % 360)
      setView(v => ({ ...v, src: res.url, width: res.width, height: res.height }))
      setPreviewRotation(0) // the re-encoded image already bakes in the rotation
      flash()
      refresh()
    } catch (e) {
      setPreviewRotation(0) // roll the preview back on failure
      setError(e instanceof Error ? e.message : COPY.saveError)
    } finally {
      setBusy(null)
    }
  }, [onRotate, busy, previewRotation, flash, refresh])

  const handleAltSave = useCallback(async () => {
    if (!onAltSave) return
    setBusy('alt')
    setError(null)
    try {
      await onAltSave(altDraft)
      setView(v => ({ ...v, alt: altDraft }))
      setAltEditing(false)
      flash()
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : COPY.saveError)
    } finally {
      setBusy(null)
    }
  }, [onAltSave, altDraft, flash, refresh])

  const handleUseVagaro = useCallback(async () => {
    if (!vagaro || busy) return
    setBusy('vagaro')
    setError(null)
    try {
      await vagaro.onUseVagaro()
      flash()
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : COPY.saveError)
    } finally {
      setBusy(null)
    }
  }, [vagaro, busy, flash, refresh])

  // ---- Public render: zero admin DOM ----
  if (!enabled) {
    return (
      <ImageView
        src={view.src}
        width={view.width}
        height={view.height}
        alt={view.alt}
        unoptimized={unoptimized}
        className={className}
      />
    )
  }

  const showVagaroNote = Boolean(vagaro && !vagaro.isOverridden)

  return (
    <div
      className={clsx('group/admin relative inline-block', className)}
      style={editableIdleStyle}
      data-admin-editable
    >
      <ImageView
        src={view.src}
        width={view.width}
        height={view.height}
        alt={view.alt}
        unoptimized={unoptimized}
        previewRotation={previewRotation}
      />

      {/* Top-RIGHT = edit intent (corner contract). */}
      <button
        type="button"
        aria-label={`Edit ${label}`}
        onClick={() => setOpen(o => !o)}
        className="absolute right-1 top-1 z-10 inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full text-white shadow"
        style={{ background: open ? ADMIN.accentStrong : ADMIN.accent }}
      >
        {justSaved ? <SavedIcon className="h-4 w-4" /> : <ReplaceIcon className="h-4 w-4" />}
      </button>

      {/* Vagaro source disclosure. */}
      {showVagaroNote ? (
        <button
          type="button"
          onClick={handleUseVagaro}
          disabled={busy === 'vagaro'}
          className="absolute bottom-1 left-1 z-10 inline-flex min-h-0 items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm disabled:opacity-50"
          title="Using the Vagaro photo — tap to keep it"
        >
          {busy === 'vagaro' ? (
            <Spinner className="h-3 w-3 animate-spin" />
          ) : (
            <RevertIcon className="h-3 w-3" />
          )}
          Using Vagaro photo
        </button>
      ) : null}

      {/* Toolbar */}
      {open ? (
        <div
          className="absolute inset-x-1 bottom-1 z-20 rounded-lg bg-white/95 p-1.5 shadow-lg backdrop-blur-sm"
          style={{ outline: `2px solid ${ADMIN.accentStrong}` }}
          onClick={e => e.stopPropagation()}
        >
          {altEditing ? (
            <div>
              <label className="sr-only" htmlFor={`${blockId}-alt`}>
                Describe this photo
              </label>
              <input
                id={`${blockId}-alt`}
                autoFocus
                type="text"
                value={altDraft}
                placeholder="Describe this photo (helps screen readers + Google)"
                onChange={e => setAltDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setAltEditing(false)
                    setAltDraft(view.alt)
                  } else if (e.key === 'Enter' && !busy) {
                    handleAltSave()
                  }
                }}
                className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 outline-none focus-visible:ring-2 focus-visible:ring-[#C9A9A6]"
              />
              <div className="mt-1.5 flex items-center gap-2">
                <ToolbarButton onClick={handleAltSave} disabled={busy === 'alt'} title="Save description">
                  {busy === 'alt' ? (
                    <Spinner className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SavedIcon className="h-3.5 w-3.5" />
                  )}
                  Save
                </ToolbarButton>
                <ToolbarButton
                  tone="ghost"
                  onClick={() => {
                    setAltEditing(false)
                    setAltDraft(view.alt)
                  }}
                  disabled={busy === 'alt'}
                >
                  Cancel
                </ToolbarButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <ToolbarButton onClick={() => setPicker(true)} disabled={Boolean(busy)} title="Replace photo">
                {busy === 'replace' ? (
                  <Spinner className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ReplaceIcon className="h-3.5 w-3.5" />
                )}
                Replace
              </ToolbarButton>
              {onRotate ? (
                <ToolbarButton tone="ghost" onClick={handleRotate} disabled={Boolean(busy)} title="Rotate 90°">
                  <RotateIcon className={clsx('h-3.5 w-3.5', busy === 'rotate' && 'animate-spin')} />
                  Rotate
                </ToolbarButton>
              ) : null}
              {onAltSave ? (
                <ToolbarButton
                  tone="ghost"
                  onClick={() => {
                    setAltDraft(view.alt)
                    setAltEditing(true)
                  }}
                  disabled={Boolean(busy)}
                  title="Describe photo (alt text)"
                >
                  Describe photo
                </ToolbarButton>
              ) : null}
            </div>
          )}

          {error ? <div className="mt-1.5 text-[11px] text-red-600">{error}</div> : null}
          <div className="mt-1.5 text-[10px] leading-snug text-stone-400">{COPY.goLiveHint}</div>
        </div>
      ) : null}

      <MiniDamExplorer
        isOpen={picker}
        onClose={() => setPicker(false)}
        onSelect={handleSelect}
        selectedAssetId={null}
        title="Replace photo"
        subtitle="Choose from your media library, or upload a new one"
        filterTags={damFilterTags}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// EditableImageList
// ---------------------------------------------------------------------------

export function EditableImageList({
  id,
  label,
  images,
  onAdd,
  onRemove,
  onReorder,
  onSetPrimary,
  onRotate,
  damFilterTags,
  className,
  unoptimized,
}: EditableImageListProps) {
  const { enabled, refresh } = useAdminMode()
  const { confirm, dialog } = useConfirm()
  const generatedId = useId()
  const blockId = id ?? generatedId

  // Optimistic order. `order` holds the working ids; `saved` is the last
  // persisted order so we can both detect dirtiness and discard.
  const byId = useMemo(() => {
    const m = new Map<string, ListImage>()
    for (const img of images) m.set(img.id, img)
    return m
  }, [images])

  const serverOrder = useMemo(() => images.map(i => i.id), [images])
  const [order, setOrder] = useState<string[]>(serverOrder)
  const [savedOrder, setSavedOrder] = useState<string[]>(serverOrder)

  // Reconcile when the server list identity changes (add/remove land here).
  const prevServer = useRef(serverOrder.join('|'))
  useEffect(() => {
    const key = serverOrder.join('|')
    if (key !== prevServer.current) {
      prevServer.current = key
      setOrder(serverOrder)
      setSavedOrder(serverOrder)
    }
  }, [serverOrder])

  const [picker, setPicker] = useState(false)
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [reorderSaving, setReorderSaving] = useState(false)

  const orderDirty = order.join('|') !== savedOrder.join('|')

  const saveReorder = useCallback(
    async (opts?: { skipRefresh?: boolean }) => {
      setReorderSaving(true)
      setError(null)
      try {
        await onReorder(order)
        setSavedOrder(order)
        if (!opts?.skipRefresh) refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : COPY.saveError)
        throw e
      } finally {
        setReorderSaving(false)
      }
    },
    [onReorder, order, refresh]
  )

  // Only the pending REORDER registers a dirty block; add/remove/primary/rotate
  // are immediate awaited calls.
  useDirtyBlock({
    id: `${blockId}:reorder`,
    label: `${label} — order`,
    dirty: orderDirty,
    save: saveReorder,
    discard: () => setOrder(savedOrder),
  })

  const AddIcon = AdminIcons.add
  const GripIcon = AdminIcons.grip
  const StarIcon = AdminIcons.feature
  const ReplaceIcon = AdminIcons.swapImage
  const RotateIcon = AdminIcons.revert
  const RemoveIcon = AdminIcons.remove
  const Spinner = AdminIcons.spinner

  const move = useCallback((src: string, target: string) => {
    setOrder(prev => {
      if (src === target) return prev
      const next = prev.filter(x => x !== src)
      const at = next.indexOf(target)
      if (at < 0) return prev
      next.splice(at, 0, src)
      return next
    })
  }, [])

  const nudge = useCallback((imageId: string, dir: -1 | 1) => {
    setOrder(prev => {
      const at = prev.indexOf(imageId)
      const to = at + dir
      if (at < 0 || to < 0 || to >= prev.length) return prev
      const next = [...prev]
      ;[next[at], next[to]] = [next[to], next[at]]
      return next
    })
  }, [])

  const handleAdd = useCallback(
    async (assets: Asset[]) => {
      setPicker(false)
      if (assets.length === 0) return
      setAdding(true)
      setError(null)
      try {
        await onAdd(assets)
        refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : COPY.saveError)
      } finally {
        setAdding(false)
      }
    },
    [onAdd, refresh]
  )

  const handleRemove = useCallback(
    async (imageId: string) => {
      const ok = await confirm(COPY.removeConfirm('this photo'))
      if (!ok) return
      setBusyId(imageId)
      setError(null)
      // Optimistically drop it from the working order.
      setOrder(prev => prev.filter(x => x !== imageId))
      try {
        await onRemove(imageId)
        setSavedOrder(prev => prev.filter(x => x !== imageId))
        refresh()
      } catch (e) {
        setOrder(savedOrder) // restore on failure
        setError(e instanceof Error ? e.message : COPY.saveError)
      } finally {
        setBusyId(null)
      }
    },
    [confirm, onRemove, refresh, savedOrder]
  )

  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      setBusyId(imageId)
      setError(null)
      try {
        await onSetPrimary(imageId)
        refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : COPY.saveError)
      } finally {
        setBusyId(null)
      }
    },
    [onSetPrimary, refresh]
  )

  const handleRotate = useCallback(
    async (imageId: string) => {
      if (!onRotate) return
      setBusyId(imageId)
      setError(null)
      try {
        await onRotate(imageId, 90)
        refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : COPY.saveError)
      } finally {
        setBusyId(null)
      }
    },
    [onRotate, refresh]
  )

  // ---- Public render: zero admin DOM ----
  if (!enabled) {
    return (
      <div className={className}>
        {serverOrder.map(imgId => {
          const img = byId.get(imgId)
          if (!img) return null
          return (
            <ImageView
              key={img.id}
              src={img.url}
              width={img.width}
              height={img.height}
              alt={img.alt ?? ''}
              unoptimized={unoptimized}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="font-medium text-stone-700">{label}</span>
        <span>
          {order.length} photo{order.length === 1 ? '' : 's'} · drag to reorder
        </span>
        {orderDirty ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
            {reorderSaving ? 'Saving order…' : 'New order — saves with Save all'}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {order.map((imgId, index) => {
          const img = byId.get(imgId)
          if (!img) return null
          const isBusy = busyId === img.id
          return (
            <div
              key={img.id}
              draggable
              onDragStart={() => setDragId(img.id)}
              onDragOver={e => {
                e.preventDefault()
                if (dragId && dragId !== img.id) move(dragId, img.id)
              }}
              onDragEnd={() => setDragId(null)}
              onDrop={() => setDragId(null)}
              className={clsx(
                'group/tile relative aspect-square overflow-hidden rounded-lg',
                dragId === img.id && 'opacity-60'
              )}
              style={editableIdleStyle}
              data-admin-editable
            >
              <ImageView
                src={img.url}
                width={img.width}
                height={img.height}
                alt={img.alt ?? ''}
                unoptimized={unoptimized}
                fillTile
              />

              {/* Top-LEFT = structure: grip + ★ primary. */}
              <div className="absolute left-1 top-1 z-10 flex items-center gap-1">
                <span
                  className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm active:cursor-grabbing"
                  title="Drag to reorder"
                  aria-hidden
                >
                  <GripIcon className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => handleSetPrimary(img.id)}
                  disabled={isBusy || img.primary}
                  aria-label={img.primary ? 'Featured photo' : 'Make featured photo'}
                  title={img.primary ? 'Featured photo' : 'Make this the featured photo'}
                  className={clsx(
                    'inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full backdrop-blur-sm disabled:opacity-100',
                    img.primary ? 'text-white' : 'bg-black/55 text-white/80 hover:text-white'
                  )}
                  style={img.primary ? { background: ADMIN.accentStrong } : undefined}
                >
                  <StarIcon className="h-4 w-4" fill={img.primary ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Top-RIGHT = edit intent: swap. */}
              <div className="absolute right-1 top-1 z-10 flex items-center gap-1">
                {onRotate ? (
                  <button
                    type="button"
                    onClick={() => handleRotate(img.id)}
                    disabled={isBusy}
                    aria-label="Rotate photo"
                    title="Rotate 90°"
                    className="inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
                  >
                    <RotateIcon className={clsx('h-4 w-4', isBusy && 'animate-spin')} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setReplaceTarget(img.id)}
                  disabled={isBusy}
                  aria-label="Replace photo"
                  title="Replace this photo"
                  className="inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full text-white shadow disabled:opacity-50"
                  style={{ background: ADMIN.accent }}
                >
                  <ReplaceIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Bottom rail: mobile-safe reorder fallback + remove. */}
              <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1.5 pt-4">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => nudge(img.id, -1)}
                    disabled={index === 0}
                    aria-label="Move earlier"
                    className="inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full bg-white/85 text-stone-700 disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(img.id, 1)}
                    disabled={index === order.length - 1}
                    aria-label="Move later"
                    className="inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full bg-white/85 text-stone-700 disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  disabled={isBusy}
                  aria-label="Remove photo"
                  title="Remove from the page"
                  className="inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full text-white shadow disabled:opacity-50"
                  style={{ background: ADMIN.accentStrong }}
                >
                  {isBusy ? <Spinner className="h-4 w-4 animate-spin" /> : <RemoveIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )
        })}

        {/* Add-a-photo tile (dashed, idle accent). */}
        <button
          type="button"
          onClick={() => setPicker(true)}
          disabled={adding}
          className="flex aspect-square min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg text-stone-500 transition-colors hover:text-stone-700 disabled:opacity-60"
          style={editableIdleStyle}
        >
          {adding ? <Spinner className="h-6 w-6 animate-spin" /> : <AddIcon className="h-6 w-6" />}
          <span className="text-xs font-medium">{adding ? 'Adding…' : 'Add a photo'}</span>
        </button>
      </div>

      {error ? <div className="mt-2 text-[12px] text-red-600">{error}</div> : null}
      <div className="mt-1 text-[10px] text-stone-400">{COPY.goLiveHint}</div>

      {/* Add picker (multi-select). */}
      <MiniDamExplorer
        isOpen={picker}
        onClose={() => setPicker(false)}
        onSelect={() => {}}
        onMultiSelect={handleAdd}
        allowMultiple
        title="Add photos"
        subtitle="Pick one or more, or upload new ones"
        filterTags={damFilterTags}
      />

      {/* Replace picker (single-select, targets one tile). */}
      <ReplaceTilePicker
        targetId={replaceTarget}
        onCancel={() => setReplaceTarget(null)}
        damFilterTags={damFilterTags}
        onPicked={async asset => {
          const target = replaceTarget
          setReplaceTarget(null)
          if (!target) return
          setBusyId(target)
          setError(null)
          try {
            // Replace = remove old + add new for list semantics; the call site
            // owns the actual swap. We model it as add of the new asset.
            await onAdd([asset])
            await onRemove(target)
            refresh()
          } catch (e) {
            setError(e instanceof Error ? e.message : COPY.saveError)
          } finally {
            setBusyId(null)
          }
        }}
      />

      {dialog}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders the underlying photo. Uses fixed width/height when known, otherwise
 *  `fill` inside a positioned tile. Applies an optional CSS rotation preview. */
function ImageView({
  src,
  width,
  height,
  alt,
  unoptimized,
  className,
  previewRotation = 0,
  fillTile = false,
}: {
  src: string
  width?: number
  height?: number
  alt: string
  unoptimized?: boolean
  className?: string
  previewRotation?: number
  fillTile?: boolean
}) {
  const style = previewRotation
    ? { transform: `rotate(${previewRotation}deg)`, transition: 'transform 150ms ease' }
    : undefined

  if (fillTile) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={unoptimized}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className={clsx('object-cover', className)}
        style={style}
      />
    )
  }

  if (width && height) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        unoptimized={unoptimized}
        className={className}
        style={style}
      />
    )
  }

  // Unknown intrinsic size — fall back to a plain <img> so we never pass
  // invalid dims to next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} />
}

/** Single-select DAM picker for replacing one tile in a list. */
function ReplaceTilePicker({
  targetId,
  onCancel,
  onPicked,
  damFilterTags,
}: {
  targetId: string | null
  onCancel: () => void
  onPicked: (asset: Asset) => void | Promise<void>
  damFilterTags?: string[]
}) {
  return (
    <MiniDamExplorer
      isOpen={targetId != null}
      onClose={onCancel}
      onSelect={onPicked}
      selectedAssetId={null}
      title="Replace photo"
      subtitle="Choose from your media library, or upload a new one"
      filterTags={damFilterTags}
    />
  )
}
