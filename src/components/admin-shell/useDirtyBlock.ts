'use client'

import { useEffect, useRef } from 'react'
import {
  useAdminWorkspace,
  type DirtyBlockAction,
} from './AdminWorkspaceContext'

interface UseDirtyBlockOptions {
  id: string
  label: string
  dirty: boolean
  save: DirtyBlockAction
  discard: DirtyBlockAction
}
/**
 * Registers a form draft with the admin workspace while it is dirty. Action
 * refs stay current without forcing registration churn on every keystroke.
 */
export function useDirtyBlock({
  id,
  label,
  dirty,
  save,
  discard,
}: UseDirtyBlockOptions) {
  const { registerDirty, clearDirty } = useAdminWorkspace()
  const saveRef = useRef(save)
  const discardRef = useRef(discard)
  saveRef.current = save
  discardRef.current = discard

  useEffect(() => {
    if (!dirty) {
      clearDirty(id)
      return
    }

    registerDirty({
      id,
      label,
      save: () => saveRef.current(),
      discard: () => discardRef.current(),
    })

    return () => clearDirty(id)
  }, [clearDirty, dirty, id, label, registerDirty])
}
