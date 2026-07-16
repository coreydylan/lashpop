'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Users } from 'lucide-react'

type AdminRole = 'owner' | 'publisher' | 'viewer' | null

interface UserRow {
  id: string
  phoneNumber: string | null
  email: string | null
  name: string | null
  adminRole: AdminRole
  createdAt: string
}

const ROLE_COPY: Record<Exclude<AdminRole, null>, string> = {
  owner: 'Full access, including roles and infrastructure controls.',
  publisher: 'Can edit and publish content, reviews, and media.',
  viewer: 'Read-only access for verification and support.',
}

export default function AdminAccessPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void loadUsers() }, [])

  async function loadUsers() {
    setError(null)
    try {
      const response = await fetch('/api/admin/dam-users')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load users')
      setUsers(data.users)
      setCurrentUserId(data.currentUserId)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function updateRole(userId: string, adminRole: AdminRole) {
    setUpdating(userId)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/dam-users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, adminRole }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update role')
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, adminRole } : user))
      setMessage('Access updated.')
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-black/10 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#c96f50]/10 text-[#a14f35]"><Users className="size-5" /></span>
          <div>
            <h1 className="font-serif text-3xl text-[#292a27]">Admin access</h1>
            <p className="mt-1 text-sm text-black/60">Give each person only the access their work requires.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.entries(ROLE_COPY) as Array<[Exclude<AdminRole, null>, string]>).map(([role, copy]) => (
          <div key={role} className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm font-semibold capitalize">{role}</p>
            <p className="mt-1 text-xs leading-5 text-black/55">{copy}</p>
          </div>
        ))}
      </div>

      <div aria-live="polite" className="min-h-5 text-sm">
        {error && <p className="text-red-700">{error}</p>}
        {!error && message && <p className="text-emerald-700">{message}</p>}
      </div>

      <section className="overflow-hidden rounded-xl border border-black/10 bg-white" aria-busy={loading}>
        <div className="border-b border-black/10 px-5 py-4">
          <h2 className="font-semibold">Registered people</h2>
          <p className="mt-1 text-xs text-black/50">People must sign in once before they appear here.</p>
        </div>
        {loading ? (
          <div className="p-8 text-sm text-black/50">Loading access…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-sm text-black/50">No registered users found.</div>
        ) : (
          <ul className="divide-y divide-black/10">
            {users.map((user) => (
              <li key={user.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_16rem] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{user.name || 'Unnamed user'}</p>
                    {user.id === currentUserId && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black/50">You</span>}
                    {user.adminRole && <ShieldCheck className="size-4 text-[#a14f35]" aria-label={`${user.adminRole} access`} />}
                  </div>
                  <p className="mt-1 truncate text-xs text-black/55">{user.email || user.phoneNumber || 'No contact information'}</p>
                </div>
                <div>
                  <label htmlFor={`role-${user.id}`} className="sr-only">Role for {user.name || user.email || user.phoneNumber}</label>
                  <select
                    id={`role-${user.id}`}
                    value={user.adminRole ?? 'none'}
                    onChange={(event) => void updateRole(user.id, event.target.value === 'none' ? null : event.target.value as AdminRole)}
                    disabled={updating === user.id || (user.id === currentUserId && user.adminRole === 'owner')}
                    className="min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-black/45"
                  >
                    <option value="none">No admin access</option>
                    <option value="viewer">Viewer — read only</option>
                    <option value="publisher">Publisher — edit content</option>
                    <option value="owner">Owner — full access</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
