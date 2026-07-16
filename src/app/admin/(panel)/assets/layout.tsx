import { ReactNode } from 'react'
import { DAMProviders } from '@/components/dam/DAMProviders'

export const dynamic = 'force-dynamic'

/**
 * The native Media workspace inherits authentication and navigation from the
 * AdminShell. This layer only supplies the library-specific query and guidance
 * providers used by the asset grid, uploader, and organization tools.
 */
export default function AssetsLayout({ children }: { children: ReactNode }) {
  return <DAMProviders>{children}</DAMProviders>
}
