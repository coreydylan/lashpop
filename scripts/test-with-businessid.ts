/**
 * Test Vagaro API with businessId
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const baseURL = process.env.VAGARO_API_BASE_URL
const region = process.env.VAGARO_REGION || 'us02'
const clientId = process.env.VAGARO_CLIENT_ID
const clientSecret = process.env.VAGARO_CLIENT_SECRET
const businessId = process.env.VAGARO_BUSINESS_ID

async function testWithBusinessId() {
  console.log('🧪 Testing Vagaro API with businessId...\n')
  console.log('Business ID:', businessId, '\n')

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
    const accessToken = authResult.data.access_token
    console.log('   ✅ Authenticated\n')

    // Step 2: Test Services endpoint
    console.log('2️⃣ Fetching services...')
    const servicesUrl = `${baseURL}/${region}/api/v2/services?pageNumber=1&pageSize=100`
    const servicesResponse = await fetch(servicesUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'accessToken': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: businessId
      }),
    })

    console.log('   Response status:', servicesResponse.status)

    if (!servicesResponse.ok) {
      const errorText = await servicesResponse.text()
      console.log('   ❌ Failed:', errorText)
    } else {
      const servicesResult = await servicesResponse.json()
      console.log('   ✅ Success!\n')

      if (servicesResult.data?.services) {
        const services = servicesResult.data.services
        console.log(`📊 Found ${services.length} service(s):\n`)

        services.slice(0, 10).forEach((service: any) => {
          console.log(`   📌 ${service.serviceTitle}`)
          console.log(`      Category: ${service.parentServiceTitle}`)
          console.log(`      Service ID: ${service.serviceId}`)

          if (service.servicePerformedBy && service.servicePerformedBy.length > 0) {
            const provider = service.servicePerformedBy[0]
            console.log(`      Price: $${provider.price} ${provider.currency}`)
            console.log(`      Duration: ${provider.durationMinutes} minutes`)
          }
          console.log()
        })

        if (services.length > 10) {
          console.log(`   ... and ${services.length - 10} more services\n`)
        }
      }
    }

    // Step 3: Test Employees endpoint
    console.log('\n3️⃣ Fetching employees...')
    const employeesUrl = `${baseURL}/${region}/api/v2/employees?pageNumber=1&pageSize=100`
    const employeesResponse = await fetch(employeesUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'accessToken': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: businessId
      }),
    })

    console.log('   Response status:', employeesResponse.status)

    if (!employeesResponse.ok) {
      const errorText = await employeesResponse.text()
      console.log('   ❌ Failed:', errorText)
    } else {
      const employeesResult = await employeesResponse.json()
      console.log('   ✅ Success!\n')

      if (employeesResult.data?.employees) {
        const employees = employeesResult.data.employees
        console.log(`👥 Found ${employees.length} employee(s):\n`)

        employees.slice(0, 10).forEach((emp: any) => {
          console.log(`   👤 ${emp.firstName} ${emp.lastName}`)
          console.log(`      Employee ID: ${emp.employeeId}`)
          if (emp.email) console.log(`      Email: ${emp.email}`)
          if (emp.phone) console.log(`      Phone: ${emp.phone}`)
          console.log()
        })

        if (employees.length > 10) {
          console.log(`   ... and ${employees.length - 10} more employees\n`)
        }
      }
    }

    console.log('\n✅ Test complete!')

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown')
  }
}

testWithBusinessId()
