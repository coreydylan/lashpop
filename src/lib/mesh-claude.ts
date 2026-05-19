/**
 * Mesh-claude bridge — HMAC-signed POST to the Mac-side claude-agent-sdk
 * daemon. Server-only (uses BRIDGE_SECRET).
 *
 * Routes via the public `claude-bridge.experialstudio.com` hostname on the
 * cloak-mesh cloudflared tunnel. Same wire format as workers/reviews/src/mesh-claude.ts
 * — keep them in sync if you change one.
 */
import "server-only"
import crypto from "crypto"

function hmacHex(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex")
}

export async function askMeshClaude(
  prompt: string,
  options: { system?: string; model?: string; timeoutMs?: number } = {},
): Promise<string> {
  const host = process.env.BRIDGE_HOST ?? "claude-bridge.experialstudio.com"
  const port = process.env.BRIDGE_PORT ?? "443"
  const secret = process.env.BRIDGE_SECRET
  if (!secret) {
    console.error("[mesh-claude] BRIDGE_SECRET not set")
    return ""
  }

  const payload: Record<string, unknown> = { prompt }
  if (options.system) payload.system = options.system
  if (options.model) payload.model = options.model
  const body = JSON.stringify(payload)
  const sig = hmacHex(secret, body)

  const scheme = host.startsWith("[") ? "http" : "https"
  const portPart = (scheme === "https" && port === "443") || (scheme === "http" && port === "80")
    ? ""
    : `:${port}`
  const url = `${scheme}://${host}${portPart}/v1/messages`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-bridge-signature": sig },
      body,
      signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => "")
      console.error(`[mesh-claude] HTTP ${res.status}: ${errBody.slice(0, 200)}`)
      return ""
    }
    const data = (await res.json()) as { text?: string; error?: string }
    if (data.error) {
      console.error(`[mesh-claude] bridge error: ${data.error}`)
      return ""
    }
    return (data.text ?? "").trim()
  } catch (err) {
    console.error("[mesh-claude] fetch failed:", err)
    return ""
  }
}
