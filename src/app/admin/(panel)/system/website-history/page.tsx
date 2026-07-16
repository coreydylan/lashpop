'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, History, Loader2, RotateCcw } from 'lucide-react'

interface HistoryEntry {
  id: string
  section: string
  label: string
  owner: string
  sourceOwner: string
  version: number
  publisher: { id: string; name: string | null; email: string | null } | null
  createdAt: string | number
  valid: boolean
  validationErrors: string[]
  restoreToken: string
}

interface HistoryPayload {
  history: HistoryEntry[]
  currentVersions: Record<string, number>
  role: 'owner' | 'publisher' | 'viewer'
}

export default function WebsiteHistoryPage() {
  const [payload, setPayload] = useState<HistoryPayload | null>(null)
  const [filter, setFilter] = useState('all')
  const [confirming, setConfirming] = useState<HistoryEntry | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const response = await fetch('/api/admin/history?limit=100', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error ?? 'Could not load website history')
    setPayload(data)
  }, [])

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load website history'))
  }, [load])

  const sections = useMemo(() => {
    if (!payload) return []
    return Array.from(new Map(payload.history.map((entry) => [entry.section, entry.label])).entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
  }, [payload])

  const visible = payload?.history.filter((entry) => filter === 'all' || entry.section === filter) ?? []
  const canRestore = payload?.role === 'owner' || payload?.role === 'publisher'

  const restore = async () => {
    if (!confirming || !payload) return
    setRestoring(true)
    setError('')
    setMessage('')
    const response = await fetch('/api/admin/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'restore-website-setting-version',
        section: confirming.section,
        versionId: confirming.id,
        confirmationToken: confirming.restoreToken,
        baseVersion: payload.currentVersions[confirming.section] ?? 0,
      }),
    })
    const data = await response.json().catch(() => ({}))
    setRestoring(false)
    if (!response.ok) {
      const restoreError = response.status === 409
        ? 'This section changed while the restore was open. Refresh and try again.'
        : data.error ?? 'Could not restore this version'
      setError(restoreError)
      return
    }
    setConfirming(null)
    setMessage(`${confirming.label} version ${confirming.version} was restored as a new version.`)
    await load()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-black/10 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">Settings</p>
        <h1 className="mt-2 flex items-center gap-3 font-serif text-3xl text-[#292a27] sm:text-4xl">
          <History className="size-7 text-[#9f4c33]" aria-hidden="true" /> Website version history
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60">
          Every settings publish creates an immutable snapshot. Restoring never erases history; it publishes the selected snapshot as the newest version.
        </p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-black/50">
          Section
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="mt-1 block min-h-11 min-w-64 rounded-lg border border-black/15 bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#292a27]"
          >
            <option value="all">All website settings</option>
            {sections.map(([section, label]) => <option key={section} value={section}>{label}</option>)}
          </select>
        </label>
        <p className="text-xs text-black/45">{visible.length} saved {visible.length === 1 ? 'version' : 'versions'}</p>
      </div>

      <div className="min-h-6" role="status" aria-live="polite">
        {message && <p className="flex items-center gap-2 text-sm text-emerald-800"><Check className="size-4" />{message}</p>}
        {error && <p className="flex items-center gap-2 text-sm text-red-700"><AlertTriangle className="size-4" />{error}</p>}
      </div>

      {!payload && !error ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-black/10 bg-white"><Loader2 className="size-6 animate-spin text-[#9f4c33]" aria-label="Loading history" /></div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-10 text-center text-sm text-black/50">No immutable versions have been recorded for this selection yet.</div>
      ) : (
        <ol className="overflow-hidden rounded-xl border border-black/10 bg-white divide-y divide-black/10">
          {visible.map((entry) => {
            const currentVersion = payload?.currentVersions[entry.section]
            return (
              <li key={entry.id} className="p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#292a27]">{entry.label}</h2>
                      <span className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black/50">v{entry.version}</span>
                      <span className="rounded-full border border-[#c96f50]/20 bg-[#c96f50]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9f4c33]">{entry.sourceOwner}</span>
                      {!entry.valid && <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-800">Outdated schema</span>}
                    </div>
                    <p className="mt-2 text-xs text-black/45">
                      {formatDate(entry.createdAt)} · {entry.publisher?.name || entry.publisher?.email || 'system'} · {entry.owner}
                      {currentVersion !== undefined ? ` · current v${currentVersion}` : ''}
                    </p>
                    {!entry.valid && entry.validationErrors.length > 0 && <p className="mt-2 text-xs text-red-700">{entry.validationErrors[0]}</p>}
                  </div>
                  {canRestore && (
                    <button
                      type="button"
                      onClick={() => setConfirming(entry)}
                      disabled={!entry.valid}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#c96f50]/30 px-4 text-sm font-semibold text-[#9f4c33] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <RotateCcw className="size-4" aria-hidden="true" /> Restore
                    </button>
                  )}
                </div>

                {confirming?.id === entry.id && (
                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4" role="alertdialog" aria-labelledby={`restore-${entry.id}`}>
                    <h3 id={`restore-${entry.id}`} className="font-semibold text-amber-950">Restore {entry.label} version {entry.version}?</h3>
                    <p className="mt-1 text-sm text-amber-900/75">This publishes its saved configuration as a new current version. The present version remains in history.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => restore()} disabled={restoring} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#9f4c33] px-4 text-sm font-semibold text-white disabled:opacity-50">
                        {restoring && <Loader2 className="size-4 animate-spin" />} Confirm restore
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} disabled={restoring} className="min-h-10 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-black/65">Cancel</button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function formatDate(value: string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}
