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
