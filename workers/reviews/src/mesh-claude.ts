/**
 * Mesh-claude bridge — HMAC-signed POST to the Mac-side claude-agent-sdk
 * daemon, which uses Corey's CC subscription (zero direct Anthropic API
 * usage). Same wire format as reeve.
 *
 * Currently routes via the public hostname `claude-bridge.experialstudio.com`
 * (cloak-mesh cloudflared tunnel → 127.0.0.1:8484 on officemac) instead of
 * the cf1:network IPv6 mesh, because warp-routing was disabled and broke
 * the original path. Cloudflare's edge passes traffic transparently; the
 * HMAC signature is what proves the caller is us. If/when warp-routing is
 * re-enabled, switching back is a config change to BRIDGE_HOST/SCHEME and
 * re-enabling the `vpc_networks` block in wrangler.jsonc.
 */
export interface MeshBridgeBindings {
  /** Optional VPC binding — used when present, otherwise plain fetch. */
  MESH?: { fetch: typeof fetch }
  /**
   * Hostname (with optional `[ipv6]` bracket form) of the bridge.
   * Public path: `claude-bridge.experialstudio.com`.
   * VPC path:    `[2606:4700:cf1:1000::a]`.
   */
  BRIDGE_HOST: string
  BRIDGE_PORT: string
  BRIDGE_SECRET: string
  /** `http` or `https`. Defaults to `https` when host is a public hostname, `http` for IPv6 literal. */
  BRIDGE_SCHEME?: string
}

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function askMeshClaude(
  env: MeshBridgeBindings,
  prompt: string,
  options: { system?: string; model?: string; timeoutMs?: number } = {},
): Promise<string> {
  const payload: Record<string, unknown> = { prompt }
  if (options.system) payload.system = options.system
  if (options.model) payload.model = options.model
  const body = JSON.stringify(payload)
  const sig = await hmacHex(env.BRIDGE_SECRET, body)

  const scheme = env.BRIDGE_SCHEME ?? (env.BRIDGE_HOST.includes(':') && env.BRIDGE_HOST.startsWith('[') ? 'http' : 'https')
  // When using a public hostname (cloudflared tunnel) on 443, the port is
  // implicit — omit it. Otherwise include it.
  const portPart = (scheme === 'https' && env.BRIDGE_PORT === '443') || (scheme === 'http' && env.BRIDGE_PORT === '80')
    ? ''
    : `:${env.BRIDGE_PORT}`
  const url = `${scheme}://${env.BRIDGE_HOST}${portPart}/v1/messages`

  const fetcher = env.MESH?.fetch ?? fetch

  let res: Response
  try {
    res = await fetcher(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-bridge-signature': sig },
      body,
      signal: AbortSignal.timeout(options.timeoutMs ?? 90_000),
    })
  } catch (err) {
    console.error('[mesh-claude] fetch failed:', err)
    return ''
  }
  if (!res.ok) {
    console.error(`[mesh-claude] bridge HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
    return ''
  }
  const data = (await res.json()) as { text?: string; error?: string }
  if (data.error) {
    console.error(`[mesh-claude] bridge error: ${data.error}`)
    return ''
  }
  return (data.text ?? '').trim()
}
