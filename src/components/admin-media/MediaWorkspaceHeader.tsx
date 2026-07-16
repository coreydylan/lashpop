'use client'

import Link from 'next/link'
import {
  Command,
  FolderPlus,
  Search,
  Tags,
  Upload,
  Users,
  X,
} from 'lucide-react'

interface MediaWorkspaceHeaderProps {
  totalCount: number
  visibleCount: number
  selectedCount: number
  untaggedCount: number
  searchQuery: string
  isUploadOpen: boolean
  onSearchQueryChange: (value: string) => void
  onToggleUpload: () => void
  onOpenCommandPalette: () => void
  onManageTags: () => void
  onManageCollections: () => void
}

export function MediaWorkspaceHeader({
  totalCount,
  visibleCount,
  selectedCount,
  untaggedCount,
  searchQuery,
  isUploadOpen,
  onSearchQueryChange,
  onToggleUpload,
  onOpenCommandPalette,
  onManageTags,
  onManageCollections,
}: MediaWorkspaceHeaderProps) {
  return (
    <>
      <header className="border-b border-black/10 bg-[#f5f0e9] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9f4c33]">Media library</p>
            <h1 className="mt-2 max-w-3xl font-serif text-3xl leading-tight text-[#292a27] sm:text-4xl">
              Keep every image organized and ready to publish.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
              Upload once, then use collections, service tags, and team assignments wherever the website needs photography.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-[#292a27] hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
            >
              <Command className="size-4" aria-hidden="true" />
              Actions
              <kbd className="hidden rounded border border-black/10 bg-black/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-black/45 sm:inline">⌘ K</kbd>
            </button>
            <Link
              href="/admin/assets/team"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-[#292a27] hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
            >
              <Users className="size-4" aria-hidden="true" />
              Team photos
            </Link>
            <button
              type="button"
              onClick={onToggleUpload}
              aria-expanded={isUploadOpen}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#292a27] px-4 text-sm font-semibold text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
            >
              <Upload className="size-4" aria-hidden="true" />
              {isUploadOpen ? 'Close upload' : 'Upload files'}
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-black/10 bg-[#f8f4ee] px-4 sm:px-6 lg:px-8" aria-label="Media library summary">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-black/10 border-x border-black/10 sm:grid-cols-4 sm:divide-y-0">
          <Metric label="All assets" value={totalCount} />
          <Metric label="In this view" value={visibleCount} />
          <Metric label="Need organizing" value={untaggedCount} />
          <Metric label="Selected" value={selectedCount} accent={selectedCount > 0} />
        </dl>
      </section>

      <section className="border-b border-black/10 bg-white px-4 py-4 sm:px-6 lg:px-8" aria-label="Search and library setup">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search media by file name, tag, category, or team member</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40" aria-hidden="true" />
            <input
              type="search"
              name="media-library-search"
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search file names, tags, services, or team…"
              className="min-h-11 w-full rounded-lg border border-black/15 bg-[#fbfaf8] py-2 pl-10 pr-11 text-sm text-[#292a27] placeholder:text-black/35 focus:border-[#c96f50] focus:outline-none focus:ring-2 focus:ring-[#c96f50]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-black/45 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
                aria-label="Clear media search"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </label>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={onManageTags}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-xs font-semibold text-black/65 hover:border-[#c96f50]/50 hover:text-[#9f4c33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
            >
              <Tags className="size-4" aria-hidden="true" />
              Manage tags
            </button>
            <button
              type="button"
              onClick={onManageCollections}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-xs font-semibold text-black/65 hover:border-[#c96f50]/50 hover:text-[#9f4c33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
            >
              <FolderPlus className="size-4" aria-hidden="true" />
              Collections
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`px-4 py-4 sm:px-5 ${accent ? 'bg-[#f4dfd5]' : ''}`}>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">{label}</dt>
      <dd className={`mt-1 font-serif text-2xl leading-none ${accent ? 'text-[#9f4c33]' : 'text-[#292a27]'}`}>{value}</dd>
    </div>
  )
}
