'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import {
  VAGARO_OWNER_WORKFLOWS,
  VAGARO_SYNC_SCHEDULE,
  type VagaroOwnerWorkflowKind,
} from '@/lib/admin/vagaro-owner-workflows'

type VagaroFirstWorkflowProps = {
  kind: VagaroOwnerWorkflowKind
  defaultOpen?: boolean
  onSyncComplete?: () => Promise<void> | void
}

export function VagaroFirstWorkflow({
  kind,
  defaultOpen = false,
  onSyncComplete,
}: VagaroFirstWorkflowProps) {
  const workflow = VAGARO_OWNER_WORKFLOWS[kind]
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const [acknowledged, setAcknowledged] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<'success' | 'warning' | 'failed' | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const runSync = async () => {
    if (!acknowledged) return
    setSyncing(true)
    setSyncResult(null)
    setSyncMessage(null)

    try {
      const response = await fetch('/api/admin/website/team/sync', { method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (data?.partial) {
        setSyncResult('warning')
        setSyncMessage('The Vagaro update completed with issues. Open Vagaro sync to see which step failed.')
        await onSyncComplete?.()
        router.refresh()
        return
      }
      if (!response.ok || data?.success === false) {
        setSyncResult('failed')
        setSyncMessage('The Vagaro update did not finish. Open Vagaro sync to see which step failed.')
        return
      }

      setSyncResult('success')
      setSyncMessage('The Vagaro update finished. Review the changes below before publishing.')
      await onSyncComplete?.()
      router.refresh()
    } catch {
      setSyncResult('failed')
      setSyncMessage('Could not start the Vagaro update. Nothing was published. Try again or open Vagaro sync.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-ocean-mist/25 bg-cream/80">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist/40 focus-visible:ring-inset"
        aria-expanded={open}
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-wider text-ocean-mist">Start here</span>
          <span className="mt-1 block font-serif text-xl text-dune">{workflow.title}</span>
          <span className="mt-1 block text-sm leading-5 text-dune/60">{workflow.summary}</span>
        </span>
        {open ? <ChevronUp className="size-5 shrink-0 text-dune/50" /> : <ChevronDown className="size-5 shrink-0 text-dune/50" />}
      </button>

      {open && (
        <div className="border-t border-ocean-mist/20 px-5 py-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-dune/50">1. Finish this in Vagaro</p>
              <ol className="mt-3 grid gap-3">
                {workflow.vagaroSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-dune/75">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ocean-mist/15 text-xs font-semibold text-ocean-mist">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="https://www.vagaro.com/" target="_blank" rel="noreferrer" className="btn btn-secondary">
                  Open Vagaro <ExternalLink className="size-4" />
                </a>
                {workflow.officialHelp.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-ocean-mist hover:text-dune">
                    {link.label} <ExternalLink className="size-3" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-sage/20 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-dune/50">2. Return here and update from Vagaro</p>
              <p className="mt-2 text-sm leading-6 text-dune/65">
                The update runs in this order: categories, services, team members, then each stylist&apos;s service assignments.
              </p>
              <p className="mt-2 text-xs leading-5 text-dune/50">
                Automatic updates run {VAGARO_SYNC_SCHEDULE.cadence}. During Pacific daylight saving time: {VAGARO_SYNC_SCHEDULE.daylightPacific.join(', ')}. During Pacific standard time: {VAGARO_SYNC_SCHEDULE.standardPacific.join(', ')}.
              </p>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-sage/20 bg-cream/60 p-3 text-sm leading-5 text-dune/75">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="mt-0.5 size-4 accent-ocean-mist"
                />
                <span>{workflow.acknowledgement}</span>
              </label>

              <button
                type="button"
                onClick={runSync}
                disabled={!acknowledged || syncing}
                className="btn btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Updating from Vagaro…' : 'Update from Vagaro now'}
              </button>

              {!acknowledged && (
                <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-dune/50">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  Confirm the Vagaro setup above before starting the update.
                </p>
              )}

              {syncMessage && (
                <p role={syncResult === 'failed' ? 'alert' : 'status'} className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-xs leading-5 ${syncResult === 'success' ? 'bg-ocean-mist/10 text-dune' : 'bg-dusty-rose/10 text-dune'}`}>
                  {syncResult === 'success' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ocean-mist" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-dusty-rose" />}
                  {syncMessage}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-sage/20 bg-sage/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-dune/50">3. Review before publishing</p>
            <p className="mt-2 text-sm leading-6 text-dune/65">{workflow.expectedResult}</p>
            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
              {workflow.afterSyncSteps.map((step) => (
                <li key={step} className="flex gap-2 text-xs leading-5 text-dune/70">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-ocean-mist" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  )
}
