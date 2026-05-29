'use client'

/**
 * AdminChrome — the floating control panel for inline admin mode.
 *
 * Lazy-loaded by AdminModeProvider only once admin mode is active, so it never
 * ships to public visitors. Shows who's editing, the count of unsaved blocks,
 * Save-all / Discard-all, and Exit. Modeled on DevModeOverlay.
 *
 * Mobile: collapses to a compact bottom-center bar with a dirty badge,
 * expandable on tap. Desktop: bottom-right card.
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Trash2, LogOut, ChevronUp, ChevronDown, Loader2, Pencil, RotateCcw, History, Eye, EyeOff } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useAdminMode } from '@/contexts/AdminModeContext'

const HistoryPanel = dynamic(
  () => import('./HistoryPanel').then(m => ({ default: m.HistoryPanel })),
  { ssr: false }
)

const ACCENT = '#C9A9A6'
const INK = '#1C1917'

export function AdminChrome() {
  const { user, status, dirtyCount, dirtyBlocks, saveAll, discardAll, exit, undoCount, lastUndoLabel, undoLast } = useAdminMode()
  const [open, setOpen] = useState(true)
  const [savingAll, setSavingAll] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Polite, screen-reader-only announcement for save results + dirty count.
  const [announcement, setAnnouncement] = useState('')

  // BP-7: "Show editable spots" brightens every idle affordance at once for
  // discoverability (toggles a class the global stylesheet keys off of).
  const [highlight, setHighlight] = useState(false)
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('admin-highlight', highlight)
    return () => document.documentElement.classList.remove('admin-highlight')
  }, [highlight])

  const handleSaveAll = async () => {
    setSavingAll(true)
    const { saved, failed } = await saveAll()
    setSavingAll(false)
    const flashMsg = failed ? `Saved ${saved}, ${failed} failed` : `Saved ${saved}`
    setFlash(flashMsg)
    setAnnouncement(
      failed
        ? `Saved ${saved} ${saved === 1 ? 'change' : 'changes'}, ${failed} couldn't save`
        : `Saved ${saved} ${saved === 1 ? 'change' : 'changes'}`
    )
    window.setTimeout(() => setFlash(null), 2400)
  }

  // Announce the live unsaved-edit count (debounced via React's render coalescing).
  const prevDirty = React.useRef(dirtyCount)
  React.useEffect(() => {
    if (dirtyCount !== prevDirty.current) {
      prevDirty.current = dirtyCount
      setAnnouncement(
        dirtyCount === 0
          ? 'All changes saved'
          : `${dirtyCount} unsaved ${dirtyCount === 1 ? 'edit' : 'edits'}`
      )
    }
  }, [dirtyCount])

  return (
    <div className="fixed bottom-4 left-1/2 z-[10000] -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0">
      {/* Visually-hidden polite live region: announces save results + dirty count. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="mb-2 w-[min(92vw,320px)] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5" style={{ background: INK }}>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: ACCENT }}
                >
                  <Pencil className="h-3 w-3 text-white" />
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-white">Admin mode</div>
                  <div className="text-[10px] text-white/60">
                    {status === 'checking'
                      ? 'verifying…'
                      : user?.name || user?.email || 'signed in'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={highlight ? 'Hide editable spots' : 'Show editable spots'}
                  aria-pressed={highlight}
                  title={highlight ? 'Hide editable spots' : 'Show me what I can edit'}
                  onClick={() => setHighlight(h => !h)}
                  className="inline-flex h-7 w-7 min-h-0 min-w-0 items-center justify-center rounded text-white/70 hover:bg-white/10"
                >
                  {highlight ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  aria-label="Collapse"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-7 w-7 min-h-0 min-w-0 items-center justify-center rounded text-white/70 hover:bg-white/10"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dirty list */}
            <div className="max-h-48 overflow-y-auto px-3 py-2">
              {dirtyCount === 0 ? (
                <p className="py-2 text-center text-xs text-stone-400">No unsaved edits</p>
              ) : (
                <ul className="space-y-1">
                  {dirtyBlocks.map(b => (
                    <li key={b.id} className="flex items-center justify-between gap-2 text-xs text-stone-700">
                      <span className="truncate">{b.label}</span>
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        unsaved
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {flash ? <p className="mt-2 text-center text-[11px] text-emerald-600">{flash}</p> : null}
            </div>

            {/* Undo last edit (session) */}
            {undoCount > 0 ? (
              <button
                type="button"
                onClick={() => undoLast()}
                className="flex w-full items-center gap-2 border-t border-stone-100 px-3 py-2 text-left text-xs text-stone-600 hover:bg-stone-50"
                title={lastUndoLabel ? `Undo: ${lastUndoLabel}` : 'Undo last edit'}
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  Undo last edit{lastUndoLabel ? ` · ${lastUndoLabel}` : ''}
                </span>
              </button>
            ) : null}

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-stone-100 px-3 py-2.5">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={dirtyCount === 0 || savingAll}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: INK }}
              >
                {savingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save all{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                aria-label="Edit history"
                title="Edit history & restore"
                className="inline-flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={discardAll}
                disabled={dirtyCount === 0 || savingAll}
                aria-label="Discard all"
                className="inline-flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={exit}
                aria-label="Exit admin mode"
                className="inline-flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}

      {/* Collapsed pill */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white shadow-2xl"
          style={{ background: INK }}
        >
          <Pencil className="h-3.5 w-3.5" style={{ color: ACCENT }} />
          Admin
          {dirtyCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-amber-950">
              {dirtyCount}
            </span>
          )}
          <ChevronUp className="h-3.5 w-3.5 opacity-60" />
        </button>
      )}
    </div>
  )
}

export default AdminChrome
