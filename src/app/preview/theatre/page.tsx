'use client';

export default function TheatrePreviewPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
      <div className="max-w-xl space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-gray-400">Preview offline</p>
        <h1 className="text-3xl font-semibold">Theatre.js preview is currently disabled</h1>
        <p className="text-gray-300">
          We&apos;ve paused the real-time Theatre.js preview while we finalize the Digital Asset
          Manager launch. The 3D experience will return on a dedicated branch once it&apos;s ready
          for production traffic.
        </p>
      </div>
    </div>
  );
}
