import { getDb } from '../src/db'
import { services } from '../src/db/schema/services'
import { getTeamMembersByServiceId } from '../src/actions/team'
import { isNotNull, isNull } from 'drizzle-orm'

async function testTeamFilter() {
  const db = getDb()

  // Test with a service that HAS vagaroData
  console.log('=== Test 1: Service WITH vagaroData ===')
  const [serviceWithData] = await db
    .select()
    .from(services)
    .where(isNotNull(services.vagaroData))
    .limit(1)

  if (serviceWithData) {
    console.log(`Service: ${serviceWithData.name}`)
    const members = await getTeamMembersByServiceId(serviceWithData.id)
    console.log(`Team members returned: ${members.length}`)
    if (members.length > 0) {
      console.log('First 3 members:')
      members.slice(0, 3).forEach(m => console.log(`  - ${m.name}`))
    }
  }

  // Test with a service that DOESN'T have vagaroData
  console.log('\n=== Test 2: Service WITHOUT vagaroData ===')
  const [serviceWithoutData] = await db
    .select()
    .from(services)
    .where(isNull(services.vagaroData))
    .limit(1)

  if (serviceWithoutData) {
    console.log(`Service: ${serviceWithoutData.name}`)
    try {
      const members = await getTeamMembersByServiceId(serviceWithoutData.id)
      console.log(`Team members returned: ${members.length}`)
      if (members.length > 0) {
        console.log('First 3 members:')
        members.slice(0, 3).forEach(m => console.log(`  - ${m.name}`))
      } else {
        console.log('❌ NO TEAM MEMBERS RETURNED - This is the bug!')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  process.exit(0)
}

testTeamFilter()
