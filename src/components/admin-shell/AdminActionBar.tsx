'use client'

import { AlertCircle, Loader2, Save, Trash2 } from 'lucide-react'
import { useAdminWorkspace } from './AdminWorkspaceContext'

/**
 * Persistent workspace feedback and batch actions. Mount once inside the
 * AdminWorkspaceProvider; it stays hidden until a page registers a dirty block.
 */
export function AdminActionBar() {
  const {
    dirtyBlocks,
    dirtyCount,
    errorCount,
    activeOperation,
    saveAll,
    requestDiscardAll,
  } = useAdminWorkspace()

  if (dirtyCount === 0 && activeOperation === null) return null

  const busy = activeOperation !== null
  const errors = dirtyBlocks.filter((block) => block.error)
  const statusText = activeOperation === 'saving'
    ? `Saving ${dirtyCount} ${dirtyCount === 1 ? 'change' : 'changes'}…`
    : activeOperation === 'discarding'
      ? `Discarding ${dirtyCount} ${dirtyCount === 1 ? 'change' : 'changes'}…`
      : errorCount > 0
        ? `${errorCount} ${errorCount === 1 ? 'change needs' : 'changes need'} attention`
        : `${dirtyCount} unsaved ${dirtyCount === 1 ? 'change' : 'changes'}`

  return (
    <section
      aria-label="Unsaved admin changes"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] lg:left-[19rem]"
    >
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#20211f] text-white shadow-[0_18px_60px_rgba(20,20,18,0.3)]">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${errorCount > 0 ? 'bg-[#e38a69]/18 text-[#f4ad91]' : 'bg-white/10 text-white/75'}`}
              aria-hidden="true"
            >
              {busy
                ? <Loader2 className="size-4 animate-spin" />
                : errorCount > 0
                  ? <AlertCircle className="size-4" />
                  : <Save className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{statusText}</p>
              {!busy && dirtyBlocks.length > 0 && (
                <p className="mt-0.5 truncate text-xs text-white/50">
                  {dirtyBlocks.map((block) => block.label).join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={busy || dirtyCount === 0}
              onClick={() => void requestDiscardAll()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-semibold text-white/75 hover:border-white/30 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Discard
            </button>
            <button
              type="button"
              disabled={busy || dirtyCount === 0}
              onClick={() => void saveAll()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#c96f50] px-4 text-sm font-semibold text-white hover:bg-[#b75f42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e38a69] focus-visible:ring-offset-2 focus-visible:ring-offset-[#20211f] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {activeOperation === 'saving'
                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <Save className="size-4" aria-hidden="true" />}
              Save all
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <ul aria-label="Changes that could not be completed" className="max-h-32 overflow-y-auto border-t border-white/10 px-4 py-2.5">
            {errors.map((block) => (
              <li key={block.id} className="flex gap-2 py-1 text-xs leading-5 text-[#f4c0ad]">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-white/90">{block.label}:</strong>{' '}
                  {block.error}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
