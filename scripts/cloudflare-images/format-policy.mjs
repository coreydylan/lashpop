export function acceptedOutputFormat(requested, actual) {
  if (requested === 'avif') return ['avif', 'webp', 'jpeg'].includes(actual)
  if (requested === 'webp') return ['webp', 'jpeg'].includes(actual)

  // Cloudflare Images serves a compressed original-format PNG or GIF when a
  // client does not advertise AVIF/WebP support. JPEG-only here means the
  // verifier's standard legacy fallback lane, not forced lossy transcoding.
  // https://developers.cloudflare.com/images/optimization/hosted-images/serve-uploaded-images/#optimize-format
  return ['jpeg', 'png', 'gif'].includes(actual)
}
