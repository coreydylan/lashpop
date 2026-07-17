/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cf-image-loader.ts',
    // deviceSizes/imageSizes still drive srcset width selection; quality is opaque to Next under custom loader.
    deviceSizes: [320, 600, 900, 1200, 1440, 1800, 2400, 2880, 3200],
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
  // Launch-safe browser headers. A blocking CSP is intentionally omitted until
  // every third-party script, image, booking, and analytics origin is inventoried.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            // Do not include subdomains until every mail and vendor subdomain
            // has been verified to support HTTPS.
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000',
          },
        ],
      },
    ]
  },
  // One-hop redirects from the legacy Squarespace information architecture.
  // Keep this list explicit: these paths were crawled while Squarespace was
  // still authoritative, and each destination is a canonical 200 page/section.
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/about-us-1',
        destination: '/#team',
        permanent: true,
      },
      {
        source: '/about-us-lashpop-studios',
        destination: '/#team',
        permanent: true,
      },
      {
        source: '/about-us-home',
        destination: '/#team',
        permanent: true,
      },
      {
        source: '/our-story',
        destination: '/#team',
        permanent: true,
      },
      {
        source: '/meet-the-team',
        destination: '/#team',
        permanent: true,
      },
      {
        source: '/join-us',
        destination: '/work-with-us',
        permanent: true,
      },
      {
        source: '/about-us-1/join-us',
        destination: '/work-with-us',
        permanent: true,
      },
      {
        source: '/about-us-1/:path*',
        destination: '/#team',
        permanent: true,
      },
      {
        source: '/book-contact-1',
        destination: '/#find-us',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/#faq',
        permanent: true,
      },
      {
        source: '/home-hero-image',
        destination: '/',
        permanent: true,
      },
      {
        source: '/services-offered',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/location-homepage',
        destination: '/#find-us',
        permanent: true,
      },
      {
        source: '/refer-a-friend',
        destination: '/',
        permanent: true,
      },
      {
        source: '/referrals',
        destination: '/',
        permanent: true,
      },
      {
        source: '/email-list',
        destination: '/',
        permanent: true,
      },
      {
        source: '/cart',
        destination: '/',
        permanent: true,
      },
      {
        source: '/search',
        destination: '/',
        permanent: true,
      },
      // These inactive taxonomy pages were also exposed by the bad staging
      // sitemap. Route them to the closest live canonical content.
      {
        source: '/services/nails',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/services/lashpop-pro-training',
        destination: '/work-with-us',
        permanent: true,
      },
      // A prior staging sitemap accidentally published category-nested service
      // URLs. Preserve any links already crawled and send them directly to the
      // canonical one-segment service URL without a redirect chain.
      {
        source: '/services/:category/:service',
        destination: '/services/:service',
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
