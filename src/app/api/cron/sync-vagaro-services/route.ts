import { NextRequest, NextResponse } from 'next/server'
import { syncAllServices, syncAllTeamMembers } from '@/lib/vagaro-sync'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('🔄 Starting Vagaro services + team sync...')
  const results = {
    services: { success: false, error: null as string | null },
    teamMembers: { success: false, error: null as string | null }
  }

  try {
    await syncAllServices()
    results.services.success = true
  } catch (error: any) {
    console.error('❌ Service sync failed:', error)
    results.services.error = error.message
  }

  try {
    await syncAllTeamMembers()
    results.teamMembers.success = true
  } catch (error: any) {
    console.error('❌ Team member sync failed:', error)
    results.teamMembers.error = error.message
  }

  const allSucceeded = results.services.success && results.teamMembers.success

  return NextResponse.json({
    success: allSucceeded,
    timestamp: new Date().toISOString(),
    results
  }, { status: allSucceeded ? 200 : 207 })
}
