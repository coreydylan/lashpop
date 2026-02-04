import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Decorative element */}
        <div className="mb-8">
          <span className="text-8xl font-display text-terracotta opacity-20">404</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl text-stone-800 mb-4">
          Page Not Found
        </h1>

        <p className="text-stone-600 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to something beautiful.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-terracotta text-white rounded-full font-medium hover:bg-rust transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/#services"
            className="inline-flex items-center justify-center px-6 py-3 border border-terracotta text-terracotta rounded-full font-medium hover:bg-terracotta hover:text-white transition-colors"
          >
            View Services
          </Link>
        </div>
      </div>
    </div>
  )
}
