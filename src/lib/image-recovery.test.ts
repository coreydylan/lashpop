import test from 'node:test'
import assert from 'node:assert/strict'
import cfImageLoader from './cf-image-loader'
import { cloudflareImageDeliveryUrl, publicCloudflareDeliveryUrl, staticCloudflareImageUrl } from './cloudflare-image-delivery'
import manifest from '../generated/cloudflare-public-images.json'

test('explicit recovery keeps every static manifest image on the verified site origin', () => {
  process.env.NEXT_PUBLIC_IMAGE_RECOVERY_ORIGIN = 'https://media.example.com'
  try {
    for (const [path, id] of Object.entries(manifest.sources)) {
      assert.equal(staticCloudflareImageUrl(path), path)
      assert.equal(cloudflareImageDeliveryUrl(id), path)
      assert.equal(cfImageLoader({ src: path, width: 600 }), path)
      assert.equal(publicCloudflareDeliveryUrl(`https://imagedelivery.net/${manifest.accountHash}/${id}/public`), path)
    }
  } finally { delete process.env.NEXT_PUBLIC_IMAGE_RECOVERY_ORIGIN }
})

test('dynamic sources and responsive reloads preserve full versioned IDs through recovery', () => {
  process.env.NEXT_PUBLIC_IMAGE_RECOVERY_ORIGIN = 'https://media.example.com'
  try {
    const id = `lp/vagaro/${'a'.repeat(64)}/${'b'.repeat(64)}`
    const direct = `https://imagedelivery.net/${manifest.accountHash}/${id}/public`
    const resolved = publicCloudflareDeliveryUrl(direct)
    assert.equal(resolved, `https://media.example.com/image/${id}?w=1800&q=90`)
    assert.equal(cfImageLoader({ src: resolved, width: 600, quality: 85 }), `https://media.example.com/image/${id}?w=600&q=85`)
    assert.equal(cfImageLoader({ src: direct, width: 900 }), `https://media.example.com/image/${id}?w=900&q=90`)
    assert.equal(publicCloudflareDeliveryUrl('https://imagedelivery.net/another-account/id/public'), 'https://imagedelivery.net/another-account/id/public')
  } finally { delete process.env.NEXT_PUBLIC_IMAGE_RECOVERY_ORIGIN }
})

test('invalid recovery origins fail closed and disabling the switch restores prior delivery', () => {
  for (const value of ['http://media.example.com', 'https://user:secret@media.example.com', 'https://media.example.com/path', 'https://media.example.com?foo=bar']) {
    process.env.NEXT_PUBLIC_IMAGE_RECOVERY_ORIGIN = value
    assert.throws(() => cloudflareImageDeliveryUrl('lp/example'), /plain HTTPS/)
  }
  delete process.env.NEXT_PUBLIC_IMAGE_RECOVERY_ORIGIN
  assert.equal(cloudflareImageDeliveryUrl('lp/example'), `https://imagedelivery.net/${manifest.accountHash}/lp/example/public`)
})
