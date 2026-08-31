"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Check } from 'lucide-react'

export function SyncNowButton() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const run = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/website/team/sync', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data?.partial) {
        setMessage('Vagaro update completed with issues. Check the recent syncs below.')
        router.refresh()
      } else if (res.ok && data?.success !== false) {
        const workerResult = data?.result?.result
        const categories = workerResult?.categories?.stats
        const services = workerResult?.services?.stats
        setMessage(
          categories && services
            ? `Synced ${categories.fetched} categories and ${services.synced} services from Vagaro`
            : 'Vagaro information is up to date',
        )
        router.refresh()
      } else {
        setMessage('Sync failed. Try again or check the recent syncs below.')
      }
    } catch {
      setMessage('Sync failed because Admin could not reach the sync service. Try again.')
    } finally {
      setSyncing(false)
      setTimeout(() => setMessage(null), 6000)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span role={message.startsWith('Sync failed') ? 'alert' : 'status'} aria-live={message.startsWith('Sync failed') ? 'assertive' : 'polite'} className={`text-sm ${message.startsWith('Sync failed') ? 'text-red-600' : message.includes('issues') ? 'text-amber-700' : 'text-ocean-mist'}`}>{message}</span>
      )}
      <button onClick={run} disabled={syncing} className="btn btn-primary">
        {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {syncing ? 'Syncing…' : 'Sync from Vagaro now'}
      </button>
    </div>
  )
}
