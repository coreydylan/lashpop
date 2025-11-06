/**
 * Test script for Vagaro API integration
 *
 * This script tests the Vagaro API connection and fetches sample data
 * to verify the integration is working correctly.
 */

import { config } from 'dotenv'
import { getVagaroClient } from '../src/lib/vagaro-client'

config({ path: '.env.local' })

async function testVagaroAPI() {
  console.log('🧪 Testing Vagaro API Connection...\n')

  try {
    const client = getVagaroClient()

    // Test 1: Fetch Services (most important)
    console.log('1️⃣ Fetching services...')
    const services = await client.getServices({ status: 'active' })
    console.log(`   ✓ Found ${services.length} active service(s)`)

    // Group by category
    const byCategory = services.reduce((acc, service) => {
      const cat = service.category
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('   Services by category:')
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`     - ${category}: ${count} service(s)`)
    })
    console.log()

    // Show first 5 services
    console.log('   Sample services:')
    services.slice(0, 5).forEach(service => {
      const price = service.price_range
        ? `$${service.price_range.min} - $${service.price_range.max}`
        : `$${service.price}`
      console.log(`     - ${service.name} (${service.category}) - ${price}`)
    })
    console.log()

    // Test 2: Fetch Employees
    console.log('\n2️⃣ Fetching employees...')
    try {
      const employees = await client.getEmployees({ status: 'active' })
      console.log(`   ✓ Found ${employees.length} active employee(s)`)

      employees.slice(0, 5).forEach(emp => {
        console.log(`     - ${emp.first_name} ${emp.last_name} (${emp.employee_id})`)
        if (emp.services) console.log(`       Services: ${emp.services.length}`)
      })
    } catch (error) {
      console.log('   ⚠️ Employee fetching might need adjustment based on API structure')
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    console.log()

    // Summary
    console.log('\n✅ Vagaro API connection test completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Services: ${services.length}`)
    console.log(`   - Categories: ${Object.keys(byCategory).length}`)

  } catch (error) {
    console.error('\n❌ Vagaro API test failed:')
    if (error instanceof Error) {
      console.error(`   ${error.message}`)
      if (error.stack) {
        console.error('\nStack trace:')
        console.error(error.stack)
      }
    } else {
      console.error('   Unknown error:', error)
    }
    process.exit(1)
  }
}

// Run the test
testVagaroAPI()
