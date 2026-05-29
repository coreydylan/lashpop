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

// Inline login modal — only loaded when someone tries to enter admin mode unauthenticated.
const AdminLoginModal = dynamic(
  () => import('@/components/admin-mode/AdminLoginModal').then(m => ({ default: m.AdminLoginModal })),
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
  /** Persist this block. Should resolve on success and throw on failure.
   *  `skipRefresh` lets "Save all" defer to a single router.refresh(). */
  save: (opts?: { skipRefresh?: boolean }) => Promise<void>
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
  /** Turn admin mode on (secret gesture / chrome). Verifies the session and shows
   *  the inline login modal if not signed in. */
  enterAdminMode: () => void
  /** Label of the most-recent undoable edit (null if none this session). */
  lastUndoLabel: string | null
  /** Number of undoable edits on the session stack. */
  undoCount: number
  /** Record an undoable edit. `run` re-applies the prior value (does NOT push). */
  pushUndo: (entry: UndoEntry) => void
  /** Revert the most recent edit. Session-scoped (cleared on reload). */
  undoLast: () => Promise<void>
}

/** A reversible edit. `run` persists the prior value via the field's own save path. */
export interface UndoEntry {
  id: string
  label: string
  run: () => Promise<void>
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
  enterAdminMode: () => {},
  lastUndoLabel: null,
  undoCount: 0,
  pushUndo: () => {},
  undoLast: async () => {},
}

const AdminModeContext = createContext<AdminModeValue | null>(null)

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<AdminModeStatus>('idle')
  const [user, setUser] = useState<AdminUser | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  // Session undo stack (most recent last). Cleared on reload — matches how CMS
  // undo works; persistent rollback comes from version history (Phase 1b).
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])

  // Dirty registry. Ref is the source of truth; a version counter triggers renders.
  const dirtyRef = useRef<Map<string, DirtyBlock>>(new Map())
  // `version` bumps whenever the dirty registry mutates; it keys the memoized
  // dirtyBlocks snapshot and the context value so they only recompute on change.
  const [version, bump] = useState(0)
  const rerender = useCallback(() => bump(v => v + 1), [])

  // Verify the admin session. On success → enable. On denial → show the inline
  // login modal (explicit entry) or silently clear a stale persisted flag.
  const checkSession = useCallback(
    async (opts?: { promptIfDenied?: boolean; persistedOnly?: boolean }) => {
      setStatus('checking')
      try {
        // redirect:'manual' so the middleware's no-cookie redirect to /dam/login
        // surfaces as a non-ok opaque response rather than fetching login HTML.
        const res = await fetch('/api/admin/me', { redirect: 'manual', cache: 'no-store' })
        if (res.ok) {
          const data = (await res.json()) as AdminUser & { isAdmin: boolean }
          setUser({ userId: data.userId, name: data.name, email: data.email })
          setEnabled(true)
          setShowLogin(false)
          setStatus('authed')
          return true
        }
        setStatus('denied')
        if (opts?.promptIfDenied) setShowLogin(true)
        else if (opts?.persistedOnly && typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
        return false
      } catch {
        setStatus('denied')
        return false
      }
    },
    []
  )

  // Public entry point: secret gesture / chrome / ?admin=1. Persists the flag,
  // verifies, and pops the inline login modal if not signed in (no redirect).
  const enterAdminMode = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1')
    void checkSession({ promptIfDenied: true })
  }, [checkSession])

  // On mount: ?admin=0 clears; ?admin=1 enters (+ prompts login); a persisted flag
  // re-verifies silently (clearing itself if the session is gone).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search).get('admin')
    if (p === '0') {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    if (p === '1') {
      localStorage.setItem(STORAGE_KEY, '1')
      void checkSession({ promptIfDenied: true })
      return
    }
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      void checkSession({ persistedOnly: true })
    }
  }, [checkSession])

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

  const pushUndo = useCallback((entry: UndoEntry) => {
    setUndoStack(s => [...s, entry].slice(-25))
  }, [])

  const undoLast = useCallback(async () => {
    let entry: UndoEntry | undefined
    setUndoStack(s => {
      entry = s[s.length - 1]
      return s.slice(0, -1)
    })
    if (entry) {
      try {
        await entry.run()
        router.refresh()
      } catch {
        // ignore — the field surfaces its own error
      }
    }
  }, [router])

  const saveAll = useCallback(async () => {
    let saved = 0
    let failed = 0
    // Snapshot first — blocks clear themselves from the registry on success.
    for (const block of Array.from(dirtyRef.current.values())) {
      try {
        await block.save({ skipRefresh: true })
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

  const dirtyBlocks = useMemo(() => Array.from(dirtyRef.current.values()), [version])

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
      enterAdminMode,
      lastUndoLabel: undoStack.length ? undoStack[undoStack.length - 1].label : null,
      undoCount: undoStack.length,
      pushUndo,
      undoLast,
    }),
    // dirtyBlocks identity changes on every rerender() bump, which is what we want.
    [enabled, status, user, dirtyBlocks, registerDirty, clearDirty, saveAll, discardAll, refresh, exit, enterAdminMode, undoStack, pushUndo, undoLast]
  )

  return (
    <AdminModeContext.Provider value={value}>
      {children}
      {enabled && <AdminChrome />}
      {showLogin && !enabled && (
        <AdminLoginModal
          onSuccess={() => void checkSession({ promptIfDenied: false })}
          onClose={() => setShowLogin(false)}
        />
      )}
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
