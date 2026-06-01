import { Metadata } from 'next'
import { getFounderLetter } from '@/actions/founder-letter'
import { FounderLetterEditor } from './FounderLetterEditor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Founder Letter — LashPop Admin',
}

export default async function FounderLetterPage() {
  const content = await getFounderLetter()
  return <FounderLetterEditor initialContent={content} />
}
