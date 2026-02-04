'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Decorative element */}
        <div className="mb-8">
          <span className="text-6xl">✨</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl text-stone-800 mb-4">
          Something Went Wrong
        </h1>

        <p className="text-stone-600 mb-8 leading-relaxed">
          We encountered an unexpected error. Don&apos;t worry, our team has been notified.
          Please try again or head back to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-6 py-3 bg-terracotta text-white rounded-full font-medium hover:bg-rust transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-terracotta text-terracotta rounded-full font-medium hover:bg-terracotta hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Error digest for debugging (only in development or for support) */}
        {error.digest && (
          <p className="mt-8 text-xs text-stone-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
