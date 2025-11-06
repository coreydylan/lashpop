/**
 * Test retrieving business locations with accessToken as query param
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const baseURL = process.env.VAGARO_API_BASE_URL
const region = process.env.VAGARO_REGION || 'us02'
const clientId = process.env.VAGARO_CLIENT_ID
const clientSecret = process.env.VAGARO_CLIENT_SECRET

async function testLocations() {
  console.log('🔍 Testing Vagaro Business Locations API...\n')

  try {
    // Step 1: Authenticate
    console.log('1️⃣ Getting access token...')
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
    const accessToken = authResult.data.access_token
    console.log('   ✅ Got access token\n')

    // Step 2: Retrieve locations with accessToken in HEADER
    console.log('2️⃣ Retrieving business locations...')

    const url = `${baseURL}/${region}/api/v2/locations?pageNumber=1&pageSize=100`

    console.log('   Request URL:', url)

    const locationsResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'accessToken': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })

    console.log('   Response status:', locationsResponse.status)

    if (locationsResponse.status === 204) {
      console.log('   ✅ Request successful but no content returned (204)')
      console.log('\n💡 This might mean:')
      console.log('   - No business locations found')
      console.log('   - Try without pagination parameters')

      // Try again without pagination
      console.log('\n3️⃣ Retrying without pagination params...')
      const url2 = `${baseURL}/${region}/api/v2/locations`
      const retryResponse = await fetch(url2, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'accessToken': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      console.log('   Response status:', retryResponse.status)
      const retryText = await retryResponse.text()
      console.log('   Response:', retryText || '(empty)')
      return
    }

    if (!locationsResponse.ok) {
      const errorText = await locationsResponse.text()
      console.log('\n❌ Request failed:')
      console.log(errorText)
      return
    }

    const locationsResult = await locationsResponse.json()
    console.log('   ✅ Success!\n')

    console.log('📍 Your Business Locations:\n')
    console.log(JSON.stringify(locationsResult, null, 2))

    if (locationsResult.data?.locations) {
      console.log('\n\n📊 Summary:')
      locationsResult.data.locations.forEach((loc: any, i: number) => {
        console.log(`\n   ${i + 1}. ${loc.businessName}`)
        console.log(`      Business ID: ${loc.businessId}`)
        console.log(`      Address: ${loc.city}, ${loc.regionName}`)
        console.log(`      Phone: ${loc.businessPhone}`)
        console.log(`      Vagaro URL: ${loc.vagaroListingUrl}`)
      })

      const firstLocation = locationsResult.data.locations[0]
      console.log(`\n\n💾 Add this to your .env.local:`)
      console.log(`VAGARO_BUSINESS_ID=${firstLocation.businessId}`)
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown')
  }
}

testLocations()
