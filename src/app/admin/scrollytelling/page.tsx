'use client';

import Link from 'next/link';

export default function ScrollytellingAdminPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6 text-center">
      <div className="max-w-xl space-y-4 text-white">
        <h1 className="text-3xl font-semibold">Scrollytelling tools are paused</h1>
        <p className="text-gray-300">
          We&apos;re focused on shipping the Digital Asset Manager right now. The scrollytelling
          editor and runtime will return on a future release. In the meantime you can keep managing
          assets in the DAM while we iterate on the storytelling experience separately.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dam"
            className="px-4 py-2 rounded-full bg-dusty-rose text-cream font-semibold"
          >
            Go to DAM
          </Link>
          <a
            href="mailto:hello@lashpop.com"
            className="px-4 py-2 rounded-full border border-white/30 text-white"
          >
            Notify me when ready
          </a>
        </div>
      </div>
    </div>
  );
}
