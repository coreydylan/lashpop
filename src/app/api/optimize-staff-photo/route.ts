import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PresetId = 'staff' | 'logo' | 'service' | 'portfolio'

interface Preset {
  id: PresetId
  label: string
  maxBytes: number
  // Target longest-edge for resizing. We never enlarge.
  maxLongEdge: number
  // Optional minimum dimensions (will scale up if smaller — Vagaro recommends).
  minWidth?: number
  minHeight?: number
  // Optional fixed aspect ratio (width / height). When set, image is cover-cropped.
  aspectRatio?: { width: number; height: number }
  // Optional explicit target dimensions when aspectRatio is set.
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
    maxLongEdge: 1788, // ~2.24x of 798 long edge
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

const SAFETY_MARGIN = 0.97 // leave 3% headroom under the cap

async function encodeJpeg(pipeline: sharp.Sharp, quality: number): Promise<Buffer> {
  return pipeline
    .clone()
    .jpeg({
      quality,
      mozjpeg: true,
      chromaSubsampling: quality >= 90 ? '4:4:4' : '4:2:0',
      progressive: true,
    })
    .toBuffer()
}

async function encodePng(pipeline: sharp.Sharp, compressionLevel: number): Promise<Buffer> {
  return pipeline
    .clone()
    .png({ compressionLevel, palette: false, effort: 10 })
    .toBuffer()
}

interface OptimizeResult {
  buffer: Buffer
  format: 'jpeg' | 'png'
  width: number
  height: number
  quality: number
  bytes: number
}

async function optimizeForCap(
  pipeline: sharp.Sharp,
  outputFormat: 'jpeg' | 'png' | 'auto',
  hasAlpha: boolean,
  cap: number,
): Promise<OptimizeResult> {
  const targetCap = Math.floor(cap * SAFETY_MARGIN)

  // Decide format. PNG only makes sense when transparency must be preserved.
  const format: 'jpeg' | 'png' =
    outputFormat === 'png' || (outputFormat === 'auto' && hasAlpha) ? 'png' : 'jpeg'

  if (format === 'png') {
    // Try max-compression PNG. If it still busts the cap, fall back to JPEG (we will lose alpha).
    const buf = await encodePng(pipeline, 9)
    if (buf.length <= targetCap) {
      const meta = await sharp(buf).metadata()
      return {
        buffer: buf,
        format: 'png',
        width: meta.width || 0,
        height: meta.height || 0,
        quality: 100,
        bytes: buf.length,
      }
    }
    // Flatten alpha onto white and continue as JPEG.
    pipeline = pipeline.clone().flatten({ background: '#ffffff' })
  }

  // Binary-search JPEG quality between 60 and 95 for the largest fit.
  let lo = 60
  let hi = 95
  let best: Buffer | null = null
  let bestQ = 60

  // First try the high end — most photos fit fine at 95.
  const topBuf = await encodeJpeg(pipeline, hi)
  if (topBuf.length <= targetCap) {
    const meta = await sharp(topBuf).metadata()
    return {
      buffer: topBuf,
      format: 'jpeg',
      width: meta.width || 0,
      height: meta.height || 0,
      quality: hi,
      bytes: topBuf.length,
    }
  }

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const buf = await encodeJpeg(pipeline, mid)
    if (buf.length <= targetCap) {
      best = buf
      bestQ = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  if (!best) {
    // Even at q=60 we are too big — encode at q=60 and let the caller resize.
    best = await encodeJpeg(pipeline, 60)
    bestQ = 60
  }

  const meta = await sharp(best).metadata()
  return {
    buffer: best,
    format: 'jpeg',
    width: meta.width || 0,
    height: meta.height || 0,
    quality: bestQ,
    bytes: best.length,
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    const presetId = (form.get('preset') as PresetId) || 'staff'

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const preset = PRESETS[presetId]
    if (!preset) {
      return NextResponse.json({ error: 'Invalid preset' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const input = Buffer.from(arrayBuffer)

    // Read metadata, auto-rotate via EXIF.
    const meta = await sharp(input).metadata()
    const inWidth = meta.width || 0
    const inHeight = meta.height || 0
    if (!inWidth || !inHeight) {
      return NextResponse.json({ error: 'Could not read image dimensions' }, { status: 400 })
    }
    const hasAlpha = Boolean(meta.hasAlpha)
    const animated = (meta.pages || 1) > 1 && meta.format === 'gif'

    if (animated) {
      // Animated GIFs are passed through if under the cap; otherwise reject — we
      // would lose animation by converting to a still.
      if (input.length <= preset.maxBytes) {
        const filename = makeFilename(file.name, 'gif')
        return new NextResponse(new Uint8Array(input), {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Optimized-Width': String(inWidth),
            'X-Optimized-Height': String(inHeight),
            'X-Optimized-Quality': '100',
            'X-Original-Bytes': String(input.length),
            'X-Optimized-Bytes': String(input.length),
            'X-Optimized-Format': 'gif',
          },
        })
      }
      return NextResponse.json(
        { error: 'Animated GIF exceeds the size cap and cannot be optimized without losing animation.' },
        { status: 400 },
      )
    }

    let pipeline = sharp(input, { failOn: 'none' }).rotate() // auto-orient

    // Apply preset sizing.
    if (preset.aspectRatio && preset.targetWidth && preset.targetHeight) {
      // Service preset: cover-crop to exact aspect, then size to a quality-friendly multiple.
      const longEdge = Math.min(preset.maxLongEdge, Math.max(inWidth, inHeight))
      const scale = longEdge / Math.max(preset.targetWidth, preset.targetHeight)
      const outW = Math.max(preset.targetWidth, Math.round(preset.targetWidth * scale))
      const outH = Math.max(preset.targetHeight, Math.round(preset.targetHeight * scale))
      pipeline = pipeline.resize(outW, outH, {
        fit: 'cover',
        position: 'attention', // smart-crop on salient region (faces, edges)
        withoutEnlargement: false,
      })
    } else {
      // Plain longest-edge resize, never enlarge unless minimums require it.
      const longEdge = Math.max(inWidth, inHeight)
      let targetLongEdge = Math.min(preset.maxLongEdge, longEdge)

      // Enforce minimums.
      if (preset.minWidth && preset.minHeight) {
        const scaleW = preset.minWidth / inWidth
        const scaleH = preset.minHeight / inHeight
        const upscale = Math.max(scaleW, scaleH, 1)
        if (upscale > 1) {
          targetLongEdge = Math.max(targetLongEdge, Math.round(longEdge * upscale))
        }
      }

      pipeline = pipeline.resize({
        width: inWidth >= inHeight ? targetLongEdge : undefined,
        height: inHeight > inWidth ? targetLongEdge : undefined,
        fit: 'inside',
        withoutEnlargement: !(preset.minWidth && preset.minHeight),
      })
    }

    // Try first pass.
    let result = await optimizeForCap(pipeline, 'auto', hasAlpha, preset.maxBytes)

    // If still over (extreme input), iteratively downscale until it fits.
    let attempts = 0
    while (result.bytes > Math.floor(preset.maxBytes * SAFETY_MARGIN) && attempts < 4) {
      attempts++
      const shrink = 0.85
      pipeline = pipeline.resize({
        width: Math.round(result.width * shrink),
        height: Math.round(result.height * shrink),
        fit: 'inside',
        withoutEnlargement: true,
      })
      result = await optimizeForCap(pipeline, 'auto', hasAlpha, preset.maxBytes)
    }

    const filename = makeFilename(file.name, result.format)

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.format === 'png' ? 'image/png' : 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Optimized-Width': String(result.width),
        'X-Optimized-Height': String(result.height),
        'X-Optimized-Quality': String(result.quality),
        'X-Original-Bytes': String(input.length),
        'X-Optimized-Bytes': String(result.bytes),
        'X-Original-Width': String(inWidth),
        'X-Original-Height': String(inHeight),
        'X-Optimized-Format': result.format,
        'X-Preset': preset.id,
      },
    })
  } catch (err) {
    console.error('[staffphoto] optimize error', err)
    return NextResponse.json({ error: 'Optimization failed' }, { status: 500 })
  }
}

function makeFilename(original: string, format: 'jpeg' | 'png' | 'gif'): string {
  const ext = format === 'jpeg' ? 'jpg' : format
  const base = original.replace(/\.[^.]+$/, '') || 'photo'
  const safe = base.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60) || 'photo'
  return `${safe}-vagaro.${ext}`
}
