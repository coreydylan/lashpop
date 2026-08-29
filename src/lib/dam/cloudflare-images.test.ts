import assert from "node:assert/strict"
import test from "node:test"

import {
  cloudflareImagesInternals,
  deleteMirroredR2Image,
  mirrorR2Image,
  mirrorR2ImageFromUrl,
} from "./cloudflare-images"

test("uses the same deterministic ID contract as the edge router", () => {
  assert.equal(
    cloudflareImagesInternals.hostedImageIdForR2Key("uploads/team.jpg"),
    "lp/d82c3217b6306d552c9fbae6fdaf4169c3fbb1c3a8b19213440cbcc71d89bf0d",
  )
})

test("builds an idempotent hosted image upload without exposing the token", async () => {
  const previousAccount = process.env.CLOUDFLARE_ACCOUNT_ID
  const previousToken = process.env.CLOUDFLARE_API_TOKEN
  const previousFetch = globalThis.fetch
  const requests: Array<{ url: string; init?: RequestInit }> = []
  process.env.CLOUDFLARE_ACCOUNT_ID = "account"
  process.env.CLOUDFLARE_API_TOKEN = "secret-token"

  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init })
    if (!init?.method) return new Response("not found", { status: 404 })
    return Response.json({ success: true, result: { id: "image" } })
  }

  try {
    const result = await mirrorR2Image({
      body: Uint8Array.from([1, 2, 3]),
      key: "uploads/team.jpg",
      contentType: "image/jpeg",
      fileName: "team.jpg",
    })

    assert.equal(result.status, "uploaded")
    assert.equal(
      result.deliveryUrl,
      `https://imagedelivery.net/zXebLwufc8AGAQU5E9oXHw/${cloudflareImagesInternals.hostedImageIdForR2Key("uploads/team.jpg")}/public`,
    )
    assert.equal(requests.length, 2)
    assert.match(requests[0].url, /lp%2F/)
    assert.equal(requests[1].init?.method, "POST")
    assert.ok(requests[1].init?.body instanceof FormData)
    assert.equal(requests.some((request) => request.url.includes("secret-token")), false)
  } finally {
    globalThis.fetch = previousFetch
    if (previousAccount === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID
    else process.env.CLOUDFLARE_ACCOUNT_ID = previousAccount
    if (previousToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN
    else process.env.CLOUDFLARE_API_TOKEN = previousToken
  }
})

test("reports oversized images so the storage transaction can fail closed", async () => {
  const previousAccount = process.env.CLOUDFLARE_ACCOUNT_ID
  const previousToken = process.env.CLOUDFLARE_API_TOKEN
  process.env.CLOUDFLARE_ACCOUNT_ID = "account"
  process.env.CLOUDFLARE_API_TOKEN = "token"

  try {
    const result = await mirrorR2Image({
      body: new Uint8Array(cloudflareImagesInternals.HOSTED_UPLOAD_LIMIT + 1),
      key: "uploads/large.jpg",
      contentType: "image/jpeg",
      fileName: "large.jpg",
    })
    assert.equal(result.status, "oversized")
  } finally {
    if (previousAccount === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID
    else process.env.CLOUDFLARE_ACCOUNT_ID = previousAccount
    if (previousToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN
    else process.env.CLOUDFLARE_API_TOKEN = previousToken
  }
})

test("deletes the matching Cloudflare Images object with the R2 source", async () => {
  const previousAccount = process.env.CLOUDFLARE_ACCOUNT_ID
  const previousToken = process.env.CLOUDFLARE_API_TOKEN
  const previousFetch = globalThis.fetch
  process.env.CLOUDFLARE_ACCOUNT_ID = "account"
  process.env.CLOUDFLARE_API_TOKEN = "token"
  const requests: Array<{ url: string; init?: RequestInit }> = []
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init })
    return new Response(null, { status: 200 })
  }

  try {
    const result = await deleteMirroredR2Image("uploads/team.jpg")
    assert.equal(result.status, "deleted")
    assert.equal(requests[0]?.init?.method, "DELETE")
    assert.match(requests[0]?.url ?? "", /lp%2F/)
  } finally {
    globalThis.fetch = previousFetch
    if (previousAccount === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID
    else process.env.CLOUDFLARE_ACCOUNT_ID = previousAccount
    if (previousToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN
    else process.env.CLOUDFLARE_API_TOKEN = previousToken
  }
})

test("mirrors a completed presigned R2 upload from its server-derived public URL", async () => {
  const previousAccount = process.env.CLOUDFLARE_ACCOUNT_ID
  const previousToken = process.env.CLOUDFLARE_API_TOKEN
  const previousFetch = globalThis.fetch
  const requests: Array<{ url: string; init?: RequestInit }> = []
  process.env.CLOUDFLARE_ACCOUNT_ID = "account"
  process.env.CLOUDFLARE_API_TOKEN = "token"

  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init })
    if (!init?.method) return new Response("not found", { status: 404 })
    return Response.json({ success: true, result: { id: "image" } })
  }

  try {
    const result = await mirrorR2ImageFromUrl({
      key: "team/member/photo.jpg",
      sourceUrl: "https://pub-example.r2.dev/team/member/photo.jpg",
    })

    assert.equal(result.status, "uploaded")
    const form = requests[1].init?.body
    assert.ok(form instanceof FormData)
    assert.equal(form.get("url"), "https://pub-example.r2.dev/team/member/photo.jpg")
    assert.equal(form.get("id"), cloudflareImagesInternals.hostedImageIdForR2Key("team/member/photo.jpg"))
  } finally {
    globalThis.fetch = previousFetch
    if (previousAccount === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID
    else process.env.CLOUDFLARE_ACCOUNT_ID = previousAccount
    if (previousToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN
    else process.env.CLOUDFLARE_API_TOKEN = previousToken
  }
})
