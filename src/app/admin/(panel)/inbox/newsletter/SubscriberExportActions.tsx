'use client'

import { useState } from 'react'
import { Check, ClipboardCopy, Download, TriangleAlert } from 'lucide-react'

interface SubscriberExportRow {
  email: string
  subscribedAt: string | null
  source: string | null
}

interface SubscriberExportActionsProps {
  subscribers: SubscriberExportRow[]
}

type ActionStatus = {
  kind: 'success' | 'error'
  message: string
} | null

function escapeCsvCell(value: string): string {
  // Prevent spreadsheet software from interpreting imported subscriber data
  // as a formula while preserving the visible value.
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safeValue.replace(/"/g, '""')}"`
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()

  const copied = document.execCommand('copy')
  textArea.remove()
  if (!copied) throw new Error('Clipboard access is unavailable in this browser.')
}

export function SubscriberExportActions({ subscribers }: SubscriberExportActionsProps) {
  const [status, setStatus] = useState<ActionStatus>(null)

  async function handleCopy() {
    try {
      await copyText(subscribers.map((subscriber) => subscriber.email).join('\n'))
      setStatus({
        kind: 'success',
        message: `${subscribers.length} opted-in ${subscribers.length === 1 ? 'address' : 'addresses'} copied.`,
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not copy the email list.',
      })
    }
  }

  function handleExport() {
    try {
      const header = ['email', 'subscribed_at', 'source'].map(escapeCsvCell).join(',')
      const rows = subscribers.map((subscriber) =>
        [subscriber.email, subscriber.subscribedAt ?? '', subscriber.source ?? 'footer_form']
          .map(escapeCsvCell)
          .join(','),
      )
      const csv = `\uFEFF${[header, ...rows].join('\r\n')}\r\n`
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `lashpop-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      setStatus({
        kind: 'success',
        message: `${subscribers.length} opted-in ${subscribers.length === 1 ? 'subscriber' : 'subscribers'} exported.`,
      })
    } catch {
      setStatus({ kind: 'error', message: 'Could not export the subscriber list.' })
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-[#292a27] hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] focus-visible:ring-offset-2"
        >
          <ClipboardCopy className="size-4" aria-hidden="true" />
          Copy emails
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#292a27] px-4 text-sm font-semibold text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] focus-visible:ring-offset-2"
        >
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>
      <p className="min-h-5 text-xs text-black/55" role="status" aria-live="polite">
        {status && (
          <span className="inline-flex items-center gap-1.5">
            {status.kind === 'success' ? (
              <Check className="size-3.5 text-emerald-700" aria-hidden="true" />
            ) : (
              <TriangleAlert className="size-3.5 text-red-700" aria-hidden="true" />
            )}
            {status.message}
          </span>
        )}
      </p>
    </div>
  )
}
