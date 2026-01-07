import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Punchlist | LashPop',
  description: 'Project punchlist for the LashPop team'
}

export default function PunchlistLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
