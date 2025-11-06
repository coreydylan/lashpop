/**
 * Display the current access token
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

const baseURL = process.env.VAGARO_API_BASE_URL
const region = process.env.VAGARO_REGION || 'us02'
const clientId = process.env.VAGARO_CLIENT_ID
const clientSecret = process.env.VAGARO_CLIENT_SECRET

async function showToken() {
  console.log('🔑 Generating Vagaro Access Token...\n')

  try {
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

    console.log('✅ Authentication Successful!\n')
    console.log('📋 Full Response:')
    console.log(JSON.stringify(authResult, null, 2))
    console.log('\n')
    console.log('🎟️  Access Token:')
    console.log(authResult.data.access_token)
    console.log('\n')
    console.log('⏰ Expires In:', authResult.data.expires_in, 'seconds (1 hour)')
    console.log('\n')
    console.log('💡 Use this token in the "Try It!" section of Vagaro docs:')
    console.log('   1. Go to: https://docs.vagaro.com/public/reference/retrieve-business-locations')
    console.log('   2. Click "Try It!"')
    console.log('   3. Look for "accessToken" field in the Metadata section')
    console.log('   4. Paste the token above')
    console.log('   5. Set region to: us02')
    console.log('   6. Click "Send Request"')

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown')
  }
}

showToken()
