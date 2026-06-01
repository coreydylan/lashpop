import { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

/**
 * Pass-through. Auth + the AdminShell live in the (panel) route group so the
 * login and no-access pages (which sit outside that group) render bare and are
 * never caught by the auth gate — no self-redirect loop.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
