import { ReactNode } from 'react'
import { DAMProviders } from '@/components/dam/DAMProviders'

export const dynamic = 'force-dynamic'

/**
 * Asset Manager (formerly the standalone /dam) now lives under /admin/assets.
 * Auth + AdminShell are provided by the parent /admin layout; this layer just
 * adds the DAM-specific providers (React Query + tutorial context). The
 * AdminShell switches to fullbleed for /admin/assets so the grid + omnibar use
 * the full width.
 */
export default function AssetsLayout({ children }: { children: ReactNode }) {
  return <DAMProviders>{children}</DAMProviders>
}
