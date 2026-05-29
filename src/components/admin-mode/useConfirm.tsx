'use client'

/**
 * Provider-free confirm dialog for destructive inline-admin actions.
 * Renders the ONE destructive string ("Remove X? You can add it back anytime.")
 * with Remove / Keep. Each primitive owns its own dialog via this hook:
 *
 *   const { confirm, dialog } = useConfirm()
 *   ...
 *   onClick={async () => { if (await confirm('Remove "Founder"?')) doRemove() }}
 *   return <>{rows}{dialog}</>
 */
import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { ADMIN } from './adminTokens'

export function useConfirm() {
  const [state, setState] = useState<{ message: string; resolve: (ok: boolean) => void } | null>(null)

  const confirm = useCallback(
    (message: string) => new Promise<boolean>(resolve => setState({ message, resolve })),
    []
  )

  const close = (ok: boolean) => {
    state?.resolve(ok)
    setState(null)
  }

  const dialog =
    state && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30 p-4"
            onClick={() => close(false)}
          >
            <div
              className="w-[min(92vw,360px)] rounded-2xl bg-white p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
            >
              <p className="text-sm leading-relaxed text-stone-800">{state.message}</p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-stone-600 hover:bg-stone-100"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className="min-h-[44px] rounded-lg px-4 text-sm font-semibold text-white"
                  style={{ background: ADMIN.accentStrong }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return { confirm, dialog }
}
