'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

type PresetId = 'staff' | 'logo' | 'service' | 'portfolio'

interface PresetInfo {
  id: PresetId
  label: string
  description: string
  capMB: number
  hint: string
}

const PRESETS: PresetInfo[] = [
  {
    id: 'staff',
    label: 'Staff / Profile',
    description: 'Optimized for Vagaro staff/profile photos.',
    capMB: 4,
    hint: 'Under 4 MB · JPEG · max 2000px long edge',
  },
  {
    id: 'logo',
    label: 'Business Logo / Gallery',
    description: 'For logos and gallery photos. Will upscale to meet 1000×667 minimum if needed.',
    capMB: 5,
    hint: 'Under 5 MB · ≥ 1000×667 px',
  },
  {
    id: 'service',
    label: 'Service Image',
    description: 'Smart-cropped to Vagaro’s recommended 798×894 portrait ratio.',
    capMB: 4,
    hint: 'Under 4 MB · 798×894 ratio (smart crop)',
  },
  {
    id: 'portfolio',
    label: 'Portfolio / Form',
    description: 'General-purpose optimization for portfolio and form uploads.',
    capMB: 4,
    hint: 'Under 4 MB · JPEG/PNG · max 2400px long edge',
  },
]

interface ResultMeta {
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  originalBytes: number
  optimizedBytes: number
  quality: number
  format: string
  preset: string
  blobUrl: string
  filename: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function StaffPhotoToolPage() {
  const [preset, setPreset] = useState<PresetId>('staff')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResultMeta | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const activePreset = useMemo(() => PRESETS.find((p) => p.id === preset)!, [preset])

  const handleFile = useCallback((next: File | null) => {
    setError(null)
    setResult(null)
    setFile(next)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(next ? URL.createObjectURL(next) : null)
  }, [previewUrl])

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    handleFile(f)
  }

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const optimize = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('preset', preset)
      const res = await fetch(
        'https://lashpop-staffphoto-optimize.experial.workers.dev/optimize',
        { method: 'POST', body: fd },
      )
      if (!res.ok) {
        let msg = 'Optimization failed'
        try {
          const j = await res.json()
          if (j?.error) msg = j.error
        } catch {}
        throw new Error(msg)
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const filename =
        res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
        'photo-vagaro.jpg'
      setResult({
        width: Number(res.headers.get('X-Optimized-Width') || 0),
        height: Number(res.headers.get('X-Optimized-Height') || 0),
        originalWidth: Number(res.headers.get('X-Original-Width') || 0),
        originalHeight: Number(res.headers.get('X-Original-Height') || 0),
        originalBytes: Number(res.headers.get('X-Original-Bytes') || file.size),
        optimizedBytes: Number(res.headers.get('X-Optimized-Bytes') || blob.size),
        quality: Number(res.headers.get('X-Optimized-Quality') || 0),
        format: res.headers.get('X-Optimized-Format') || 'jpeg',
        preset: res.headers.get('X-Preset') || preset,
        blobUrl,
        filename,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl)
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900">Vagaro Photo Optimizer</h1>
          <p className="mt-2 text-stone-600">
            Upload a photo and download a version sized and compressed for Vagaro&rsquo;s upload limits.
            Output is the highest JPEG quality that fits under the cap.
          </p>
        </header>

        <section className="mb-6">
          <label className="mb-2 block text-sm font-medium text-stone-700">Preset</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`rounded-lg border p-3 text-left transition ${
                  preset === p.id
                    ? 'border-stone-900 bg-white shadow-sm'
                    : 'border-stone-200 bg-white/60 hover:border-stone-400'
                }`}
              >
                <div className="font-medium text-stone-900">{p.label}</div>
                <div className="text-xs text-stone-500">{p.hint}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-stone-500">{activePreset.description}</p>
        </section>

        <section className="mb-6">
          <label
            htmlFor="staffphoto-file"
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
              dragOver ? 'border-stone-900 bg-stone-100' : 'border-stone-300 bg-white'
            }`}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 rounded-md object-contain"
              />
            ) : (
              <>
                <div className="text-stone-700">Drag a photo here, or click to choose</div>
                <div className="mt-1 text-xs text-stone-500">JPEG, PNG, or GIF</div>
              </>
            )}
            <input
              id="staffphoto-file"
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={onSelect}
            />
          </label>
          {file && (
            <div className="mt-2 flex items-center justify-between text-sm text-stone-600">
              <span className="truncate">
                {file.name} &middot; {formatBytes(file.size)}
              </span>
              <button
                type="button"
                onClick={reset}
                className="text-stone-500 underline-offset-2 hover:text-stone-900 hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </section>

        <section className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={optimize}
            disabled={!file || busy}
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Optimizing…' : 'Optimize photo'}
          </button>
          {result && (
            <a
              href={result.blobUrl}
              download={result.filename}
              className="rounded-lg border border-stone-900 px-5 py-2.5 font-medium text-stone-900 transition hover:bg-stone-900 hover:text-white"
            >
              Download {result.filename}
            </a>
          )}
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-stone-900">Result</h2>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Stat label="Format" value={result.format.toUpperCase()} />
              <Stat label="JPEG quality" value={result.quality ? String(result.quality) : '—'} />
              <Stat label="Preset" value={result.preset} />
              <Stat
                label="Dimensions"
                value={`${result.width}×${result.height}`}
                sub={`from ${result.originalWidth}×${result.originalHeight}`}
              />
              <Stat
                label="File size"
                value={formatBytes(result.optimizedBytes)}
                sub={`was ${formatBytes(result.originalBytes)}`}
              />
              <Stat
                label="Saved"
                value={
                  result.originalBytes > 0
                    ? `${Math.max(
                        0,
                        Math.round((1 - result.optimizedBytes / result.originalBytes) * 100),
                      )}%`
                    : '—'
                }
              />
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.blobUrl} alt="Optimized" className="mx-auto max-h-96" />
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className="font-medium text-stone-900">{value}</div>
      {sub && <div className="text-xs text-stone-500">{sub}</div>}
    </div>
  )
}
