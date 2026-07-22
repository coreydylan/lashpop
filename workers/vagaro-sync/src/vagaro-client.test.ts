import assert from 'node:assert/strict'
import test from 'node:test'
import { VagaroClient, type VagaroEnv } from './vagaro-client'

const env: VagaroEnv = {
  VAGARO_REGION: 'us02',
  VAGARO_CLIENT_ID: 'client',
  VAGARO_CLIENT_SECRET: 'secret',
  VAGARO_API_BASE_URL: 'https://api.example.test',
  VAGARO_BUSINESS_ID: 'business',
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

test('accounts for authentication and API requests by endpoint', async () => {
  const originalFetch = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = async (input) => {
    const url = String(input)
    urls.push(url)
    if (url.endsWith('/generate-access-token')) {
      return jsonResponse({
        status: 200,
        responseCode: 1000,
        data: { access_token: 'token', expires_in: 3600 },
      })
    }
    return jsonResponse({
      status: 200,
      responseCode: 1000,
      data: { services: [{ serviceId: 'service-1' }], nextPage: null },
    })
  }

  try {
    const client = new VagaroClient(env)
    const services = await client.getServices()

    assert.equal(services.length, 1)
    assert.equal(urls.length, 2)
    assert.deepEqual(client.getMeteredUsage(), {
      authCalls: 1,
      apiCalls: 1,
      totalCalls: 2,
      maxCallsPerRun: 5,
      byEndpoint: {
        '/api/v2/merchants/generate-access-token': 1,
        '/api/v2/services': 1,
      },
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('stops before a request would exceed the configured run ceiling', async () => {
  const originalFetch = globalThis.fetch
  let fetches = 0
  globalThis.fetch = async () => {
    fetches++
    return jsonResponse({
      status: 200,
      responseCode: 1000,
      data: { access_token: 'token', expires_in: 3600 },
    })
  }

  try {
    const client = new VagaroClient({ ...env, VAGARO_MAX_METERED_CALLS_PER_RUN: '1' })
    await assert.rejects(
      client.getServices(),
      /metered-call budget exhausted.*\(1\/1 attempted this run\)/,
    )
    assert.equal(fetches, 1)
    assert.deepEqual(client.getMeteredUsage(), {
      authCalls: 1,
      apiCalls: 0,
      totalCalls: 1,
      maxCallsPerRun: 1,
      byEndpoint: { '/api/v2/merchants/generate-access-token': 1 },
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})
