// Vagaro photo optimizer — Cloudflare Worker
// Accepts large image uploads (bypasses Vercel's body-size cap), decodes via
// jsquash, resizes/crops per the chosen Vagaro preset, then binary-searches
// mozjpeg quality for the highest fidelity that fits under the file-size cap.

import { decode as decodeJpeg, encode as encodeJpeg } from '@jsquash/jpeg'
import { decode as decodePng, encode as encodePng } from '@jsquash/png'
import { decode as decodeWebp } from '@jsquash/webp'
import resize from '@jsquash/resize'

type PresetId = 'staff' | 'logo' | 'service' | 'portfolio'

interface Preset {
  id: PresetId
  label: string
  maxBytes: number
  maxLongEdge: number
  minWidth?: number
  minHeight?: number
  aspectRatio?: { width: number; height: number }
  targetWidth?: number
  targetHeight?: number
}

const PRESETS: Record<PresetId, Preset> = {
  staff: {
    id: 'staff',
    label: 'Staff / Profile Photo',
    maxBytes: 4 * 1024 * 1024,
    maxLongEdge: 2000,
  },
  logo: {
    id: 'logo',
    label: 'Business Logo / Gallery',
    maxBytes: 5 * 1024 * 1024,
    maxLongEdge: 3000,
    minWidth: 1000,
    minHeight: 667,
  },
  service: {
    id: 'service',
    label: 'Service Image',
    maxBytes: 4 * 1024 * 1024,
    maxLongEdge: 1788,
    aspectRatio: { width: 798, height: 894 },
    targetWidth: 798,
    targetHeight: 894,
  },
  portfolio: {
    id: 'portfolio',
    label: 'Portfolio / Form Upload',
    maxBytes: 4 * 1024 * 1024,
    maxLongEdge: 2400,
  },
}

const SAFETY_MARGIN = 0.97
const HARD_INPUT_LIMIT = 100 * 1024 * 1024 // 100 MB safety guard

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers':
    'X-Optimized-Width, X-Optimized-Height, X-Optimized-Quality, X-Optimized-Bytes, X-Original-Bytes, X-Original-Width, X-Original-Height, X-Optimized-Format, X-Preset, Content-Disposition',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function sniffFormat(bytes: Uint8Array): 'jpeg' | 'png' | 'webp' | 'gif' | 'unknown' {
  if (bytes.length < 12) return 'unknown'
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return 'png'
  // GIF: 47 49 46 38
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  )
    return 'gif'
  // WebP: RIFF ???? WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return 'webp'
  return 'unknown'
}

interface DecodedImage {
  data: Uint8ClampedArray
  width: number
  height: number
  hasAlpha: boolean
}

async function decodeAny(bytes: ArrayBuffer, format: string): Promise<DecodedImage> {
  let img: ImageData
  if (format === 'jpeg') {
    img = await decodeJpeg(bytes)
  } else if (format === 'png') {
    img = await decodePng(bytes)
  } else if (format === 'webp') {
    img = await decodeWebp(bytes)
  } else {
    throw new Error(`Unsupported input format: ${format}`)
  }
  return {
    data: img.data,
    width: img.width,
    height: img.height,
    hasAlpha: format === 'png' || format === 'webp',
  }
}

function toImageData(img: DecodedImage): ImageData {
  // ImageData is the format jsquash expects (RGBA Uint8ClampedArray).
  // We construct via the global ImageData polyfill that jsquash injects, but a
  // plain object with the same shape works for resize/encode calls.
  return {
    data: img.data,
    width: img.width,
    height: img.height,
    colorSpace: 'srgb',
  } as ImageData
}

function cropCover(
  src: DecodedImage,
  targetW: number,
  targetH: number,
): DecodedImage {
  // Cover-crop: scale ratio is max(targetW/srcW, targetH/srcH). Then center-crop.
  const srcRatio = src.width / src.height
  const dstRatio = targetW / targetH
  let cropW: number
  let cropH: number
  if (srcRatio > dstRatio) {
    // source is too wide — crop horizontally
    cropH = src.height
    cropW = Math.round(src.height * dstRatio)
  } else {
    cropW = src.width
    cropH = Math.round(src.width / dstRatio)
  }
  const offsetX = Math.floor((src.width - cropW) / 2)
  const offsetY = Math.floor((src.height - cropH) / 2)

  const out = new Uint8ClampedArray(cropW * cropH * 4)
  for (let y = 0; y < cropH; y++) {
    const srcStart = ((y + offsetY) * src.width + offsetX) * 4
    const dstStart = y * cropW * 4
    out.set(src.data.subarray(srcStart, srcStart + cropW * 4), dstStart)
  }
  return { data: out, width: cropW, height: cropH, hasAlpha: src.hasAlpha }
}

function flattenAlpha(src: DecodedImage): DecodedImage {
  if (!src.hasAlpha) return src
  const out = new Uint8ClampedArray(src.data.length)
  for (let i = 0; i < src.data.length; i += 4) {
    const a = src.data[i + 3] / 255
    const inv = 1 - a
    out[i] = Math.round(src.data[i] * a + 255 * inv)
    out[i + 1] = Math.round(src.data[i + 1] * a + 255 * inv)
    out[i + 2] = Math.round(src.data[i + 2] * a + 255 * inv)
    out[i + 3] = 255
  }
  return { data: out, width: src.width, height: src.height, hasAlpha: false }
}

async function resizeImage(
  src: DecodedImage,
  targetW: number,
  targetH: number,
): Promise<DecodedImage> {
  if (src.width === targetW && src.height === targetH) return src
  const out = await resize(toImageData(src), {
    width: targetW,
    height: targetH,
    method: 'lanczos3',
    fitMethod: 'stretch',
    premultiply: true,
    linearRGB: true,
  })
  return {
    data: out.data,
    width: out.width,
    height: out.height,
    hasAlpha: src.hasAlpha,
  }
}

async function encodeJpegAt(img: DecodedImage, quality: number): Promise<Uint8Array> {
  const flat = flattenAlpha(img)
  const buf = await encodeJpeg(toImageData(flat), {
    quality,
    progressive: true,
    optimize_coding: true,
    chroma_subsample: quality >= 90 ? 1 : 2, // 1 = 4:4:4, 2 = 4:2:0
    trellis_multipass: true,
  })
  return new Uint8Array(buf)
}

interface OptimizeResult {
  bytes: Uint8Array
  format: 'jpeg' | 'png'
  quality: number
  width: number
  height: number
}

async function optimizeUnderCap(
  img: DecodedImage,
  preferPng: boolean,
  cap: number,
): Promise<OptimizeResult> {
  const target = Math.floor(cap * SAFETY_MARGIN)

  if (preferPng) {
    const buf = await encodePng(toImageData(img))
    const arr = new Uint8Array(buf)
    if (arr.length <= target) {
      return {
        bytes: arr,
        format: 'png',
        quality: 100,
        width: img.width,
        height: img.height,
      }
    }
    // Too big as PNG — fall through to JPEG (will flatten alpha).
  }

  // Try q=95 first (most photos pass).
  const high = await encodeJpegAt(img, 95)
  if (high.length <= target) {
    return {
      bytes: high,
      format: 'jpeg',
      quality: 95,
      width: img.width,
      height: img.height,
    }
  }

  let lo = 60
  let hi = 95
  let best: Uint8Array | null = null
  let bestQ = 60
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const buf = await encodeJpegAt(img, mid)
    if (buf.length <= target) {
      best = buf
      bestQ = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  if (!best) {
    best = await encodeJpegAt(img, 60)
    bestQ = 60
  }
  return {
    bytes: best,
    format: 'jpeg',
    quality: bestQ,
    width: img.width,
    height: img.height,
  }
}

function makeFilename(original: string, format: 'jpeg' | 'png' | 'gif'): string {
  const ext = format === 'jpeg' ? 'jpg' : format
  const base = (original || 'photo').replace(/\.[^.]+$/, '')
  const safe = base.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60) || 'photo'
  return `${safe}-vagaro.${ext}`
}

async function handleOptimize(req: Request): Promise<Response> {
  const form = await req.formData()
  const file = form.get('file')
  const presetId = (form.get('preset') as PresetId) || 'staff'
  if (!(file instanceof File)) {
    return json({ error: 'No file uploaded' }, 400)
  }
  const preset = PRESETS[presetId]
  if (!preset) return json({ error: 'Invalid preset' }, 400)

  if (file.size > HARD_INPUT_LIMIT) {
    return json({ error: 'File exceeds 100 MB hard limit' }, 413)
  }

  const inputBytes = new Uint8Array(await file.arrayBuffer())
  const format = sniffFormat(inputBytes)

  if (format === 'gif') {
    // Pass animated GIFs through if they fit; we cannot losslessly recompress
    // them with the available codecs without dropping animation.
    if (inputBytes.length <= preset.maxBytes) {
      const filename = makeFilename(file.name, 'gif')
      return new Response(inputBytes, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Optimized-Width': '0',
          'X-Optimized-Height': '0',
          'X-Optimized-Quality': '100',
          'X-Original-Bytes': String(inputBytes.length),
          'X-Optimized-Bytes': String(inputBytes.length),
          'X-Optimized-Format': 'gif',
          'X-Preset': preset.id,
          ...CORS_HEADERS,
        },
      })
    }
    return json(
      {
        error:
          'Animated GIF exceeds the size cap and cannot be optimized without losing animation.',
      },
      400,
    )
  }

  if (format === 'unknown') {
    return json({ error: 'Unsupported file type. Upload JPEG, PNG, WebP, or GIF.' }, 400)
  }

  let img = await decodeAny(inputBytes.buffer, format)
  const origW = img.width
  const origH = img.height

  // Apply sizing rules.
  if (preset.aspectRatio && preset.targetWidth && preset.targetHeight) {
    const longEdge = Math.min(preset.maxLongEdge, Math.max(img.width, img.height))
    const scale = longEdge / Math.max(preset.targetWidth, preset.targetHeight)
    const outW = Math.max(preset.targetWidth, Math.round(preset.targetWidth * scale))
    const outH = Math.max(preset.targetHeight, Math.round(preset.targetHeight * scale))
    const cropped = cropCover(img, outW, outH)
    img = await resizeImage(cropped, outW, outH)
  } else {
    const longEdge = Math.max(img.width, img.height)
    let targetLong = Math.min(preset.maxLongEdge, longEdge)
    if (preset.minWidth && preset.minHeight) {
      const upscale = Math.max(
        preset.minWidth / img.width,
        preset.minHeight / img.height,
        1,
      )
      if (upscale > 1) targetLong = Math.max(targetLong, Math.round(longEdge * upscale))
    }
    if (targetLong !== longEdge) {
      const scale = targetLong / longEdge
      img = await resizeImage(
        img,
        Math.round(img.width * scale),
        Math.round(img.height * scale),
      )
    }
  }

  const preferPng = img.hasAlpha
  let result = await optimizeUnderCap(img, preferPng, preset.maxBytes)

  // Last-resort iterative downscale if even q=60 busts the cap.
  let attempts = 0
  while (
    result.bytes.length > Math.floor(preset.maxBytes * SAFETY_MARGIN) &&
    attempts < 4
  ) {
    attempts++
    img = await resizeImage(
      img,
      Math.round(img.width * 0.85),
      Math.round(img.height * 0.85),
    )
    result = await optimizeUnderCap(img, false, preset.maxBytes)
  }

  const filename = makeFilename(file.name, result.format)
  return new Response(result.bytes, {
    status: 200,
    headers: {
      'Content-Type': result.format === 'png' ? 'image/png' : 'image/jpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Optimized-Width': String(result.width),
      'X-Optimized-Height': String(result.height),
      'X-Optimized-Quality': String(result.quality),
      'X-Original-Bytes': String(inputBytes.length),
      'X-Optimized-Bytes': String(result.bytes.length),
      'X-Original-Width': String(origW),
      'X-Original-Height': String(origH),
      'X-Optimized-Format': result.format,
      'X-Preset': preset.id,
      ...CORS_HEADERS,
    },
  })
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    const url = new URL(req.url)
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ ok: true, service: 'lashpop-staffphoto-optimize' })
    }
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }
    try {
      return await handleOptimize(req)
    } catch (err) {
      console.error('optimize error', err)
      return json(
        { error: err instanceof Error ? err.message : 'Optimization failed' },
        500,
      )
    }
  },
}
