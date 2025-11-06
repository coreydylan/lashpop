/**
 * Full Vagaro API test: Get locations → Get businessId → Fetch services
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const baseURL = process.env.VAGARO_API_BASE_URL
const region = process.env.VAGARO_REGION || 'us02'
const clientId = process.env.VAGARO_CLIENT_ID
const clientSecret = process.env.VAGARO_CLIENT_SECRET

async function testFullFlow() {
  console.log('🚀 Starting full Vagaro API test...\n')

  try {
    // Step 1: Authenticate
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
    console.log('   ✅ Authenticated successfully\n')

    // Step 2: Get business locations
    console.log('2️⃣ Fetching business locations...')
    const locationsResponse = await fetch(`${baseURL}/${region}/api/v2/locations?accessToken=${encodeURIComponent(token)}&pageNumber=1&pageSize=100`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!locationsResponse.ok) {
      const errorText = await locationsResponse.text()
      throw new Error(`Locations failed (${locationsResponse.status}): ${errorText}`)
    }

    const locationsResult = await locationsResponse.json()
    console.log('   ✅ Locations retrieved\n')

    if (!locationsResult.data?.locations || locationsResult.data.locations.length === 0) {
      throw new Error('No locations found')
    }

    console.log('📍 Your Business Locations:')
    locationsResult.data.locations.forEach((loc: any, index: number) => {
      console.log(`\n   ${index + 1}. ${loc.businessName}`)
      console.log(`      Business ID: ${loc.businessId}`)
      console.log(`      Address: ${loc.streetAddress}, ${loc.city}, ${loc.regionCode}`)
      console.log(`      Phone: ${loc.businessPhone}`)
      console.log(`      Vagaro URL: ${loc.vagaroListingUrl}`)
    })

    const firstLocation = locationsResult.data.locations[0]
    const businessId = firstLocation.businessId

    console.log(`\n\n💾 Add this to your .env.local:`)
    console.log(`VAGARO_BUSINESS_ID=${businessId}\n`)

    // Step 3: Fetch services using the businessId
    console.log('3️⃣ Fetching services for first location...')
    const servicesResponse = await fetch(`${baseURL}/${region}/api/v2/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: businessId,
        pageNumber: 1,
        pageSize: 100,
      }),
    })

    if (!servicesResponse.ok) {
      const errorText = await servicesResponse.text()
      console.log(`   ❌ Services failed (${servicesResponse.status}):`)
      console.log(errorText)
      return
    }

    const servicesResult = await servicesResponse.json()
    console.log('   ✅ Services retrieved successfully!\n')

    if (servicesResult.data?.services) {
      const services = servicesResult.data.services
      console.log(`\n📊 Found ${services.length} service(s):\n`)

      services.forEach((service: any) => {
        console.log(`   📌 ${service.serviceTitle}`)
        console.log(`      Category: ${service.parentServiceTitle}`)
        console.log(`      Service ID: ${service.serviceId}`)

        if (service.servicePerformedBy && service.servicePerformedBy.length > 0) {
          const firstProvider = service.servicePerformedBy[0]
          console.log(`      Price: $${firstProvider.price} ${firstProvider.currency}`)
          console.log(`      Duration: ${firstProvider.durationMinutes} minutes`)
          console.log(`      Providers: ${service.servicePerformedBy.length}`)
        }
        console.log()
      })

      // Step 4: Fetch employees
      console.log('\n4️⃣ Fetching employees...')
      const employeesResponse = await fetch(`${baseURL}/${region}/api/v2/employees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessId,
          pageNumber: 1,
          pageSize: 100,
        }),
      })

      if (!employeesResponse.ok) {
        const errorText = await employeesResponse.text()
        console.log(`   ⚠️  Employees failed (${employeesResponse.status}):`)
        console.log(errorText)
      } else {
        const employeesResult = await employeesResponse.json()
        console.log('   ✅ Employees retrieved successfully!\n')

        if (employeesResult.data?.employees) {
          const employees = employeesResult.data.employees
          console.log(`\n👥 Found ${employees.length} employee(s):\n`)

          employees.slice(0, 10).forEach((emp: any) => {
            console.log(`   👤 ${emp.firstName} ${emp.lastName}`)
            console.log(`      Employee ID: ${emp.employeeId}`)
            if (emp.email) console.log(`      Email: ${emp.email}`)
            if (emp.phone) console.log(`      Phone: ${emp.phone}`)
            console.log()
          })
        }
      }

      console.log('\n✅ FULL API TEST SUCCESSFUL!')
      console.log('\n🎉 Your Vagaro API is working correctly!')
      console.log('\nNext steps:')
      console.log('1. Add the VAGARO_BUSINESS_ID to your .env.local')
      console.log('2. Update the VagaroClient to use these endpoints')
      console.log('3. Sync your database with live Vagaro data')

    } else {
      console.log('   ⚠️  No services found in response')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : 'Unknown')
  }
}

testFullFlow()
