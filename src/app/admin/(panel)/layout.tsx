import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/auth'
import { AdminShell } from '@/components/admin-shell/AdminShell'

export const dynamic = 'force-dynamic'

/**
 * The authenticated admin panel. Everything that needs the sidebar + an admin
 * session lives in this (panel) route group. /admin/login and /admin/no-access
 * sit OUTSIDE this group, so they're never gated by it — which is what makes
 * the redirect-to-login reliable (no self-redirect loop). Route groups don't
 * affect the URL: these pages still serve /admin/overview, /admin/website/*, etc.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  if (!session.isAdmin) {
    redirect('/admin/no-access')
  }

  return (
    <AdminShell
      user={{
        name: session.name,
        phoneNumber: session.phoneNumber,
        email: session.email,
      }}
    >
      {children}
    </AdminShell>
  )
}
