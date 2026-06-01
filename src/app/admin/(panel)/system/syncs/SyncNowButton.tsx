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
      if (res.ok) {
        setMessage('Synced from Vagaro')
        router.refresh()
      } else {
        setMessage(`Sync failed: ${data.error || res.statusText}`)
      }
    } catch {
      setMessage('Sync failed — could not reach the worker')
    } finally {
      setSyncing(false)
      setTimeout(() => setMessage(null), 6000)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className={`text-sm ${message.startsWith('Sync failed') ? 'text-red-600' : 'text-ocean-mist'}`}>{message}</span>
      )}
      <button onClick={run} disabled={syncing} className="btn btn-primary">
        {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {syncing ? 'Syncing…' : 'Sync from Vagaro now'}
      </button>
    </div>
  )
}
