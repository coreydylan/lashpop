'use client';

import Link from 'next/link';

export default function TheatreAdminPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
      <div className="max-w-2xl space-y-5">
        <p className="text-sm uppercase tracking-widest text-purple-300">Coming soon</p>
        <h1 className="text-4xl font-semibold">The Theatre.js workspace is temporarily disabled</h1>
        <p className="text-gray-300 leading-relaxed">
          We&apos;ve parked the interactive 3D editor while we finish polishing the DAM experience.
          Your previous projects are safe—we&apos;ll re-enable the interface once the next iteration
          ships. Thanks for the patience while we focus on the features you need today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dam"
            className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 transition text-white font-semibold"
          >
            Back to DAM
          </Link>
          <a
            href="mailto:hello@lashpop.com"
            className="px-4 py-2 rounded-full border border-white/30 hover:border-white/60 transition"
          >
            Get release updates
          </a>
        </div>
      </div>
    </div>
  );
}
