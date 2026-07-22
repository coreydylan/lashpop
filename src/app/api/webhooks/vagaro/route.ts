import { NextRequest, NextResponse } from 'next/server'
import { syncTeamMember } from '@/lib/vagaro-sync'
import { syncBusinessLocation } from '@/lib/vagaro-sync-all'
import { timingSafeEqual } from 'crypto'

// Published by Vagaro for webhook delivery. Vercel overwrites forwarded IP
// headers, so callers cannot spoof these values at the public function edge.
const VAGARO_WEBHOOK_IPS = new Set([
  '20.220.12.83',
  '13.67.143.68',
  '13.70.105.4',
  '20.62.123.184',
  '51.140.65.108',
  '51.143.95.2',
])

function constantTimeMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual)
  const expectedBytes = Buffer.from(expected)
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes)
}

function isAuthorizedWebhook(request: NextRequest): boolean {
  const verificationToken = process.env.VAGARO_WEBHOOK_SECRET?.trim()
  const signature = request.headers.get('x-vagaro-signature')?.trim()

  if (verificationToken) {
    return Boolean(signature && constantTimeMatch(signature, verificationToken))
  }

  const forwardedFor = request.headers.get('x-vercel-forwarded-for')
    || request.headers.get('x-forwarded-for')
    || request.headers.get('x-real-ip')
    || ''
  const sourceIp = forwardedFor.split(',')[0]?.trim()
  return VAGARO_WEBHOOK_IPS.has(sourceIp)
}

/**
 * Trigger a full service + team_members sync via the canonical CF Worker
 * (`workers/vagaro-sync`). There is intentionally no in-process fallback:
 * that old path authenticated separately and fetched every employee one by
 * one, bypassing the Worker's metered-call ceiling.
 *
 * Set in Vercel env:
 *   VAGARO_SYNC_URL    e.g. https://lashpop-vagaro-sync.<acct>.workers.dev/sync
 *   VAGARO_SYNC_TOKEN  matches the worker's SYNC_TRIGGER_TOKEN secret
 */
async function triggerFullSync(reason: string): Promise<void> {
  const workerUrl = process.env.VAGARO_SYNC_URL
  if (!workerUrl) {
    console.warn(`  (no VAGARO_SYNC_URL set — skipping full sync for ${reason})`)
    return
  }
  const url = new URL(workerUrl)
  if (!url.pathname.endsWith('/sync')) {
    url.pathname = url.pathname.replace(/\/$/, '') + '/sync'
  }
  console.log(`  → calling canonical Vagaro sync Worker (reason: ${reason})`)
  const token = process.env.VAGARO_SYNC_TOKEN
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(url, { method: 'GET', headers })
  if (!res.ok) {
    throw new Error(`worker sync ${res.status}: ${await res.text()}`)
  }
}

/**
 * Vagaro Webhook Endpoint
 *
 * Receives Vagaro webhook events and syncs only the minimum fields used by the
 * website. Intake-form answers and payment transactions remain in Vagaro.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorizedWebhook(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    const event = body as Record<string, unknown>
    const eventType = String(event.type || event.eventType || '').toLowerCase()
    const action = String(event.action || '').toLowerCase()
    const payload: Record<string, unknown> = event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
      ? event.payload as Record<string, unknown>
      : event

    console.log(`🎣 Vagaro Webhook: ${eventType} - ${action}`)

    // Route to appropriate sync function based on event type
    switch (eventType) {
      case 'appointment':
        console.log('ℹ️ Appointment retained in Vagaro only')
        break

      case 'customer':
        console.log('ℹ️ Customer retained in Vagaro only')
        break

      case 'employee':
        console.log('👨‍💼 Syncing employee...')
        await syncTeamMember(payload)
        break

      case 'business_location':
      case 'location':
        console.log('🏢 Syncing business location...')
        await syncBusinessLocation(payload)
        // Location changes might affect services/employees
        if (action === 'updated' || action === 'created') {
          console.log('  Triggering full service/employee sync...')
          await triggerFullSync(`business_location:${action}`)
        }
        break

      case 'formresponse':
      case 'form_response':
        console.log('ℹ️ Form response retained in Vagaro only')
        break

      case 'transaction':
        console.log('ℹ️ Transaction retained in Vagaro only')
        break

      default:
        // Keep unknown event logs metadata-only; payloads can contain client PII.
        console.log(`ℹ️ Unknown event type: ${eventType}`)
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      eventType,
      action,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    // Vagaro retries non-2xx responses with exponential backoff. Sync handlers
    // are idempotent, so transient failures should be retried instead of lost.
    return NextResponse.json(
      {
        received: false,
        error: 'Webhook processing failed'
      },
      { status: 500 }
    )
  }
}

// Also handle GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Vagaro webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
