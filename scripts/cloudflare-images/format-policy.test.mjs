import assert from 'node:assert/strict'
import test from 'node:test'

import { acceptedOutputFormat } from './format-policy.mjs'

test('modern format requests allow only documented Cloudflare fallbacks', () => {
  assert.equal(acceptedOutputFormat('avif', 'avif'), true)
  assert.equal(acceptedOutputFormat('avif', 'webp'), true)
  assert.equal(acceptedOutputFormat('avif', 'jpeg'), true)
  assert.equal(acceptedOutputFormat('avif', 'png'), false)
  assert.equal(acceptedOutputFormat('webp', 'webp'), true)
  assert.equal(acceptedOutputFormat('webp', 'jpeg'), true)
  assert.equal(acceptedOutputFormat('webp', 'png'), false)
})

test('standard fallback accepts JPEG and compressed original PNG or GIF', () => {
  assert.equal(acceptedOutputFormat('jpeg', 'jpeg'), true)
  assert.equal(acceptedOutputFormat('jpeg', 'png'), true)
  assert.equal(acceptedOutputFormat('jpeg', 'gif'), true)
  assert.equal(acceptedOutputFormat('jpeg', 'avif'), false)
})
