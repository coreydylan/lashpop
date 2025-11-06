/**
 * Test different scope combinations to find what works
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const baseURL = process.env.VAGARO_API_BASE_URL
const region = process.env.VAGARO_REGION || 'us02'
const clientId = process.env.VAGARO_CLIENT_ID
const clientSecret = process.env.VAGARO_CLIENT_SECRET

const scopeCombinations = [
  // Try exact format from docs
  'scope1, scope2, scope3',

  // Try common REST API scopes
  'read',
  'read write',
  'read, write',

  // Try resource-specific scopes
  'services',
  'employees',
  'services employees',
  'services, employees',

  // Try with .read suffix
  'services.read',
  'employees.read',
  'services.read, employees.read',
  'services.read,employees.read',

  // Try with namespace
  'merchant.services.read',
  'merchant.employees.read',

  // Try broader scopes
  'api.read',
  'api',
  'full_access',
  '*',

  // Try empty scope
  '',
]

async function testScope(scope: string) {
  console.log(`\n📝 Testing scope: "${scope}"`)

  try {
    // Test auth
    const authResponse = await fetch(`${baseURL}/${region}/api/v2/merchants/generate-access-token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecretKey: clientSecret,
        scope: scope,
      }),
    })

    if (!authResponse.ok) {
      console.log(`   ❌ Auth failed: ${authResponse.status}`)
      return
    }

    const authResult = await authResponse.json()

    if (authResult.status !== 200 || !authResult.data?.access_token) {
      console.log(`   ❌ Auth response invalid:`, authResult.message)
      return
    }

    const token = authResult.data.access_token
    console.log(`   ✅ Auth successful, got token`)

    // Now test services endpoint
    const servicesResponse = await fetch(`${baseURL}/${region}/api/v2/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    console.log(`   Services endpoint: ${servicesResponse.status}`)

    if (servicesResponse.ok) {
      const servicesResult = await servicesResponse.json()
      console.log(`   🎉 SUCCESS! Services returned:`, servicesResult.data?.length || 0, 'items')
      console.log(`   ✨ WORKING SCOPE: "${scope}"`)
      return true
    } else {
      const errorText = await servicesResponse.text()
      if (servicesResponse.status === 401) {
        console.log(`   ⚠️  Still unauthorized`)
      } else {
        console.log(`   ⚠️  Error ${servicesResponse.status}:`, errorText.substring(0, 100))
      }
    }

  } catch (error) {
    console.log(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown')
  }

  return false
}

async function findWorkingScope() {
  console.log('🔍 Testing different scope combinations...\n')
  console.log('This may take a few minutes...\n')

  for (const scope of scopeCombinations) {
    const worked = await testScope(scope)
    if (worked) {
      console.log('\n🎊 FOUND WORKING SCOPE!')
      console.log(`\nAdd this to your authentication:\nscope: "${scope}"`)
      break
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n✅ Scope testing complete')
}

findWorkingScope()
