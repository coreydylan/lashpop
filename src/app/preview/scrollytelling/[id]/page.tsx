'use client';

export default function DisabledScrollytellingPreview() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6 text-center">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm uppercase tracking-widest text-gray-400">Preview unavailable</p>
        <h1 className="text-3xl font-semibold">Scrollytelling preview is paused</h1>
        <p className="text-gray-300">
          We&apos;re currently focused on the DAM rollout, so live previews for scrollytelling
          compositions are temporarily disabled. If you need access sooner, please reach out and
          we&apos;ll keep you posted on the next release window.
        </p>
      </div>
    </div>
  );
}
