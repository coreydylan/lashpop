import { Metadata } from 'next'
import { getStudioSettings } from '@/actions/studio'
import { StudioInfoEditor } from './StudioInfoEditor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Studio Info — LashPop Admin',
}

export default async function StudioInfoPage() {
  const settings = await getStudioSettings()
  return <StudioInfoEditor initialSettings={settings} />
}
