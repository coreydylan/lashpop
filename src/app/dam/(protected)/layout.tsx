import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { DAMProviders } from '../components/DAMProviders'
import { AdminShell } from '@/components/admin-shell/AdminShell'
import { getAdminSession } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

/**
 * Protected layout for /dam/*.
 *
 * Uses the shared `getAdminSession()` helper (same one /admin/layout.tsx
 * uses) so auth is unified across the studio control panel. Wraps the
 * DAM in the same AdminShell as the admin pages — in `fullbleed` mode so
 * the asset grid + sticky omnibar can use the full content area without
 * the form-page max-width constraint.
 *
 * Net effect: navigating between /admin/* and /dam/* feels like one
 * panel — same sidebar, same user footer, same "Back to lashpop.com".
 */
export default async function ProtectedDamLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession()
  if (!session) {
    redirect('/dam/login')
  }
  if (!session.isAdmin) {
    redirect('/admin/no-access')
  }

  return (
    <AdminShell
      contentMode="fullbleed"
      user={{
        name: session.name,
        phoneNumber: session.phoneNumber,
        email: session.email,
      }}
    >
      <DAMProviders>{children}</DAMProviders>
    </AdminShell>
  )
}
