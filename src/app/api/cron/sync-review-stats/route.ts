import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { reviewStats } from '@/db/schema/review_stats'

export const runtime = 'nodejs'
export const maxDuration = 120 // 2 minutes

const JINA_PREFIX = 'https://r.jina.ai/'
const BRIGHTDATA_API_BASE = 'https://api.brightdata.com'

// Vagaro can be scraped via Jina
async function fetchVagaroStats(): Promise<{ rating: number; reviewCount: number }> {
  const url = 'https://www.vagaro.com/lashpop32'
  const response = await fetch(`${JINA_PREFIX}${url}`, {
    headers: { 'User-Agent': 'lashpop-stats-scraper/1.0' }
  })

  if (!response.ok) {
    throw new Error(`Jina fetch failed for Vagaro: ${response.status}`)
  }

  const markdown = await response.text()

  // Vagaro format: "5.0 324 Reviews"
  const combinedMatch = markdown.match(/(\d\.?\d?)\s+(\d+)\s+Reviews/i)
  if (combinedMatch) {
    return {
      rating: parseFloat(combinedMatch[1]),
      reviewCount: parseInt(combinedMatch[2], 10)
    }
  }

  // Fallback
  const countMatch = markdown.match(/(\d+)\s*Reviews/i)
  if (countMatch) {
    return {
      rating: 5.0,
      reviewCount: parseInt(countMatch[1], 10)
    }
  }

  throw new Error('Could not parse Vagaro review stats')
}

// Yelp and Google need BrightData - trigger a quick snapshot just for business info
async function fetchBrightDataStats(
  source: 'yelp' | 'google'
): Promise<{ rating: number; reviewCount: number } | null> {
  const apiToken = process.env.BRIGHTDATA_API_TOKEN
  if (!apiToken) {
    console.log(`No BRIGHTDATA_API_TOKEN configured, skipping ${source}`)
    return null
  }

  const datasetId = source === 'yelp'
    ? process.env.BRIGHTDATA_YELP_DATASET_ID
    : process.env.BRIGHTDATA_GOOGLE_DATASET_ID

  const businessUrl = source === 'yelp'
    ? process.env.YELP_BUSINESS_URL || 'https://www.yelp.com/biz/lashpop-studios-oceanside'
    : process.env.GOOGLE_MAPS_URL

  if (!datasetId || !businessUrl) {
    console.log(`Missing dataset ID or URL for ${source}, skipping`)
    return null
  }

  // Trigger the dataset
  const triggerUrl = new URL(`${BRIGHTDATA_API_BASE}/datasets/v3/trigger`)
  triggerUrl.searchParams.set('dataset_id', datasetId)
  triggerUrl.searchParams.set('include_errors', 'true')

  const triggerResponse = await fetch(triggerUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{ url: businessUrl }])
  })

  if (!triggerResponse.ok) {
    const text = await triggerResponse.text()
    throw new Error(`BrightData trigger failed for ${source}: ${triggerResponse.status} ${text}`)
  }

  const triggerData = await triggerResponse.json()
  const snapshotId = triggerData.snapshot_id || triggerData.id

  if (!snapshotId) {
    throw new Error(`No snapshot ID returned for ${source}`)
  }

  // Poll for completion (max 90 seconds)
  const snapshotUrl = `${BRIGHTDATA_API_BASE}/datasets/v3/snapshot/${snapshotId}`
  for (let attempt = 0; attempt < 18; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000))

    const statusResponse = await fetch(snapshotUrl, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    })

    if (!statusResponse.ok) continue

    const statusText = await statusResponse.text()
    if (!statusText.trim()) continue

    try {
      const data = JSON.parse(statusText)

      // Check if it's the actual data array
      if (Array.isArray(data) && data.length > 0) {
        const business = data[0]
        const rating = parseFloat(business.rating || business.stars || business.overall_rating || '5')
        const reviewCount = parseInt(business.review_count || business.reviews_count || business.num_reviews || '0', 10)

        if (reviewCount > 0) {
          return { rating: isNaN(rating) ? 5.0 : rating, reviewCount }
        }
      }

      // Check status
      const status = (data.status || data.state || '').toLowerCase()
      if (['done', 'success', 'completed', 'finished'].includes(status)) {
        // Try to download the data
        const downloadUrl = `${BRIGHTDATA_API_BASE}/datasets/v3/snapshot/${snapshotId}/download?format=json`
        const downloadResponse = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        })

        if (downloadResponse.ok) {
          const downloadText = await downloadResponse.text()
          const downloadData = JSON.parse(downloadText)
          const items = Array.isArray(downloadData) ? downloadData : [downloadData]

          if (items.length > 0) {
            const business = items[0]
            const rating = parseFloat(business.rating || business.stars || business.overall_rating || '5')
            const reviewCount = parseInt(business.review_count || business.reviews_count || business.num_reviews || '0', 10)

            if (reviewCount > 0) {
              return { rating: isNaN(rating) ? 5.0 : rating, reviewCount }
            }
          }
        }
      }

      if (['error', 'failed'].includes(status)) {
        throw new Error(`BrightData snapshot failed for ${source}`)
      }
    } catch (e) {
      // JSON parse error, keep polling
    }
  }

  throw new Error(`BrightData polling timed out for ${source}`)
}

async function updateStats(source: string, rating: number, reviewCount: number) {
  const db = getDb()
  await db
    .insert(reviewStats)
    .values({
      source,
      rating: rating.toString(),
      reviewCount
    })
    .onConflictDoUpdate({
      target: reviewStats.source,
      set: {
        rating: rating.toString(),
        reviewCount,
        updatedAt: new Date()
      }
    })
}

/**
 * Vercel Cron Job endpoint - runs daily to sync review stats (counts) from all platforms
 * Triggered by Vercel Cron: 0 6 * * * (daily at 6am UTC / 10pm PST)
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('Starting daily review stats sync...')
  const results: Record<string, { success: boolean; rating?: number; count?: number; error?: string }> = {}

  // Sync Vagaro (via Jina)
  try {
    console.log('Fetching Vagaro stats via Jina...')
    const vagaroStats = await fetchVagaroStats()
    await updateStats('vagaro', vagaroStats.rating, vagaroStats.reviewCount)
    console.log(`Updated vagaro: rating=${vagaroStats.rating}, count=${vagaroStats.reviewCount}`)
    results.vagaro = { success: true, rating: vagaroStats.rating, count: vagaroStats.reviewCount }
  } catch (error: any) {
    console.error('Failed to sync Vagaro stats:', error)
    results.vagaro = { success: false, error: error.message }
  }

  // Sync Yelp (via BrightData)
  try {
    console.log('Fetching Yelp stats via BrightData...')
    const yelpStats = await fetchBrightDataStats('yelp')
    if (yelpStats) {
      await updateStats('yelp', yelpStats.rating, yelpStats.reviewCount)
      console.log(`Updated yelp: rating=${yelpStats.rating}, count=${yelpStats.reviewCount}`)
      results.yelp = { success: true, rating: yelpStats.rating, count: yelpStats.reviewCount }
    } else {
      results.yelp = { success: false, error: 'BrightData not configured for Yelp' }
    }
  } catch (error: any) {
    console.error('Failed to sync Yelp stats:', error)
    results.yelp = { success: false, error: error.message }
  }

  // Sync Google (via BrightData)
  try {
    console.log('Fetching Google stats via BrightData...')
    const googleStats = await fetchBrightDataStats('google')
    if (googleStats) {
      await updateStats('google', googleStats.rating, googleStats.reviewCount)
      console.log(`Updated google: rating=${googleStats.rating}, count=${googleStats.reviewCount}`)
      results.google = { success: true, rating: googleStats.rating, count: googleStats.reviewCount }
    } else {
      results.google = { success: false, error: 'BrightData not configured for Google' }
    }
  } catch (error: any) {
    console.error('Failed to sync Google stats:', error)
    results.google = { success: false, error: error.message }
  }

  const allSucceeded = Object.values(results).every(r => r.success)
  console.log(allSucceeded ? 'Review stats sync completed successfully' : 'Review stats sync completed with errors')

  return NextResponse.json({
    success: allSucceeded,
    timestamp: new Date().toISOString(),
    results
  }, { status: allSucceeded ? 200 : 207 })
}
