const HOSTED_IMAGE_PREFIX = 'lp'

export function sourceDescriptor(url, key) {
  if (key === 'ext') {
    const target = url.searchParams.get('url') || ''
    return { kind: 'ext', locator: new URL(target).toString() }
  }

  if (key.startsWith('site/')) {
    return { kind: 'site', locator: key.slice('site/'.length) }
  }

  return { kind: 'r2', locator: key }
}

export function canonicalSource(descriptor) {
  return `${descriptor.kind}:${descriptor.locator}`
}

export async function hostedImageId(descriptor) {
  const input = new TextEncoder().encode(canonicalSource(descriptor))
  const digest = await crypto.subtle.digest('SHA-256', input)
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${HOSTED_IMAGE_PREFIX}/${hex}`
}

export function canonicalTransform({ width, height, fit, gravity, quality, format, sharpen }) {
  return [
    `width=${width}`,
    `height=${height || 0}`,
    `fit=${fit}`,
    `gravity=${gravity.x}x${gravity.y}`,
    `quality=${quality}`,
    `format=${format}`,
    `sharpen=${sharpen || 0}`,
  ].join('&')
}

export async function hostedVariantId(sourceImageId, transform) {
  const sourceHash = sourceImageId.replace(/^lp\//, '')
  const input = new TextEncoder().encode(canonicalTransform(transform))
  const digest = await crypto.subtle.digest('SHA-256', input)
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `lpv/${sourceHash}/${hex}`
}

export function hostedImageOptions({
  width,
  height,
  fit,
  gravity,
  quality,
  format,
  sharpen,
}) {
  const options = [
    `width=${width}`,
    height ? `height=${height}` : null,
    `fit=${fit}`,
    height ? `gravity=${gravity.x}x${gravity.y}` : null,
    `quality=${quality}`,
    `format=${format}`,
    sharpen ? `sharpen=${sharpen}` : null,
    'metadata=none',
  ]

  return options.filter(Boolean).join(',')
}

export function hostedImageUrl(accountHash, imageId, options) {
  return `https://imagedelivery.net/${accountHash}/${imageId}/${options}`
}
