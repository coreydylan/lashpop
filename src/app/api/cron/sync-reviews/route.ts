import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { syncVagaroReviews } from '@/lib/review-scrapers/vagaro'
import { syncBrightDataReviews } from '@/lib/review-scrapers/brightdata'
import { applyStaleTeamMemberFilter, autoPromoteToHomepage } from '@/lib/review-filters'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

/**
 * Vercel Cron Job endpoint - runs daily to sync reviews from all sources
 * Triggered by Vercel Cron: 0 0 * * * (daily at midnight UTC)
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('🔄 Starting daily review sync...')
  const results = {
    vagaro: { success: false, error: null as string | null, stats: null as any },
    brightdata: { success: false, error: null as string | null, stats: null as any },
    filter: { success: false, error: null as string | null, stats: null as any },
    autoPromote: { success: false, error: null as string | null, stats: null as any }
  }

  // Sync Vagaro reviews
  try {
    console.log('📥 Syncing Vagaro reviews...')
    const vagaroStats = await syncVagaroReviews()
    results.vagaro.success = true
    results.vagaro.stats = vagaroStats
    console.log('✅ Vagaro sync complete:', vagaroStats)
  } catch (error: any) {
    console.error('❌ Vagaro sync failed:', error)
    results.vagaro.error = error.message
  }

  // Sync BrightData reviews (Yelp + Google)
  try {
    console.log('📥 Syncing BrightData reviews (Yelp + Google)...')
    const brightDataStats = await syncBrightDataReviews()
    results.brightdata.success = true
    results.brightdata.stats = brightDataStats
    console.log('✅ BrightData sync complete:', brightDataStats)
  } catch (error: any) {
    console.error('❌ BrightData sync failed:', error)
    results.brightdata.error = error.message
  }

  // Hide reviews that mention team members no longer on the staff page.
  // Runs every sync so the filter also reacts to team_members changes since last run.
  try {
    console.log('🧹 Applying stale-team-member filter...')
    const filterStats = await applyStaleTeamMemberFilter()
    results.filter.success = true
    results.filter.stats = filterStats
    console.log('✅ Filter complete:', filterStats)
  } catch (error: any) {
    console.error('❌ Filter failed:', error)
    results.filter.error = error.message
  }

  // Auto-promote eligible 5-star reviews to the homepage selection.
  try {
    console.log('⭐ Auto-promoting 5-star reviews to homepage...')
    const promoteStats = await autoPromoteToHomepage()
    results.autoPromote.success = true
    results.autoPromote.stats = promoteStats
    console.log('✅ Auto-promote complete:', promoteStats)
    if (promoteStats.promoted > 0) {
      revalidatePath('/')
    }
  } catch (error: any) {
    console.error('❌ Auto-promote failed:', error)
    results.autoPromote.error = error.message
  }

  const allSucceeded =
    results.vagaro.success &&
    results.brightdata.success &&
    results.filter.success &&
    results.autoPromote.success
  console.log(allSucceeded ? '✅ Daily review sync completed successfully' : '⚠️ Daily review sync completed with errors')

  return NextResponse.json({
    success: allSucceeded,
    timestamp: new Date().toISOString(),
    results
  }, { status: allSucceeded ? 200 : 207 }) // 207 Multi-Status if partial success
}
