'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { UnsavedChangesDialog } from './UnsavedChangesDialog'

export type DirtyBlockAction = () => void | Promise<void>
export type DirtyBlockStatus = 'idle' | 'saving' | 'discarding' | 'error'
export type WorkspaceOperation = 'saving' | 'discarding' | null

export interface DirtyBlock {
  id: string
  label: string
  save: DirtyBlockAction
  discard: DirtyBlockAction
}

export interface DirtyBlockView {
  id: string
  label: string
  status: DirtyBlockStatus
  error: string | null
}

export interface DirtyOperationFailure {
  id: string
  label: string
  error: string
}

export interface DirtyOperationResult {
  succeeded: string[]
  failed: DirtyOperationFailure[]
}

interface RegisteredDirtyBlock extends DirtyBlock {
  status: DirtyBlockStatus
  error: string | null
}

type ConfirmationKind = 'discard' | 'navigate'

interface ConfirmationRequest {
  kind: ConfirmationKind
  count: number
  resolve: (confirmed: boolean) => void
}

interface AdminWorkspaceValue {
  dirtyBlocks: DirtyBlockView[]
  dirtyCount: number
  errorCount: number
  activeOperation: WorkspaceOperation
  registerDirty: (block: DirtyBlock) => void
  clearDirty: (id: string) => void
  saveAll: () => Promise<DirtyOperationResult>
  discardAll: () => Promise<DirtyOperationResult>
  requestDiscardAll: () => Promise<DirtyOperationResult | null>
  /**
   * Use before client-side navigation. A true result means it is safe to
   * continue; false means the admin kept editing or a discard failed.
   */
  confirmNavigation: () => Promise<boolean>
}

const AdminWorkspaceContext = createContext<AdminWorkspaceValue | null>(null)

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

function countLabel(count: number): string {
  return `${count} unsaved ${count === 1 ? 'change' : 'changes'}`
}

export function AdminWorkspaceProvider({ children }: { children: ReactNode }) {
  const blocksRef = useRef<Map<string, RegisteredDirtyBlock>>(new Map())
  const operatingRef = useRef(false)
  const confirmationRef = useRef<ConfirmationRequest | null>(null)
  const [, setVersion] = useState(0)
  const [activeOperation, setActiveOperation] = useState<WorkspaceOperation>(null)
  const [announcement, setAnnouncement] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null)

  const publish = useCallback(() => setVersion((current) => current + 1), [])

  const registerDirty = useCallback((block: DirtyBlock) => {
    const current = blocksRef.current.get(block.id)
    blocksRef.current.set(block.id, {
      ...block,
      status: current?.status ?? 'idle',
      error: current?.error ?? null,
    })
    publish()
    setAnnouncement(countLabel(blocksRef.current.size))
  }, [publish])

  const clearDirty = useCallback((id: string) => {
    if (!blocksRef.current.delete(id)) return
    publish()
    setAnnouncement(
      blocksRef.current.size === 0 ? 'All changes are saved' : countLabel(blocksRef.current.size),
    )
  }, [publish])

  const updateBlock = useCallback((
    id: string,
    patch: Pick<RegisteredDirtyBlock, 'status' | 'error'>,
  ) => {
    const current = blocksRef.current.get(id)
    if (!current) return
    blocksRef.current.set(id, { ...current, ...patch })
    publish()
  }, [publish])

  const saveAll = useCallback(async (): Promise<DirtyOperationResult> => {
    if (operatingRef.current) {
      setAnnouncement('Another change operation is already in progress')
      return { succeeded: [], failed: [] }
    }

    const snapshot = Array.from(blocksRef.current.values())
    if (snapshot.length === 0) return { succeeded: [], failed: [] }

    operatingRef.current = true
    setActiveOperation('saving')
    setAnnouncement(`Saving ${countLabel(snapshot.length)}`)
    const result: DirtyOperationResult = { succeeded: [], failed: [] }

    try {
      // Run in registration order. Several admin fields can share one endpoint;
      // serial writes avoid last-write-wins races between those fields.
      for (const block of snapshot) {
        updateBlock(block.id, { status: 'saving', error: null })
        try {
          await block.save()
          result.succeeded.push(block.id)
          const current = blocksRef.current.get(block.id)
          if (current?.save === block.save) blocksRef.current.delete(block.id)
          publish()
        } catch (error) {
          const message = errorMessage(error, `Could not save ${block.label}`)
          result.failed.push({ id: block.id, label: block.label, error: message })
          updateBlock(block.id, { status: 'error', error: message })
        }
      }
    } finally {
      operatingRef.current = false
      setActiveOperation(null)
    }

    setAnnouncement(
      result.failed.length > 0
        ? `Saved ${result.succeeded.length}; ${result.failed.length} ${result.failed.length === 1 ? 'change' : 'changes'} could not be saved`
        : `Saved ${result.succeeded.length} ${result.succeeded.length === 1 ? 'change' : 'changes'}`,
    )
    return result
  }, [publish, updateBlock])

  const discardAll = useCallback(async (): Promise<DirtyOperationResult> => {
    if (operatingRef.current) {
      setAnnouncement('Another change operation is already in progress')
      return { succeeded: [], failed: [] }
    }

    const snapshot = Array.from(blocksRef.current.values())
    if (snapshot.length === 0) return { succeeded: [], failed: [] }

    operatingRef.current = true
    setActiveOperation('discarding')
    setAnnouncement(`Discarding ${countLabel(snapshot.length)}`)
    const result: DirtyOperationResult = { succeeded: [], failed: [] }

    try {
      for (const block of snapshot) {
        updateBlock(block.id, { status: 'discarding', error: null })
        try {
          await block.discard()
          result.succeeded.push(block.id)
          const current = blocksRef.current.get(block.id)
          if (current?.discard === block.discard) blocksRef.current.delete(block.id)
          publish()
        } catch (error) {
          const message = errorMessage(error, `Could not discard ${block.label}`)
          result.failed.push({ id: block.id, label: block.label, error: message })
          updateBlock(block.id, { status: 'error', error: message })
        }
      }
    } finally {
      operatingRef.current = false
      setActiveOperation(null)
    }

    setAnnouncement(
      result.failed.length > 0
        ? `Discarded ${result.succeeded.length}; ${result.failed.length} ${result.failed.length === 1 ? 'change' : 'changes'} could not be discarded`
        : `Discarded ${result.succeeded.length} ${result.succeeded.length === 1 ? 'change' : 'changes'}`,
    )
    return result
  }, [publish, updateBlock])

  const askForConfirmation = useCallback((kind: ConfirmationKind, count: number) => {
    confirmationRef.current?.resolve(false)
    return new Promise<boolean>((resolve) => {
      const request = { kind, count, resolve }
      confirmationRef.current = request
      setConfirmation(request)
    })
  }, [])

  const settleConfirmation = useCallback((confirmed: boolean) => {
    const request = confirmationRef.current
    confirmationRef.current = null
    setConfirmation(null)
    request?.resolve(confirmed)
  }, [])

  const requestDiscardAll = useCallback(async () => {
    if (blocksRef.current.size === 0) return { succeeded: [], failed: [] }
    if (operatingRef.current) return null
    const confirmed = await askForConfirmation('discard', blocksRef.current.size)
    return confirmed ? discardAll() : null
  }, [askForConfirmation, discardAll])

  const confirmNavigation = useCallback(async () => {
    if (blocksRef.current.size === 0) return true
    if (operatingRef.current) {
      setAnnouncement('Wait for the current change operation before leaving')
      return false
    }

    const confirmed = await askForConfirmation('navigate', blocksRef.current.size)
    if (!confirmed) return false
    const result = await discardAll()
    return result.failed.length === 0 && blocksRef.current.size === 0
  }, [askForConfirmation, discardAll])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (blocksRef.current.size === 0) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => () => {
    confirmationRef.current?.resolve(false)
    confirmationRef.current = null
  }, [])

  // `publish` triggers the render; the Map remains the imperative source of
  // truth so registration callbacks never depend on stale render snapshots.
  const dirtyBlocks: DirtyBlockView[] = Array.from(blocksRef.current.values())
    .map(({ id, label, status, error }) => ({
      id,
      label,
      status,
      error,
    }))

  const value = useMemo<AdminWorkspaceValue>(() => ({
    dirtyBlocks,
    dirtyCount: dirtyBlocks.length,
    errorCount: dirtyBlocks.filter((block) => block.error).length,
    activeOperation,
    registerDirty,
    clearDirty,
    saveAll,
    discardAll,
    requestDiscardAll,
    confirmNavigation,
  }), [
    activeOperation,
    clearDirty,
    confirmNavigation,
    dirtyBlocks,
    discardAll,
    registerDirty,
    requestDiscardAll,
    saveAll,
  ])

  const confirmationCopy = confirmation?.kind === 'navigate'
    ? {
        title: 'Leave without saving?',
        description: `${countLabel(confirmation.count)} will be discarded before you leave this page. This cannot be undone.`,
        confirmLabel: 'Discard and leave',
      }
    : {
        title: 'Discard all unsaved changes?',
        description: `${countLabel(confirmation?.count ?? 0)} will be reset to the last saved values. This cannot be undone.`,
        confirmLabel: 'Discard changes',
      }

  return (
    <AdminWorkspaceContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <UnsavedChangesDialog
        open={confirmation !== null}
        title={confirmationCopy.title}
        description={confirmationCopy.description}
        confirmLabel={confirmationCopy.confirmLabel}
        onConfirm={() => settleConfirmation(true)}
        onCancel={() => settleConfirmation(false)}
      />
    </AdminWorkspaceContext.Provider>
  )
}

// Kept beside the provider because these four shell files are the complete
// workspace boundary; consumers should never import the raw context.
export function useAdminWorkspace(): AdminWorkspaceValue {
  const value = useContext(AdminWorkspaceContext)
  if (!value) {
    throw new Error('useAdminWorkspace must be used within AdminWorkspaceProvider')
  }
  return value
}
