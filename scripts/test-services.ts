/**
 * Test fetching services with businessId
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const baseURL = process.env.VAGARO_API_BASE_URL
const region = process.env.VAGARO_REGION || 'us02'
const clientId = process.env.VAGARO_CLIENT_ID
const clientSecret = process.env.VAGARO_CLIENT_SECRET
const businessId = process.env.VAGARO_BUSINESS_ID

async function testServices() {
  console.log('🧪 Testing Vagaro Services API...\n')
  console.log('Business ID:', businessId?.substring(0, 20) + '...\n')

  try {
    // Step 1: Authenticate with "read access" scope
    console.log('1️⃣ Authenticating with "read access" scope...')
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
      const errorText = await authResponse.text()
      throw new Error(`Auth failed (${authResponse.status}): ${errorText}`)
    }

    const authResult = await authResponse.json()

    if (authResult.status !== 200 || !authResult.data?.access_token) {
      throw new Error(`Auth response invalid: ${authResult.message}`)
    }

    const token = authResult.data.access_token
    console.log('   ✅ Authentication successful')
    console.log(`   Token: ${token.substring(0, 30)}...\n`)

    // Step 2: Fetch services
    console.log('2️⃣ Fetching services...')
    const servicesResponse = await fetch(`${baseURL}/${region}/api/v2/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: businessId,
        pageNumber: '1',
        pageSize: '100',
      }),
    })

    console.log(`   Response status: ${servicesResponse.status}`)

    if (!servicesResponse.ok) {
      const errorText = await servicesResponse.text()
      console.log('\n❌ Services request failed:')
      console.log(errorText)

      if (servicesResponse.status === 401) {
        console.log('\n💡 This might mean:')
        console.log('   - API access is not enabled in your Vagaro account')
        console.log('   - Your account plan does not include API access')
        console.log('   - The businessId is incorrect')
        console.log('\n📝 Please check:')
        console.log('   1. Go to: https://us02.vagaro.com/merchants/settings/developers')
        console.log('   2. Look for "Enable API Access" or similar setting')
        console.log('   3. Verify your Business ID in Settings → Business Information')
      } else if (servicesResponse.status === 400) {
        console.log('\n💡 400 Error might mean:')
        console.log('   - The businessId format is incorrect')
        console.log('   - Required parameter is missing or invalid')
      }
      return
    }

    const servicesResult = await servicesResponse.json()
    console.log('\n✅ Success! Services retrieved:')
    console.log(JSON.stringify(servicesResult, null, 2))

    if (servicesResult.data?.services) {
      const services = servicesResult.data.services
      console.log(`\n📊 Found ${services.length} service(s):`)
      services.slice(0, 5).forEach((service: any) => {
        console.log(`\n   📌 ${service.serviceTitle}`)
        console.log(`      ID: ${service.serviceId}`)
        console.log(`      Category: ${service.parentServiceTitle}`)
        if (service.servicePerformedBy?.[0]) {
          const provider = service.servicePerformedBy[0]
          console.log(`      Price: $${provider.price} ${provider.currency}`)
          console.log(`      Duration: ${provider.durationMinutes} minutes`)
        }
      })
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown')
  }
}

testServices()
