/**
 * Get Business ID from Vagaro Account
 *
 * This script attempts to fetch business location info to find the businessId
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const baseURL = process.env.VAGARO_API_BASE_URL
const region = process.env.VAGARO_REGION || 'us02'
const clientId = process.env.VAGARO_CLIENT_ID
const clientSecret = process.env.VAGARO_CLIENT_SECRET

async function getBusinessId() {
  console.log('🔍 Attempting to find your Business ID...\n')

  try {
    // Step 1: Authenticate with "read access" scope
    console.log('1️⃣ Authenticating...')
    const authResponse = await fetch(`${baseURL}/${region}/api/v2/merchants/generate-access-token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecretKey: clientSecret,
        scope: 'read access',
      }),
    })

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status}`)
    }

    const authResult = await authResponse.json()
    const token = authResult.data.access_token
    console.log('   ✅ Authentication successful\n')

    // Step 2: Try to get business locations
    console.log('2️⃣ Fetching business locations...')
    const locationsResponse = await fetch(`${baseURL}/${region}/api/v2/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    console.log(`   Response status: ${locationsResponse.status}`)

    if (locationsResponse.ok) {
      const locationsResult = await locationsResponse.json()
      console.log('\n📍 Business Locations Found:')
      console.log(JSON.stringify(locationsResult, null, 2))

      if (locationsResult.data?.locations) {
        const firstLocation = locationsResult.data.locations[0]
        if (firstLocation?.businessId) {
          console.log('\n✅ Found Business ID!')
          console.log(`\nAdd this to your .env.local:\n`)
          console.log(`VAGARO_BUSINESS_ID=${firstLocation.businessId}\n`)
          return firstLocation.businessId
        }
      }
    } else {
      const errorText = await locationsResponse.text()
      console.log(`   ❌ Failed: ${errorText}\n`)
    }

    // Alternative: The businessId might be in your Vagaro URL
    console.log('\n📝 Alternative ways to find your Business ID:\n')
    console.log('1. Log in to https://us02.vagaro.com')
    console.log('2. Go to Settings → Business Information')
    console.log('3. Look for "Business ID" or "Location ID"')
    console.log('4. Or check your booking URL: https://www.vagaro.com/lashpop32')
    console.log('   The business ID might be encoded in the URL\n')

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown')
  }
}

getBusinessId()
