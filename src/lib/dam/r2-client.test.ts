import assert from "node:assert/strict"
import test from "node:test"

const REQUIRED_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
] as const

test("R2 module can load during a build without runtime credentials", async () => {
  const previousValues = REQUIRED_KEYS.map((key) => [key, process.env[key]] as const)

  try {
    for (const key of REQUIRED_KEYS) delete process.env[key]

    const client = await import("./r2-client")

    assert.equal(typeof client.uploadBuffer, "function")
    await assert.rejects(
      client.downloadBuffer("test-object"),
      /Missing required environment variable: R2_ACCOUNT_ID/,
    )
  } finally {
    previousValues.forEach(([key, value]) => {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    })
  }
})

test("a Cloudflare Images deletion failure preserves the R2 source for retry", async () => {
  const keys = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "NEXT_PUBLIC_R2_BUCKET_URL",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_API_TOKEN",
  ] as const
  const previousValues = keys.map((key) => [key, process.env[key]] as const)
  const previousFetch = globalThis.fetch
  const requests: string[] = []

  Object.assign(process.env, {
    R2_ACCOUNT_ID: "account",
    R2_ACCESS_KEY_ID: "access",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET_NAME: "bucket",
    NEXT_PUBLIC_R2_BUCKET_URL: "https://pub-example.r2.dev",
    CLOUDFLARE_ACCOUNT_ID: "account",
    CLOUDFLARE_API_TOKEN: "token",
  })
  globalThis.fetch = async (input) => {
    requests.push(String(input))
    return new Response("failed", { status: 500 })
  }

  try {
    const client = await import("./r2-client")
    await assert.rejects(client.deleteObject("uploads/private.jpg"), /Cloudflare Images delete failed/)
    assert.equal(requests.length, 1)
    assert.match(requests[0], /api\.cloudflare\.com/)
    assert.equal(requests.some((url) => url.includes("r2.cloudflarestorage.com")), false)
  } finally {
    globalThis.fetch = previousFetch
    previousValues.forEach(([key, value]) => {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    })
  }
})
