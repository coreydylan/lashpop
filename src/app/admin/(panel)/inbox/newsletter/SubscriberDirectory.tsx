'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Clock3,
  Mail,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'
import { SubscriberExportActions } from './SubscriberExportActions'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export type SubscriberStatus = 'active' | 'unsubscribed' | 'suppressed'

export interface SubscriberRow {
  id: string
  email: string
  subscribedAt: string | null
  source: string | null
  status: SubscriberStatus
  notes: string | null
  unsubscribedAt: string | null
  updatedAt: string | null
}

interface SubscriberDirectoryProps {
  initialSubscribers: SubscriberRow[]
  canManage: boolean
}

const STATUS_META: Record<SubscriberStatus, { label: string; description: string; className: string }> = {
  active: {
    label: 'Active',
    description: 'Eligible for export to the approved email platform.',
    className: 'border-emerald-700/20 bg-emerald-50 text-emerald-800',
  },
  unsubscribed: {
    label: 'Unsubscribed',
    description: 'Opted out. Keep the consent record, but never export this address.',
    className: 'border-black/15 bg-[#f4f1ec] text-black/60',
  },
  suppressed: {
    label: 'Suppressed',
    description: 'Paused internally because of a bounce, complaint, or manual hold.',
    className: 'border-amber-700/20 bg-amber-50 text-amber-800',
  },
}

function formatDate(value: string | null, includeTime = false): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

function sourceLabel(source: string | null): string {
  return (source || 'footer_form')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase())
}

export function SubscriberDirectory({ initialSubscribers, canManage }: SubscriberDirectoryProps) {
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriberStatus>('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const activeSubscribers = subscribers.filter((subscriber) => subscriber.status === 'active')
  const sources = useMemo(
    () => Array.from(new Set(subscribers.map((subscriber) => subscriber.source || 'footer_form'))).sort(),
    [subscribers],
  )
  const filteredSubscribers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return subscribers.filter((subscriber) => {
      if (statusFilter !== 'all' && subscriber.status !== statusFilter) return false
      if (sourceFilter !== 'all' && (subscriber.source || 'footer_form') !== sourceFilter) return false
      if (!normalizedQuery) return true
      return subscriber.email.toLowerCase().includes(normalizedQuery)
        || subscriber.notes?.toLowerCase().includes(normalizedQuery)
        || sourceLabel(subscriber.source).toLowerCase().includes(normalizedQuery)
    })
  }, [query, sourceFilter, statusFilter, subscribers])

  const selectedSubscriber = subscribers.find((subscriber) => subscriber.id === selectedId) ?? null
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1_000
  const recentCount = subscribers.filter((subscriber) => {
    return subscriber.subscribedAt ? new Date(subscriber.subscribedAt).getTime() >= thirtyDaysAgo : false
  }).length

  function replaceSubscriber(updated: SubscriberRow) {
    setSubscribers((current) => current.map((subscriber) => subscriber.id === updated.id ? updated : subscriber))
  }

  const closeSelectedSubscriber = useCallback(() => setSelectedId(null), [])

  return (
    <div className="space-y-6">
      <section aria-label="Subscriber totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="All records" value={subscribers.length} detail="Complete consent ledger" />
        <MetricCard icon={UserRoundCheck} label="Active" value={activeSubscribers.length} detail="Eligible for export" tone="terracotta" />
        <MetricCard icon={Clock3} label="Last 30 days" value={recentCount} detail="New or renewed signups" />
        <MetricCard
          icon={CircleOff}
          label="Inactive"
          value={subscribers.length - activeSubscribers.length}
          detail="Unsubscribed or suppressed"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-black/10 bg-white">
        <div className="flex flex-col gap-4 border-b border-black/10 px-4 py-4 lg:flex-row lg:items-end lg:justify-between lg:px-5">
          <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(14rem,1fr)_11rem_11rem]">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">Search</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35" aria-hidden="true" />
                <input
                  type="search"
                  name="newsletter-subscriber-search"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Email, source, or notes…"
                  className="min-h-11 w-full rounded-lg border border-black/15 bg-[#fcfaf7] pl-9 pr-3 text-sm text-[#292a27] outline-none placeholder:text-black/35 focus:border-[#c96f50] focus:ring-2 focus:ring-[#c96f50]/20"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">Status</span>
              <select
                name="newsletter-subscriber-status-filter"
                autoComplete="off"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | SubscriberStatus)}
                className="min-h-11 w-full rounded-lg border border-black/15 bg-[#fcfaf7] px-3 text-sm text-[#292a27] outline-none focus:border-[#c96f50] focus:ring-2 focus:ring-[#c96f50]/20"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="suppressed">Suppressed</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">Source</span>
              <select
                name="newsletter-subscriber-source-filter"
                autoComplete="off"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-black/15 bg-[#fcfaf7] px-3 text-sm text-[#292a27] outline-none focus:border-[#c96f50] focus:ring-2 focus:ring-[#c96f50]/20"
              >
                <option value="all">All sources</option>
                {sources.map((source) => <option key={source} value={source}>{sourceLabel(source)}</option>)}
              </select>
            </label>
          </div>

          {activeSubscribers.length > 0 && <SubscriberExportActions subscribers={activeSubscribers} />}
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-[#faf7f2] px-4 py-2.5 text-xs text-black/50 lg:px-5">
          <span>{filteredSubscribers.length} of {subscribers.length} records shown</span>
          <span>Exports include active subscribers only</span>
        </div>

        {filteredSubscribers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Mail className="mx-auto size-9 text-black/20" aria-hidden="true" />
            <h2 className="mt-4 font-serif text-xl text-[#292a27]">No subscribers match</h2>
            <p className="mt-1 text-sm text-black/50">Clear the search or change the filters to see the complete ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <caption className="sr-only">Newsletter subscriber consent records</caption>
              <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45">
                <tr>
                  <th className="px-4 py-3 lg:px-5">Subscriber</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Signed up</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3"><span className="sr-only">Open record</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="group hover:bg-[#fcfaf7]">
                    <td className="px-4 py-3.5 lg:px-5">
                      <a href={`mailto:${subscriber.email}`} className="font-semibold text-[#292a27] underline-offset-4 hover:text-[#9a4932] hover:underline">
                        {subscriber.email}
                      </a>
                      {subscriber.notes && <p className="mt-1 max-w-md truncate text-xs text-black/45">{subscriber.notes}</p>}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={subscriber.status} /></td>
                    <td className="px-4 py-3.5 text-black/55">
                      <time dateTime={subscriber.subscribedAt ?? undefined}>{formatDate(subscriber.subscribedAt, true)}</time>
                    </td>
                    <td className="px-4 py-3.5 text-black/55">{sourceLabel(subscriber.source)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedId(subscriber.id)}
                        aria-label={`Open subscriber record for ${subscriber.email}`}
                        className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-[#9a4932] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
                      >
                        Details <ChevronRight className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedSubscriber && (
        <SubscriberDrawer
          subscriber={selectedSubscriber}
          canManage={canManage}
          onClose={closeSelectedSubscriber}
          onUpdated={replaceSubscriber}
        />
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'neutral' }: {
  icon: typeof Users
  label: string
  value: number
  detail: string
  tone?: 'neutral' | 'terracotta'
}) {
  return (
    <article className="rounded-xl border border-black/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">{label}</p>
          <p className="mt-2 font-serif text-3xl text-[#292a27]">{value}</p>
        </div>
        <span className={`flex size-9 items-center justify-center rounded-lg ${tone === 'terracotta' ? 'bg-[#c96f50]/12 text-[#9a4932]' : 'bg-[#f3efe9] text-black/50'}`}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xs text-black/50">{detail}</p>
    </article>
  )
}

function StatusBadge({ status }: { status: SubscriberStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_META[status].className}`}>
      {STATUS_META[status].label}
    </span>
  )
}

function SubscriberDrawer({ subscriber, canManage, onClose, onUpdated }: {
  subscriber: SubscriberRow
  canManage: boolean
  onClose: () => void
  onUpdated: (subscriber: SubscriberRow) => void
}) {
  const [status, setStatus] = useState<SubscriberStatus>(subscriber.status)
  const [notes, setNotes] = useState(subscriber.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const discardButtonRef = useRef<HTMLButtonElement>(null)
  const dirty = status !== subscriber.status || notes.trim() !== (subscriber.notes ?? '')

  const discard = useCallback(() => {
    setStatus(subscriber.status)
    setNotes(subscriber.notes ?? '')
    setError(null)
  }, [subscriber.notes, subscriber.status])

  const discardAndClose = useCallback(() => {
    if (saving) return
    discard()
    onClose()
  }, [discard, onClose, saving])

  const requestClose = useCallback(() => {
    if (saving) return
    if (dirty) {
      setError('Save or discard your changes before closing this record.')
      discardButtonRef.current?.focus()
      return
    }
    onClose()
  }, [dirty, onClose, saving])

  useDirtyBlock({
    id: `newsletter-subscriber-${subscriber.id}`,
    label: `Newsletter record for ${subscriber.email}`,
    dirty,
    save,
    discard,
  })

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key !== 'Tab') return

      const drawer = drawerRef.current
      if (!drawer) return
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true')
      if (focusable.length === 0) {
        event.preventDefault()
        drawer.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !drawer.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !drawer.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [requestClose])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/newsletter/subscribers/${subscriber.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })
      const payload = await response.json() as { subscriber?: Omit<SubscriberRow, 'subscribedAt' | 'unsubscribedAt' | 'updatedAt'> & {
        subscribedAt: string | number | null
        unsubscribedAt: string | number | null
        updatedAt: string | number | null
      }; error?: string }
      if (!response.ok || !payload.subscriber) throw new Error(payload.error || 'Could not save subscriber changes.')

      const updated = payload.subscriber
      onUpdated({
        ...updated,
        subscribedAt: updated.subscribedAt ? new Date(updated.subscribedAt).toISOString() : null,
        unsubscribedAt: updated.unsubscribedAt ? new Date(updated.unsubscribedAt).toISOString() : null,
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : null,
      })
      onClose()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not save subscriber changes.'
      setError(message)
      throw cause instanceof Error ? cause : new Error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveClick() {
    try {
      await save()
    } catch {
      // The inline alert already explains the failure; keep the drawer open.
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/30" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) requestClose()
    }}>
      <section
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscriber-drawer-title"
        aria-describedby="subscriber-drawer-description"
        aria-busy={saving}
        tabIndex={-1}
        className="h-full w-full max-w-lg overscroll-contain overflow-y-auto border-l border-black/10 bg-[#fbf8f3] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/10 bg-[#fbf8f3]/95 px-5 py-5 backdrop-blur sm:px-7">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">Subscriber record</p>
            <h2 id="subscriber-drawer-title" className="mt-1 truncate font-serif text-2xl text-[#292a27]">{subscriber.email}</h2>
            <p id="subscriber-drawer-description" className="sr-only">Review consent history and internal newsletter notes.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            aria-label={dirty ? 'Close subscriber details after saving or discarding changes' : 'Close subscriber details'}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-black/60 hover:border-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          <dl className="grid gap-3 rounded-xl border border-black/10 bg-white p-4 sm:grid-cols-2">
            <Detail label="Signed up" value={formatDate(subscriber.subscribedAt, true)} />
            <Detail label="Source" value={sourceLabel(subscriber.source)} />
            <Detail label="Last updated" value={formatDate(subscriber.updatedAt, true)} />
            <Detail label="Opted out" value={formatDate(subscriber.unsubscribedAt, true)} />
          </dl>

          <fieldset disabled={!canManage || saving}>
            <legend className="text-sm font-semibold text-[#292a27]">Consent status</legend>
            <p className="mt-1 text-xs leading-5 text-black/50">Inactive records remain visible so consent history is never lost.</p>
            <div className="mt-3 space-y-2">
              {(Object.keys(STATUS_META) as SubscriberStatus[]).map((option) => (
                <label key={option} className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 ${status === option ? 'border-[#c96f50] bg-[#c96f50]/8' : 'border-black/10 bg-white'} ${!canManage ? 'cursor-default opacity-75' : ''}`}>
                  <input
                    type="radio"
                    name={`subscriber-status-${subscriber.id}`}
                    value={option}
                    checked={status === option}
                    onChange={() => setStatus(option)}
                    className="mt-1 accent-[#a14f35]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#292a27]">{STATUS_META[option].label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-black/50">{STATUS_META[option].description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-semibold text-[#292a27]">Internal notes</span>
            <span className="mt-1 block text-xs leading-5 text-black/50">Context for the studio team only. Do not add sensitive personal information.</span>
            <textarea
              name="subscriber-notes"
              autoComplete="off"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={!canManage || saving}
              maxLength={2_000}
              rows={6}
              placeholder="For example: requested to pause after a bounce report…"
              className="mt-3 w-full resize-y rounded-xl border border-black/15 bg-white p-3 text-sm leading-6 text-[#292a27] outline-none placeholder:text-black/30 focus:border-[#c96f50] focus:ring-2 focus:ring-[#c96f50]/20 disabled:bg-black/[0.03]"
            />
            <span className="mt-1 block text-right text-[11px] text-black/40">{notes.length} / 2,000</span>
          </label>

          {!canManage && (
            <div className="flex gap-3 rounded-xl border border-black/10 bg-white p-4 text-sm text-black/60">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#9a4932]" aria-hidden="true" />
              Viewer access is read-only. An owner or publisher can update consent status and notes.
            </div>
          )}

          {error && <p className="rounded-lg border border-red-700/20 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

          {canManage && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-black/10 pt-5">
              <button ref={discardButtonRef} type="button" onClick={discardAndClose} disabled={saving} className="min-h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-[#292a27] hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] disabled:cursor-not-allowed disabled:opacity-60">{dirty ? 'Discard changes' : 'Close'}</button>
              <button type="button" onClick={handleSaveClick} disabled={saving || !dirty} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#a14f35] px-4 text-sm font-semibold text-white hover:bg-[#88412d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {saving ? 'Saving…' : 'Save record'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-black/40">{label}</dt>
      <dd className="mt-1 text-sm text-[#292a27]">{value}</dd>
    </div>
  )
}
