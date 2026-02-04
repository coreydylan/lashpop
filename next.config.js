/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lashpop-dam-assets.s3.us-west-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'eabdc1907c2f84bfe65a-cfc7a6bba052cea084198d4ff3e0b991.ssl.cf2.rackcdn.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'gsap',
      '@gsap/react',
      'embla-carousel',
      'embla-carousel-react',
      'date-fns',
      'lodash',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
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
  // Redirects from old lashpopstudios.com site structure
  async redirects() {
    return [
      // Old homepage alternate URL
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // Old about/team page → team section on homepage
      {
        source: '/about-us-1',
        destination: '/#team',
        permanent: true,
      },
      // Old services page → services section on homepage
      {
        source: '/services',
        destination: '/#services',
        permanent: true,
      },
      // Old booking/contact page → find-us/map section on homepage
      {
        source: '/book-contact-1',
        destination: '/#find-us',
        permanent: true,
      },
      // Old join the team section → new careers page
      {
        source: '/about-us-1/:path*',
        destination: '/work-with-us',
        permanent: true,
      },
      // Cart page (no longer needed - external booking via Vagaro)
      {
        source: '/cart',
        destination: '/',
        permanent: true,
      },
      // Search page
      {
        source: '/search',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig