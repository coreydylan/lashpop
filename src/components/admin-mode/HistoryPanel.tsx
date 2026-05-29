'use client'

/**
 * Version history + one-click rollback for site content. Lists recent
 * website_settings changes (which store a full before/after in the audit log)
 * and lets an admin restore any prior version. Opened from AdminChrome.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw, X, Loader2 } from 'lucide-react'
import { ADMIN } from './adminTokens'
import { useAdminMode } from '@/contexts/AdminModeContext'

interface HistoryEntry {
  id: string
  label: string
  section: string | null
  actorName: string | null
  createdAt: string
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { refresh } = useAdminMode()
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/history', { cache: 'no-store' })
      const data = await res.json()
      setEntries(res.ok ? data.entries ?? [] : [])
    } catch {
      setEntries([])
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const restore = async (id: string) => {
    setRestoring(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || 'Couldn’t restore')
      }
      refresh()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t restore')
    } finally {
      setRestoring(null)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-[min(94vw,440px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit history"
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ background: ADMIN.ink }}>
          <h2 className="text-sm font-semibold text-white">Edit history</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {entries === null ? (
            <div className="flex items-center justify-center py-8 text-stone-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">No content changes recorded yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {entries.map(e => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">{e.label}</p>
                    <p className="text-[11px] text-stone-400">
                      {timeAgo(e.createdAt)}
                      {e.actorName ? ` · ${e.actorName}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(e.id)}
                    disabled={!!restoring}
                    title="Restore the version from before this change"
                    className="inline-flex min-h-0 shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
                  >
                    {restoring === e.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error ? <p className="px-2 py-2 text-xs text-red-600">{error}</p> : null}
        </div>

        <p className="border-t border-stone-100 px-4 py-2 text-[11px] text-stone-400">
          Restoring brings a section back to how it was before that change. It’s logged too — so you can undo a restore.
        </p>
      </div>
    </div>,
    document.body
  )
}
