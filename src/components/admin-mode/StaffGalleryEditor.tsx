'use client'

/* eslint-disable @next/next/no-img-element */

/**
 * StaffGalleryEditor — the admin-mode portfolio gallery for one stylist.
 *
 * Renders a responsive grid of photo tiles (each opens StaffPhotoEditor) plus a
 * dashed "+ Add photos" tile that opens MiniDamExplorer to tag existing DAM
 * assets onto this member (POST /api/dam/team/[memberId]/photos {assetIds}).
 *
 * Photos are dual-sourced (`source: 'album' | 'dam'`); the per-photo editor owns
 * the source-branching. After any change we call onRefresh() so the grid re-pulls.
 *
 * NOTE: reorder is intentionally NOT offered — the merged dual-source list has no
 * shared order column on the backend.
 * TODO(display_order): add a display_order migration spanning both sources before
 * wiring drag-reorder here.
 */

import { useState } from 'react'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'
import { StaffPhotoEditor, type StaffPhotoEditorPhoto } from './StaffPhotoEditor'
import { ADMIN, AdminIcons } from './adminTokens'

export interface PhotoItem {
  id: string
  fileName: string
  filePath: string
  width?: number | null
  height?: number | null
  caption?: string | null
  isPrimary?: boolean
  uploadedAt?: string | Date
  source: 'album' | 'dam'
}

interface StaffGalleryEditorProps {
  teamMemberId: string
  photos: PhotoItem[]
  onRefresh: () => Promise<void>
}

export function StaffGalleryEditor({ teamMemberId, photos, onRefresh }: StaffGalleryEditorProps) {
  const [editing, setEditing] = useState<PhotoItem | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const addAssets = async (assetIds: string[]) => {
    if (assetIds.length === 0) return
    setAddError(null)
    try {
      const res = await fetch(`/api/dam/team/${encodeURIComponent(teamMemberId)}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds }),
      })
      if (!res.ok) {
        const m = await res.json().catch(() => null)
        throw new Error(m?.error || 'Couldn’t add photos — please try again.')
      }
      await onRefresh()
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Couldn’t add photos — please try again.')
    }
  }

  return (
    <>
      <div className="mb-5 flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-rose">
          Portfolio
        </p>
        <span className="text-xs uppercase tracking-wider text-charcoal/40">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · tap to edit
        </span>
      </div>

      {addError && (
        <p
          className="mb-4 rounded-lg px-3 py-2 text-sm text-white"
          style={{ background: ADMIN.accentStrong }}
        >
          {addError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setEditing(p)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-warm-sand/20 transition-all hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
            style={{ outline: `1px dashed ${ADMIN.accent}`, outlineOffset: 2 }}
          >
            <img
              src={p.filePath}
              alt={p.caption || p.fileName || 'Portfolio photo'}
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
              draggable={false}
            />
            {p.isPrimary && (
              <span
                className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white shadow"
                style={{ background: ADMIN.accentStrong }}
              >
                <AdminIcons.feature className="h-3 w-3" aria-hidden />
                Cover
              </span>
            )}
            <span
              className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              aria-hidden
            >
              <AdminIcons.editText className="h-3.5 w-3.5" style={{ color: ADMIN.ink }} />
            </span>
          </button>
        ))}

        {/* Add-photos tile */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex aspect-square min-h-[44px] flex-col items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors hover:bg-[rgba(201,169,166,0.12)]"
          style={{
            outline: `1px dashed ${ADMIN.accent}`,
            outlineOffset: 2,
            background: `${ADMIN.accent}14`,
            color: ADMIN.ink,
          }}
        >
          <AdminIcons.add className="h-6 w-6" style={{ color: ADMIN.accentStrong }} aria-hidden />
          Add photos
        </button>
      </div>

      {editing && (
        <StaffPhotoEditor
          photo={editing as StaffPhotoEditorPhoto}
          teamMemberId={teamMemberId}
          onClose={() => setEditing(null)}
          onChanged={async () => {
            await onRefresh()
            // Drop the editor target — the underlying row may have changed url
            // (rotate writes a new R2 key) or been removed entirely.
            setEditing(null)
          }}
        />
      )}

      <MiniDamExplorer
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Add photos"
        subtitle="Choose images to add to this gallery"
        allowMultiple
        onSelect={(asset: Asset) => addAssets([asset.id])}
        onMultiSelect={(assets: Asset[]) => addAssets(assets.map(a => a.id))}
      />
    </>
  )
}
