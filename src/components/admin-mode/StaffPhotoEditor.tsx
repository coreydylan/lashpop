'use client'

/* eslint-disable @next/next/no-img-element */

/**
 * StaffPhotoEditor — full-screen modal for editing ONE portfolio photo.
 *
 * Portfolio photos are DUAL-SOURCED (`source: 'album' | 'dam'`); every tool
 * branches on it:
 *   • Rotate  → POST /api/admin/website/team/photos/[id]/rotate {degrees}  — BOTH sources.
 *   • Set as cover photo (album only) → POST /api/dam/team/photos/[id]/set-primary {teamMemberId}.
 *   • Reposition / crop (album only)  → POST /api/dam/team/photos/[id]/crops {crops:{square}}.
 *   • Remove  → album: DELETE /api/dam/team/photos/[id];
 *               dam:   POST /api/dam/assets/remove-team {assetIds:[id]}.
 *
 * Rotate uses an INSTANT CSS `transform: rotate()` preview while the worker
 * re-encodes; on success it re-fetches via onChanged() and resets the preview,
 * on failure it rolls the preview back and surfaces the error. These mutations
 * commit immediately (they're not part of the deferred "Save all" registry).
 */

import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { ADMIN, AdminIcons, COPY } from './adminTokens'
import { useConfirm } from './useConfirm'
import { QuizPhotoCropEditor } from '@/components/admin/QuizPhotoCropEditor'

export interface StaffPhotoEditorPhoto {
  id: string
  filePath: string
  width?: number
  height?: number
  isPrimary?: boolean
  source: 'album' | 'dam'
}

interface StaffPhotoEditorProps {
  photo: StaffPhotoEditorPhoto
  teamMemberId: string
  onClose: () => void
  onChanged: () => void | Promise<void>
}

/** A 44px touch-target toolbar button. */
function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  busy,
  spin,
  danger,
}: {
  icon: typeof AdminIcons.revert
  label: string
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  spin?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: danger ? `${ADMIN.accentStrong}33` : '#e7e0db',
        color: danger ? ADMIN.accentStrong : ADMIN.ink,
      }}
    >
      <Icon className={`h-4 w-4 ${busy && spin ? 'animate-spin' : ''}`} aria-hidden />
      <span>{label}</span>
    </button>
  )
}

export function StaffPhotoEditor({ photo, teamMemberId, onClose, onChanged }: StaffPhotoEditorProps) {
  const { confirm, dialog } = useConfirm()

  // Instant CSS rotation preview applied while the worker re-encodes.
  const [previewRotation, setPreviewRotation] = useState(0)
  const [busy, setBusy] = useState<null | 'rotate' | 'primary' | 'crop' | 'remove'>(null)
  const [error, setError] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  const isAlbum = photo.source === 'album'

  /** degrees: 90 (right), 270 (left), 180 (flip). cssDelta is the matching preview turn. */
  const rotate = useCallback(
    async (degrees: 90 | 180 | 270, cssDelta: number) => {
      if (busy) return
      setError(null)
      const target = previewRotation + cssDelta
      setPreviewRotation(target) // instant preview
      setBusy('rotate')
      try {
        const res = await fetch(
          `/api/admin/website/team/photos/${encodeURIComponent(photo.id)}/rotate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ degrees }),
          }
        )
        if (!res.ok) {
          const m = await res.json().catch(() => null)
          throw new Error(m?.error || COPY.saveError)
        }
        await onChanged() // re-fetch points the tile at the new R2 url
        setPreviewRotation(0) // drop the CSS preview now the real image is rotated
      } catch (e) {
        setPreviewRotation(p => p - cssDelta) // roll back the preview
        setError(e instanceof Error ? e.message : COPY.saveError)
      } finally {
        setBusy(null)
      }
    },
    [busy, previewRotation, photo.id, onChanged]
  )

  const setPrimary = useCallback(async () => {
    if (busy || !isAlbum) return
    setError(null)
    setBusy('primary')
    try {
      const res = await fetch(
        `/api/dam/team/photos/${encodeURIComponent(photo.id)}/set-primary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamMemberId }),
        }
      )
      if (!res.ok) {
        const m = await res.json().catch(() => null)
        throw new Error(m?.error || COPY.saveError)
      }
      await onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : COPY.saveError)
    } finally {
      setBusy(null)
    }
  }, [busy, isAlbum, photo.id, teamMemberId, onChanged])

  const saveCrop = useCallback(
    async (cropData: { x: number; y: number; scale: number }) => {
      setCropOpen(false)
      if (!isAlbum) return
      setError(null)
      setBusy('crop')
      try {
        const res = await fetch(
          `/api/dam/team/photos/${encodeURIComponent(photo.id)}/crops`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // The crops route persists named variants; the square reposition
            // tool feeds the `square` slot. Other variants are left untouched.
            body: JSON.stringify({ crops: { square: cropData } }),
          }
        )
        if (!res.ok) {
          const m = await res.json().catch(() => null)
          throw new Error(m?.error || COPY.saveError)
        }
        await onChanged()
      } catch (e) {
        setError(e instanceof Error ? e.message : COPY.saveError)
      } finally {
        setBusy(null)
      }
    },
    [isAlbum, photo.id, onChanged]
  )

  const remove = useCallback(async () => {
    if (busy) return
    if (!(await confirm(COPY.removeConfirm('this photo')))) return
    setError(null)
    setBusy('remove')
    try {
      const res = isAlbum
        ? await fetch(`/api/dam/team/photos/${encodeURIComponent(photo.id)}`, {
            method: 'DELETE',
          })
        : await fetch('/api/dam/assets/remove-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetIds: [photo.id] }),
          })
      if (!res.ok) {
        const m = await res.json().catch(() => null)
        // Server blocks deleting an album primary — surface it gracefully.
        throw new Error(m?.error || COPY.saveError)
      }
      await onChanged()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : COPY.saveError)
      setBusy(null)
    }
  }, [busy, confirm, isAlbum, photo.id, onChanged, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[10000] flex flex-col bg-[rgba(20,15,12,0.82)] backdrop-blur-md"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Edit photo"
      >
        {/* Top bar */}
        <div className="flex items-center justify-end p-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <AdminIcons.cancel className="h-5 w-5" />
          </button>
        </div>

        {/* Big preview */}
        <div
          className="flex flex-1 items-center justify-center overflow-hidden px-6"
          onClick={e => e.stopPropagation()}
        >
          <img
            src={photo.filePath}
            alt=""
            className="max-h-full max-w-full rounded-xl object-contain shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
            style={{
              transform: previewRotation ? `rotate(${previewRotation}deg)` : undefined,
              transition: 'transform 150ms ease',
            }}
            draggable={false}
          />
        </div>

        {/* Toolbar */}
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4" onClick={e => e.stopPropagation()}>
          {error && (
            <p
              className="mx-auto mb-3 max-w-[640px] rounded-lg px-3 py-2 text-center text-sm text-white"
              style={{ background: ADMIN.accentStrong }}
            >
              {error}
            </p>
          )}
          <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-center gap-2.5">
            <ToolButton
              icon={AdminIcons.revert}
              label="Rotate left"
              onClick={() => rotate(270, -90)}
              busy={busy === 'rotate'}
              spin
              disabled={!!busy}
            />
            <ToolButton
              icon={AdminIcons.revert}
              label="Rotate right"
              onClick={() => rotate(90, 90)}
              busy={busy === 'rotate'}
              spin
              disabled={!!busy}
            />
            <ToolButton
              icon={AdminIcons.revert}
              label="Flip 180°"
              onClick={() => rotate(180, 180)}
              busy={busy === 'rotate'}
              spin
              disabled={!!busy}
            />
            {isAlbum && (
              <ToolButton
                icon={AdminIcons.feature}
                label={photo.isPrimary ? 'Cover photo' : 'Set as cover photo'}
                onClick={setPrimary}
                busy={busy === 'primary'}
                spin
                disabled={!!busy || photo.isPrimary}
              />
            )}
            {isAlbum && (
              <ToolButton
                icon={AdminIcons.settings}
                label="Reposition"
                onClick={() => setCropOpen(true)}
                busy={busy === 'crop'}
                spin
                disabled={!!busy}
              />
            )}
            <ToolButton
              icon={AdminIcons.remove}
              label="Remove from gallery"
              onClick={remove}
              busy={busy === 'remove'}
              spin
              disabled={!!busy}
              danger
            />
          </div>
        </div>
      </div>

      {/* Square reposition / crop editor (album only) */}
      {isAlbum && (
        <QuizPhotoCropEditor
          isOpen={cropOpen}
          onClose={() => setCropOpen(false)}
          onSave={saveCrop}
          imageUrl={photo.filePath}
          photoName="Reposition photo"
        />
      )}

      {dialog}
    </>,
    document.body
  )
}
