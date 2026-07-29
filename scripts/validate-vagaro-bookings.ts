import { spawnSync } from 'node:child_process'
import {
  auditActiveServiceBookings,
  type ActiveServiceBookingRecord,
} from '../src/lib/vagaro-booking-validation'

const sql = `
  SELECT
    id,
    name,
    main_category AS mainCategory,
    vagaro_service_id AS vagaroServiceId,
    vagaro_widget_url AS vagaroWidgetUrl
  FROM services
  WHERE is_active = 1
  ORDER BY main_category, name
`

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    '--yes',
    'wrangler',
    'd1',
    'execute',
    'lashpop-production',
    '--remote',
    '--command',
    sql,
    '--json',
  ],
  {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  },
)

if (result.status !== 0) {
  console.error('Unable to read active services from the production D1 database.')
  console.error(result.stderr.trim() || result.stdout.trim())
  process.exit(1)
}

let services: ActiveServiceBookingRecord[]
try {
  const payload = JSON.parse(result.stdout) as Array<{
    success: boolean
    results: ActiveServiceBookingRecord[]
  }>
  services = payload[0]?.results || []
} catch {
  console.error('Wrangler returned an unreadable service-catalog response.')
  console.error(result.stdout.trim())
  process.exit(1)
}

const audit = auditActiveServiceBookings(services)

if (audit.issues.length > 0) {
  console.error(`Vagaro booking audit failed for ${audit.issues.length} reason(s):`)
  for (const issue of audit.issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log(
  `Vagaro booking audit passed: ${audit.total}/${audit.total} active services accounted for ` +
  `(${audit.vagaro} exact Vagaro service IDs, ${audit.external} intentional external route).`,
)
