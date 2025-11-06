/**
 * Simple test to check Vagaro API response
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

async function testSimpleRequest() {
  const baseURL = process.env.VAGARO_API_BASE_URL
  const region = process.env.VAGARO_REGION || 'us02'
  const clientId = process.env.VAGARO_CLIENT_ID
  const clientSecret = process.env.VAGARO_CLIENT_SECRET

  console.log('Testing Vagaro API...')
  console.log('Base URL:', baseURL)
  console.log('Region:', region)
  console.log('Client ID:', clientId?.substring(0, 20) + '...')
  console.log('Client Secret:', clientSecret?.substring(0, 20) + '...')
  console.log()

  const authUrl = `${baseURL}/${region}/api/v2/merchants/generate-access-token`
  console.log('Auth URL:', authUrl)
  console.log()

  try {
    console.log('Attempting authentication...')
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecretKey: clientSecret,
        scope: 'merchants.read,services.read,employees.read',
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    const text = await response.text()
    console.log('Response body:', text)

    if (text) {
      try {
        const json = JSON.parse(text)
        console.log('Parsed JSON:', json)
      } catch (e) {
        console.log('Could not parse as JSON')
      }
    }
  } catch (error) {
    console.error('Request failed:', error)
  }
}

testSimpleRequest()
