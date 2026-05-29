'use client'

/**
 * Inline Admin Mode
 *
 * Lets a logged-in admin (damAccess) edit site content *in place* on the public
 * site instead of going to /admin/*. Activated with `?admin=1` on any public
 * route; persisted in localStorage; cleared with `?admin=0` or the chrome's Exit.
 *
 * Design (see tmp/inline-admin-mode-REFINED.md):
 *  - The provider ALWAYS wraps the page tree but stays inert for public visitors:
 *    the activation effect returns early unless admin mode was requested, so no
 *    /api/admin/me call and no chrome bundle is loaded. <Editable> children read
 *    `enabled` from context and render plain children when off (zero hydration risk).
 *  - When requested, it verifies the session via GET /api/admin/me. The client
 *    toggle is cosmetic; server-side requireAdminApi() on each write is the real gate.
 *  - The heavy floating chrome lazy-loads (ssr:false) only once enabled.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'lashpop-admin-mode'

// Lazy chrome — never enters the bundle for public visitors.
const AdminChrome = dynamic(
  () => import('@/components/admin-mode/AdminChrome').then(m => ({ default: m.AdminChrome })),
  { ssr: false }
)

export interface AdminUser {
  userId: string
  name: string | null
  email: string | null
}

export type AdminModeStatus = 'idle' | 'checking' | 'authed' | 'denied'

/**
 * A piece of content that currently has unsaved edits. Each <Editable> registers
 * one of these while dirty so the chrome can show a count and offer "Save all".
 */
export interface DirtyBlock {
  id: string
  /** Human label shown in the chrome's dirty list (e.g. "Emily — bio"). */
  label: string
  /** Persist this block. Should resolve on success and throw on failure. */
  save: () => Promise<void>
  /** Revert local state to last-saved. */
  discard: () => void
}

interface AdminModeValue {
  enabled: boolean
  status: AdminModeStatus
  user: AdminUser | null
  dirtyCount: number
  /** Snapshot of currently-dirty blocks (for the chrome list). */
  dirtyBlocks: DirtyBlock[]
  registerDirty: (block: DirtyBlock) => void
  clearDirty: (id: string) => void
  /** Save every dirty block in series; collects failures. */
  saveAll: () => Promise<{ saved: number; failed: number }>
  discardAll: () => void
  /** Re-pull server components so cross-component dependents (e.g. SEO JSON-LD) update. */
  refresh: () => void
  exit: () => void
}

const INERT: AdminModeValue = {
  enabled: false,
  status: 'idle',
  user: null,
  dirtyCount: 0,
  dirtyBlocks: [],
  registerDirty: () => {},
  clearDirty: () => {},
  saveAll: async () => ({ saved: 0, failed: 0 }),
  discardAll: () => {},
  refresh: () => {},
  exit: () => {},
}

const AdminModeContext = createContext<AdminModeValue | null>(null)

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<AdminModeStatus>('idle')
  const [user, setUser] = useState<AdminUser | null>(null)

  // Dirty registry. Ref is the source of truth; a version counter triggers renders.
  const dirtyRef = useRef<Map<string, DirtyBlock>>(new Map())
  const [, bump] = useState(0)
  const rerender = useCallback(() => bump(v => v + 1), [])

  // Activation: mirror DesignModeGate's URL-param + localStorage pattern, then
  // verify the session. Runs once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const p = params.get('admin')

    if (p === '0') {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    const wanted = p === '1' || localStorage.getItem(STORAGE_KEY) === '1'
    if (!wanted) return // public visitor — stay fully inert

    if (p === '1') localStorage.setItem(STORAGE_KEY, '1')

    let cancelled = false
    setStatus('checking')
    // redirect:'manual' so the middleware's no-cookie redirect to /dam/login
    // surfaces as a non-ok opaque response rather than fetching login HTML.
    fetch('/api/admin/me', { redirect: 'manual', cache: 'no-store' })
      .then(async res => {
        if (cancelled) return
        if (res.ok) {
          const data = (await res.json()) as AdminUser & { isAdmin: boolean }
          setUser({ userId: data.userId, name: data.name, email: data.email })
          setEnabled(true)
          setStatus('authed')
        } else {
          setStatus('denied')
          // Only bounce to login if they explicitly asked for it this load.
          if (p === '1') {
            const next = encodeURIComponent(`${window.location.pathname}?admin=1`)
            window.location.href = `/dam/login?next=${next}`
          }
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('denied')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const registerDirty = useCallback(
    (block: DirtyBlock) => {
      dirtyRef.current.set(block.id, block)
      rerender()
    },
    [rerender]
  )

  const clearDirty = useCallback(
    (id: string) => {
      if (dirtyRef.current.delete(id)) rerender()
    },
    [rerender]
  )

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const saveAll = useCallback(async () => {
    let saved = 0
    let failed = 0
    // Snapshot first — blocks clear themselves from the registry on success.
    for (const block of Array.from(dirtyRef.current.values())) {
      try {
        await block.save()
        saved++
      } catch {
        failed++
      }
    }
    if (saved > 0) router.refresh()
    return { saved, failed }
  }, [router])

  const discardAll = useCallback(() => {
    for (const block of Array.from(dirtyRef.current.values())) block.discard()
    dirtyRef.current.clear()
    rerender()
  }, [rerender])

  const exit = useCallback(() => {
    if (dirtyRef.current.size > 0) {
      const ok = window.confirm('You have unsaved edits. Exit admin mode and discard them?')
      if (!ok) return
      discardAll()
    }
    localStorage.removeItem(STORAGE_KEY)
    setEnabled(false)
    setStatus('idle')
    const url = new URL(window.location.href)
    url.searchParams.delete('admin')
    window.history.replaceState({}, '', url.toString())
  }, [discardAll])

  // Warn before navigating away with unsaved edits.
  useEffect(() => {
    if (!enabled) return
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current.size > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [enabled])

  const dirtyBlocks = Array.from(dirtyRef.current.values())

  const value = useMemo<AdminModeValue>(
    () => ({
      enabled,
      status,
      user,
      dirtyCount: dirtyBlocks.length,
      dirtyBlocks,
      registerDirty,
      clearDirty,
      saveAll,
      discardAll,
      refresh,
      exit,
    }),
    // dirtyBlocks identity changes on every rerender() bump, which is what we want.
    [enabled, status, user, dirtyBlocks, registerDirty, clearDirty, saveAll, discardAll, refresh, exit]
  )

  return (
    <AdminModeContext.Provider value={value}>
      {children}
      {enabled && <AdminChrome />}
    </AdminModeContext.Provider>
  )
}

/**
 * Read inline-admin state. Safe to call outside the provider — returns an inert
 * (disabled) value so <Editable> never throws if rendered in an unwrapped tree.
 */
export function useAdminMode(): AdminModeValue {
  return useContext(AdminModeContext) ?? INERT
}
