'use client'

import { useState } from 'react'
import { Check, FileText, Loader2, Pencil, X } from 'lucide-react'

interface AssetMetadata {
  id: string
  fileName: string
  altText?: string | null
  caption?: string | null
}

export function AssetMetadataEditor({
  asset,
  onSaved,
}: {
  asset: AssetMetadata
  onSaved: (asset: AssetMetadata) => void
}) {
  const [open, setOpen] = useState(false)
  const [altText, setAltText] = useState(asset.altText ?? '')
  const [caption, setCaption] = useState(asset.caption ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const dirty = altText !== (asset.altText ?? '') || caption !== (asset.caption ?? '')

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch(`/api/dam/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText, caption }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error ?? 'Could not save photo details')
      onSaved(data.asset)
      setMessage('Saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save photo details')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); setOpen(true) }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/55 px-4 text-sm font-semibold text-white shadow-lg backdrop-blur hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-rose"
      >
        <Pencil className="size-4" aria-hidden="true" /> Edit photo details
      </button>
    )
  }

  return (
    <section
      className="w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-white/20 bg-black/75 p-4 text-white shadow-2xl backdrop-blur"
      aria-label={`Photo details for ${asset.fileName}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-dusty-rose" /> Photo details</h2>
          <p className="mt-1 max-w-xs truncate text-xs text-white/55">{asset.fileName}</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close photo details" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white/65 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </div>

      <label className="mt-4 block text-xs font-semibold text-white/80">
        Alt text
        <textarea
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Describe what matters in this image for someone who cannot see it."
          className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-normal text-white outline-none placeholder:text-white/35 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/25"
        />
      </label>
      <p className="mt-1 text-[11px] leading-4 text-white/45">Leave empty only when the image is purely decorative.</p>

      <label className="mt-3 block text-xs font-semibold text-white/80">
        Caption
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Optional text for website sections that show captions."
          className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-normal text-white outline-none placeholder:text-white/35 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/25"
        />
      </label>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={`text-xs ${message === 'Saved' ? 'text-ocean-mist' : 'text-terracotta'}`} role="status" aria-live="polite">
          {message === 'Saved' && <Check className="mr-1 inline size-3.5" />}{message}
        </p>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-dusty-rose px-4 text-sm font-semibold text-white hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving && <Loader2 className="size-4 animate-spin" />} Save details
        </button>
      </div>
    </section>
  )
}
