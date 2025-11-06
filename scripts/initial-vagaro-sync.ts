/**
 * Initial Vagaro Sync
 *
 * Run this script to perform the first sync of all services and team members
 * from Vagaro to the local database.
 */

import { config } from 'dotenv'
import { syncAllServices, syncAllTeamMembers } from '../src/lib/vagaro-sync'

config({ path: '.env.local' })

async function initialSync() {
  console.log('🚀 Starting initial Vagaro sync...\n')

  try {
    // Sync all services
    await syncAllServices()
    console.log('')

    // Sync all team members
    await syncAllTeamMembers()
    console.log('')

    console.log('✅ Initial sync completed successfully!')
    console.log('\n📊 Next steps:')
    console.log('  1. Check your database to verify the data')
    console.log('  2. Add local enrichments (images, bios, etc.) via admin interface')
    console.log('  3. Webhook will keep data in sync automatically')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Initial sync failed:', error)
    process.exit(1)
  }
}

initialSync()
