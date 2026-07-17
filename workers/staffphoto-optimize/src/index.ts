// Vagaro photo optimizer — Cloudflare Worker
// Accepts arbitrarily large uploads (bypasses Vercel's body cap and the
// 128 MB Worker memory limit) by delegating decode/resize/encode to
// Cloudflare's Images binding. Iteratively re-transforms with lower JPEG
// quality if the first output exceeds the Vagaro file-size cap.

type PresetId = 'staff' | 'logo' | 'service' | 'portfolio'

interface Preset {
  id: PresetId
  label: string
  maxBytes: number
  maxLongEdge: number
  minWidth?: number
  minHeight?: number
  targetWidth?: number
  targetHeight?: number
  // 'scale-down' = preserve aspect, never enlarge.
  // 'cover'      = smart-crop to exact target dimensions.
  fit: 'scale-down' | 'cover'
}

const PRESETS: Record<PresetId, Preset> = {
  staff: {
    id: 'staff',
    label: 'Staff / Profile Photo',
    maxBytes: 4 * 1024 * 1024,
    maxLongEdge: 2000,
    fit: 'scale-down',
  },
  logo: {
    id: 'logo',
    label: 'Business Logo / Gallery',
    maxBytes: 5 * 1024 * 1024,
    maxLongEdge: 3000,
    minWidth: 1000,
    minHeight: 667,
    fit: 'scale-down',
  },
  service: {
    id: 'service',
    label: 'Service Image',
    maxBytes: 4 * 1024 * 1024,
    maxLongEdge: 1788,
    targetWidth: 798 * 2,
    targetHeight: 894 * 2,
    fit: 'cover',
  },
  portfolio: {
    id: 'portfolio',
    label: 'Portfolio / Form Upload',
    maxBytes: 4 * 1024 * 1024,
    maxLongEdge: 2400,
    fit: 'scale-down',
  },
}

const SAFETY_MARGIN = 0.97
const HARD_INPUT_LIMIT = 100 * 1024 * 1024 // 100 MB
const QUALITY_LADDER = [95, 90, 85, 80, 75, 70, 65, 60]

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers':
    'X-Optimized-Width, X-Optimized-Height, X-Optimized-Quality, X-Optimized-Bytes, X-Original-Bytes, X-Original-Width, X-Original-Height, X-Optimized-Format, X-Preset, Content-Disposition',
}

interface Env {
  IMAGES: ImagesBinding
}

// The @cloudflare/workers-types def for ImagesBinding may lag; declare the
// shape we actually use.
interface ImagesBinding {
  input(stream: ReadableStream | ArrayBuffer | Uint8Array): ImagesTransformer
  info(stream: ReadableStream | ArrayBuffer | Uint8Array): Promise<{
    format?: string
    fileSize?: number
    width?: number
    height?: number
  }>
}
interface ImagesTransformer {
  transform(opts: TransformOptions): ImagesTransformer
  output(opts: OutputOptions): Promise<ImagesResult>
}
interface TransformOptions {
  width?: number
  height?: number
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  gravity?: 'auto' | 'left' | 'right' | 'top' | 'bottom' | 'center'
  rotate?: number
  background?: string
}
interface OutputOptions {
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'image/gif'
  quality?: number
  background?: string
}
interface ImagesResult {
  contentType(): string
  image(): ReadableStream
  response(): Response
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function makeFilename(original: string, ext: string): string {
  const base = (original || 'photo').replace(/\.[^.]+$/, '')
  const safe = base.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60) || 'photo'
  return `${safe}-vagaro.${ext}`
}

function planTransform(preset: Preset, srcW: number, srcH: number): TransformOptions {
  if (preset.fit === 'cover' && preset.targetWidth && preset.targetHeight) {
    return {
      width: preset.targetWidth,
      height: preset.targetHeight,
      fit: 'cover',
      gravity: 'auto',
    }
  }
  // scale-down: cap the longest edge, optionally upscale to meet minimums.
  const longEdge = Math.max(srcW, srcH)
  let targetLong = Math.min(preset.maxLongEdge, longEdge)
  if (preset.minWidth && preset.minHeight) {
    const upscale = Math.max(preset.minWidth / srcW, preset.minHeight / srcH, 1)
    if (upscale > 1) {
      targetLong = Math.max(targetLong, Math.round(longEdge * upscale))
    }
  }
  // Map back to width/height. CF respects whichever is the actual bound.
  if (srcW >= srcH) {
    return { width: targetLong, fit: 'scale-down' }
  }
  return { height: targetLong, fit: 'scale-down' }
}

async function streamToBuffer(stream: ReadableStream): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      total += value.length
    }
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

async function transformOnce(
  env: Env,
  input: Uint8Array,
  transform: TransformOptions,
  output: OutputOptions,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const result = await env.IMAGES.input(input).transform(transform).output(output)
  const bytes = await streamToBuffer(result.image())
  return { bytes, contentType: result.contentType() }
}

async function handleOptimize(req: Request, env: Env): Promise<Response> {
  const form = await req.formData()
  const file = form.get('file') as
    | (Blob & { name?: string; size: number; arrayBuffer(): Promise<ArrayBuffer> })
    | null
  const presetId = (form.get('preset') as PresetId) || 'staff'
  if (!file || typeof file.arrayBuffer !== 'function') {
    return json({ error: 'No file uploaded' }, 400)
  }
  const fileName = (file as { name?: string }).name || 'photo'
  const preset = PRESETS[presetId]
  if (!preset) return json({ error: 'Invalid preset' }, 400)

  if (file.size > HARD_INPUT_LIMIT) {
    return json({ error: 'File exceeds 100 MB hard limit' }, 413)
  }

  const inputBytes = new Uint8Array(await file.arrayBuffer())

  // Probe metadata (handles HEIC/AVIF/JPEG/PNG/WebP/GIF natively).
  let info: { format?: string; width?: number; height?: number; fileSize?: number }
  try {
    info = await env.IMAGES.info(inputBytes)
  } catch (err) {
    return json(
      {
        error:
          'Could not read image. Supported formats: JPEG, PNG, WebP, GIF, HEIC, AVIF.',
        detail: err instanceof Error ? err.message : String(err),
      },
      400,
    )
  }
  const origW = info.width || 0
  const origH = info.height || 0
  if (!origW || !origH) {
    return json({ error: 'Unsupported or corrupt image' }, 400)
  }

  // Animated GIFs: pass through if they fit, otherwise refuse.
  if (info.format === 'image/gif') {
    if (inputBytes.length <= preset.maxBytes) {
      const filename = makeFilename(fileName, 'gif')
      return new Response(inputBytes, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Optimized-Width': String(origW),
          'X-Optimized-Height': String(origH),
          'X-Optimized-Quality': '100',
          'X-Original-Bytes': String(inputBytes.length),
          'X-Optimized-Bytes': String(inputBytes.length),
          'X-Original-Width': String(origW),
          'X-Original-Height': String(origH),
          'X-Optimized-Format': 'gif',
          'X-Preset': preset.id,
          ...CORS_HEADERS,
        },
      })
    }
    return json(
      { error: 'Animated GIF exceeds the size cap and cannot be re-encoded safely.' },
      400,
    )
  }

  const transform = planTransform(preset, origW, origH)
  const target = Math.floor(preset.maxBytes * SAFETY_MARGIN)

  // Iterate JPEG quality from the ladder until we fit under the cap.
  let result: { bytes: Uint8Array; contentType: string } | null = null
  let chosenQuality = 0
  for (const q of QUALITY_LADDER) {
    const out = await transformOnce(env, inputBytes, transform, {
      format: 'image/jpeg',
      quality: q,
    })
    if (out.bytes.length <= target) {
      result = out
      chosenQuality = q
      break
    }
    // Track the latest as a fallback in case nothing fits.
    result = out
    chosenQuality = q
  }
  if (!result) {
    return json({ error: 'Optimization produced no output' }, 500)
  }

  // If even q=60 doesn't fit (rare — only possible if the user gave a huge
  // dimension preset), shrink dimensions and retry.
  if (result.bytes.length > target) {
    const shrink: TransformOptions = { ...transform }
    if (shrink.width) shrink.width = Math.round(shrink.width * 0.8)
    if (shrink.height) shrink.height = Math.round(shrink.height * 0.8)
    const retry = await transformOnce(env, inputBytes, shrink, {
      format: 'image/jpeg',
      quality: 75,
    })
    if (retry.bytes.length < result.bytes.length) {
      result = retry
      chosenQuality = 75
    }
  }

  // Get final dimensions for reporting.
  let outW = 0
  let outH = 0
  try {
    const finalInfo = await env.IMAGES.info(result.bytes)
    outW = finalInfo.width || 0
    outH = finalInfo.height || 0
  } catch {
    // Non-fatal — clients can read dimensions from the image itself.
  }

  const filename = makeFilename(fileName, 'jpg')
  return new Response(result.bytes, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Optimized-Width': String(outW),
      'X-Optimized-Height': String(outH),
      'X-Optimized-Quality': String(chosenQuality),
      'X-Original-Bytes': String(inputBytes.length),
      'X-Optimized-Bytes': String(result.bytes.length),
      'X-Original-Width': String(origW),
      'X-Original-Height': String(origH),
      'X-Optimized-Format': 'jpeg',
      'X-Preset': preset.id,
      ...CORS_HEADERS,
    },
  })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ ok: false, service: 'lashpop-staffphoto-optimize', disabled: true }, 503)
    }
    // This standalone utility is not part of the client launch. Keep it
    // fail-closed until it is rebuilt behind authenticated admin infrastructure.
    return new Response('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  },
}
