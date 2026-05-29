'use client'

/**
 * Shared dirty-block lifecycle for every Editable* primitive.
 *
 * Registers a DirtyBlock with the AdminMode provider while `dirty` is true, so
 * the floating chrome shows the count and "Save all" can batch-save it. Keeps
 * save/discard in refs so the registered block always runs the latest logic
 * without re-registration churn. Mirrors the proven effect in EditableText.
 */
import { useEffect, useRef } from 'react'
import { useAdminMode } from '@/contexts/AdminModeContext'

export function useDirtyBlock(args: {
  id: string
  label: string
  dirty: boolean
  /** Persist. `skipRefresh` is passed by Save-all so it can do one refresh. */
  save: (opts?: { skipRefresh?: boolean }) => Promise<void>
  discard: () => void
}) {
  const { registerDirty, clearDirty } = useAdminMode()
  const { id, label, dirty, save, discard } = args

  const saveRef = useRef(save)
  saveRef.current = save
  const discardRef = useRef(discard)
  discardRef.current = discard

  useEffect(() => {
    if (dirty) {
      registerDirty({
        id,
        label,
        save: opts => saveRef.current(opts),
        discard: () => discardRef.current(),
      })
    } else {
      clearDirty(id)
    }
    return () => clearDirty(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, id, label])
}
