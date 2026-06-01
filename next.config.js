/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cf-image-loader.ts',
    // deviceSizes/imageSizes still drive srcset width selection; quality is opaque to Next under custom loader.
    deviceSizes: [320, 600, 900, 1200, 1800, 2400],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.lashpopstudios.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.r2.dev', pathname: '/**' },
      { protocol: 'https', hostname: 'dam.lashpopstudios.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.ssl.cf2.rackcdn.com', pathname: '/**' },
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
      // DAM was consolidated into the admin panel. Keep old /dam URLs working.
      // Order matters: specific routes before the catch-all.
      {
        source: '/dam/login',
        destination: '/admin/login',
        permanent: false,
      },
      {
        source: '/dam/team',
        destination: '/admin/assets/team',
        permanent: false,
      },
      {
        source: '/dam',
        destination: '/admin/assets',
        permanent: false,
      },
      {
        source: '/dam/:path*',
        destination: '/admin/assets/:path*',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig