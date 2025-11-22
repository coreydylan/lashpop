/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Note: Body size limits are configured in vercel.json for Vercel deployments
  // Configure API routes to handle large uploads
  async headers() {
    return [
      {
        source: '/api/dam/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig