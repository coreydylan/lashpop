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
