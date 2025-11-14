/**
 * Fetch reviews from Bright Data datasets (Yelp, Google, etc.) and sync them into
 * the shared reviews/testimonials tables.
 *
 * Usage:
 *   npx tsx scripts/fetch-brightdata-reviews.ts
 */

import { config } from 'dotenv'

import { NormalizedReview, syncReviews } from '../src/lib/reviews-sync'

config({ path: '.env.local' })

const BRIGHTDATA_API_TOKEN = process.env.BRIGHTDATA_API_TOKEN || process.env.BRIGHTDATA_API_KEY
const YELP_DATASET_ID = process.env.BRIGHTDATA_YELP_DATASET_ID
const GOOGLE_DATASET_ID = process.env.BRIGHTDATA_GOOGLE_DATASET_ID

if (!BRIGHTDATA_API_TOKEN) {
  throw new Error('BRIGHTDATA_API_TOKEN is required to trigger datasets.')
}

type DatasetJob = {
  source: string
  datasetId: string
  requests: Array<Record<string, unknown>>
  defaultUrl: string
}

const jobs: DatasetJob[] = []

if (YELP_DATASET_ID) {
  jobs.push({
    source: 'yelp',
    datasetId: YELP_DATASET_ID,
    defaultUrl: process.env.YELP_BUSINESS_URL || 'https://www.yelp.com/biz/lashpop-studios-oceanside',
    requests: [
      {
        url: process.env.YELP_BUSINESS_URL || 'https://www.yelp.com/biz/lashpop-studios-oceanside',
        unrecommended_reviews: process.env.YELP_INCLUDE_UNRECOMMENDED === 'false' ? false : true,
        sort_by: 'DATE_DESC'
      }
    ]
  })
}

if (GOOGLE_DATASET_ID && process.env.GOOGLE_MAPS_URL) {
  jobs.push({
    source: 'google',
    datasetId: GOOGLE_DATASET_ID,
    defaultUrl: process.env.GOOGLE_MAPS_URL,
    requests: [
      {
        url: process.env.GOOGLE_MAPS_URL
      }
    ]
  })
}

if (!jobs.length) {
  console.log('No Bright Data dataset IDs configured. Set BRIGHTDATA_YELP_DATASET_ID and/or BRIGHTDATA_GOOGLE_DATASET_ID.')
  process.exit(0)
}

const API_BASE = 'https://api.brightdata.com'

async function triggerJob(job: DatasetJob) {
  const url = new URL(`${API_BASE}/datasets/v3/trigger`)
  url.searchParams.set('dataset_id', job.datasetId)
  url.searchParams.set('include_errors', 'true')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BRIGHTDATA_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(job.requests)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to trigger dataset for ${job.source}: ${response.status} ${text}`)
  }

  const triggerRaw = await response.text()
  let payload: any
  try {
    payload = JSON.parse(triggerRaw)
  } catch {
    const lines = triggerRaw.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    for (const line of lines) {
      try {
        payload = JSON.parse(line)
        break
      } catch {
        continue
      }
    }
    if (!payload) {
      throw new Error(`Unable to parse trigger response for ${job.source}: ${triggerRaw}`)
    }
  }
  return {
    job,
    snapshotId: payload.snapshot_id || payload.id || payload.data?.snapshot_id,
    statusUrl: payload.status_url || payload.data?.status_url,
    resultUrl: payload.result_url || payload.location || payload.data?.result_url
  }
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${BRIGHTDATA_API_TOKEN}`
    }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to download snapshot: ${text}`)
  }
  return res.text()
}

function parseRows(text: string) {
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return [parsed]
  } catch {
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => JSON.parse(line))
  }
}

function isSourceUrl(url: string, job: DatasetJob) {
  const lower = url.toLowerCase()
  return lower.includes('yelp.com') || lower.includes('google') || lower.includes(job.defaultUrl.toLowerCase())
}

async function downloadSnapshotData(job: DatasetJob, info: { snapshotId?: string; statusUrl?: string }) {
  const snapshotId = info.snapshotId
  if (!snapshotId) {
    throw new Error(`Snapshot ID missing for ${job.source}`)
  }
  const snapshotUrl = `${API_BASE}/datasets/v3/snapshot/${snapshotId}`
  const downloadUrl = `${API_BASE}/datasets/v3/snapshot/${snapshotId}/download?format=json`

  for (let attempt = 0; attempt < 120; attempt++) {
    const raw = await fetchText(snapshotUrl)
    const trimmed = raw.trim()
    if (!trimmed) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      continue
    }
    try {
      const data = JSON.parse(trimmed)
      if (Array.isArray(data)) {
        return JSON.stringify(data)
      }
      if (data.data && Array.isArray(data.data)) {
        return JSON.stringify(data.data)
      }
      const status = (data.status || data.state || '').toLowerCase()
      const resultUrl = data.result_url || data.location || data.url
      if (status && ['done', 'success', 'completed', 'finished'].includes(status)) {
        if (resultUrl && !isSourceUrl(resultUrl, job)) {
          return await fetchText(resultUrl)
        }
        return await fetchText(downloadUrl)
      }
      if (status && ['error', 'failed'].includes(status)) {
        throw new Error(`Bright Data snapshot failed for ${job.source}: ${JSON.stringify(data)}`)
      }
    } catch {
      return raw
    }
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  throw new Error(`Snapshot polling timed out for ${job.source}`)
}

function normalizeRow(row: any, job: DatasetJob): NormalizedReview | null {
  const reviewerName =
    row.reviewer_name ||
    row.reviewer ||
    row.author_name ||
    row.Review_auther?.Username ||
    row.author?.name ||
    row.user?.name ||
    row.profile?.name ||
    row.name

  const reviewText =
    row.review_text ||
    row.text ||
    row.Content ||
    row.comment ||
    row.review ||
    row.body ||
    row.snippet

  if (!reviewerName || !reviewText) {
    return null
  }

  const dateValue = row.review_date || row.date || row.Date || row.created_at || row.time || row.timestamp || row.date_iso_format
  const parsedDate = dateValue ? new Date(dateValue) : null
  const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null

  const ratingValue = row.rating ?? row.stars ?? row.score ?? row.review_rating ?? row.Rating
  const numericRating = Number(ratingValue)
  const rating = !Number.isNaN(numericRating) && Number.isFinite(numericRating) && numericRating > 0 ? numericRating : 5

  return {
    source: job.source,
    sourceUrl: row.review_url || row.url || row.reviewURL || job.defaultUrl,
    reviewerName: reviewerName.toString().trim(),
    reviewText: reviewText.toString().trim(),
    reviewDate: isValidDate,
    subject: row.provider_name || row.employee_name || row.stylist_name || row.business_name,
    rating
  }
}

async function run() {
  for (const job of jobs) {
    console.log(`Triggering Bright Data dataset for ${job.source} (${job.datasetId})`)
  const triggerInfo = await triggerJob(job)
  let rawData: string
  if (triggerInfo.resultUrl && !isSourceUrl(triggerInfo.resultUrl, job)) {
    console.log(`Downloading snapshot for ${job.source}: ${triggerInfo.resultUrl}`)
    rawData = await fetchText(triggerInfo.resultUrl)
  } else {
    rawData = await downloadSnapshotData(job, triggerInfo)
  }

    const rows = parseRows(rawData)
    const normalized = rows
      .map(row => normalizeRow(row, job))
      .filter((row): row is NormalizedReview => Boolean(row))

    if (!normalized.length) {
      console.log(`No reviews parsed for ${job.source}`)
      continue
    }

    console.log(`Parsed ${normalized.length} ${job.source} reviews.`)
    await syncReviews(normalized)
  }

  console.log('Bright Data review sync complete.')
}

run().catch(error => {
  console.error('Failed to sync Bright Data reviews:', error)
  process.exit(1)
})
