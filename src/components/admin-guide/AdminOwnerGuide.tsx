"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Search,
  X,
} from "lucide-react"
import {
  OWNER_GUIDE_AREAS,
  OWNER_GUIDE_ARTICLES,
  findOwnerGuideArticle,
  searchOwnerGuide,
  type OwnerGuideArea,
  type OwnerGuideArticle,
  type OwnerGuideStep,
} from "@/lib/admin/owner-guide-content"

const COMMON_TASKS = ["launch-service", "team-stylists", "quiz", "media-library"]

export function AdminOwnerGuide() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selected = findOwnerGuideArticle(searchParams.get("topic"))
  const [query, setQuery] = useState("")
  const [area, setArea] = useState<OwnerGuideArea | "All">("All")
  const [largeImage, setLargeImage] = useState<OwnerGuideArticle | null>(null)

  const results = useMemo(() => {
    return searchOwnerGuide(query, area)
  }, [area, query])

  const openArticle = (article: OwnerGuideArticle) => {
    router.replace(`/admin/owner-guide?topic=${encodeURIComponent(article.id)}`, { scroll: false })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (selected) {
    return (
      <>
        <GuideArticle article={selected} onBack={() => router.replace("/admin/owner-guide")} onExpand={() => setLargeImage(selected)} />
        {largeImage && <ImageLightbox article={largeImage} onClose={() => setLargeImage(null)} />}
      </>
    )
  }

  const commonTasks = COMMON_TASKS.map((id) => findOwnerGuideArticle(id)).filter((article): article is OwnerGuideArticle => Boolean(article))

  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-2xl border border-terracotta/10 bg-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">Owner guide</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-charcoal sm:text-5xl">What do you want to do?</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-dune">Search for a task or choose a work area. Each guide gives you one action at a time, shows where to look and tells you how to check your work.</p>
          </div>
          <div className="rounded-xl bg-ivory p-5">
            <p className="text-sm font-semibold text-charcoal">New to LashPop Admin?</p>
            <p className="mt-2 text-sm leading-6 text-dune">Start with Today, then use the Website overview to find where each change belongs.</p>
            <button type="button" onClick={() => openArticle(findOwnerGuideArticle("today")!)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-charcoal px-4 text-sm font-semibold text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta">
              Start with Today <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="border-t border-black/10 bg-ivory p-4 sm:p-6 lg:px-10">
          <label htmlFor="owner-guide-search" className="sr-only">Search the Owner guide</label>
          <div className="relative mx-auto max-w-4xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-dune" aria-hidden="true" />
            <input
              id="owner-guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “change a team photo” or “add a service”"
              className="min-h-14 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-base text-charcoal shadow-sm outline-none placeholder:text-dune/65 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              autoComplete="off"
            />
          </div>
        </div>
      </header>

      <section aria-labelledby="guide-work-areas-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="guide-work-areas-heading" className="font-serif text-2xl text-charcoal">Browse by work area</h2>
            <p className="mt-1 text-sm text-dune">Choose the part of Admin where you are working.</p>
          </div>
          <p className="text-sm text-dune" aria-live="polite">{results.length} {results.length === 1 ? "guide" : "guides"}</p>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter guides by work area">
          {(["All", ...OWNER_GUIDE_AREAS] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setArea(option)}
              aria-pressed={area === option}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${area === option ? "border-charcoal bg-charcoal text-white" : "border-black/10 bg-white text-charcoal hover:border-terracotta/40"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      {query === "" && area === "All" && (
        <section aria-labelledby="common-tasks-heading">
          <h2 id="common-tasks-heading" className="font-serif text-2xl text-charcoal">Common tasks</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {commonTasks.map((article) => <GuideCard key={article.id} article={article} featured onOpen={() => openArticle(article)} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="all-guides-heading">
        <h2 id="all-guides-heading" className="font-serif text-2xl text-charcoal">{query || area !== "All" ? "Matching guides" : "All guides"}</h2>
        {results.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((article) => <GuideCard key={article.id} article={article} onOpen={() => openArticle(article)} />)}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-black/20 bg-white px-6 py-14 text-center">
            <BookOpen className="mx-auto size-7 text-terracotta" aria-hidden="true" />
            <h3 className="mt-4 font-serif text-2xl text-charcoal">No guides match that search</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-dune">Try a shorter phrase, such as “team photo”, “reviews” or “Vagaro”.</p>
            <button type="button" onClick={() => { setQuery(""); setArea("All") }} className="mt-4 min-h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-charcoal hover:border-terracotta/40">Clear search</button>
          </div>
        )}
      </section>
    </div>
  )
}

function GuideCard({ article, onOpen, featured = false }: { article: OwnerGuideArticle; onOpen: () => void; featured?: boolean }) {
  return (
    <button type="button" onClick={onOpen} className={`group overflow-hidden rounded-xl border bg-white text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${featured ? "border-terracotta/20" : "border-black/10 hover:border-terracotta/40"}`}>
      <span className="relative block aspect-[16/9] overflow-hidden bg-cream">
        <img src={article.screenshot} alt="" className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-full bg-charcoal px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">{article.area}</span>
      </span>
      <span className="flex min-h-40 flex-col p-5">
        <span className="font-serif text-xl leading-tight text-charcoal">{article.title}</span>
        <span className="mt-2 line-clamp-3 text-sm leading-6 text-dune">{article.summary}</span>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-terracotta">Read the steps <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
      </span>
    </button>
  )
}

function GuideArticle({ article, onBack, onExpand }: { article: OwnerGuideArticle; onBack: () => void; onExpand: () => void }) {
  return (
    <article className="space-y-8">
      <header>
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-dune hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta">
          <ArrowLeft className="size-4" aria-hidden="true" /> All guides
        </button>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">{article.area} · {article.screen}</p>
            <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight text-charcoal sm:text-5xl">{article.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-dune">{article.summary}</p>
          </div>
          <Link href={article.route} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-charcoal px-5 text-sm font-semibold text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta">
            Open this page <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {article.warning && (
        <aside className="flex gap-3 rounded-xl border border-terracotta/20 bg-warm-sand/35 p-4 text-sm leading-6 text-charcoal" aria-label="Important warning">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-terracotta" aria-hidden="true" />
          <div><p className="font-semibold">Before you continue</p><p className="mt-1 text-dune">{article.warning}</p></div>
        </aside>
      )}

      {article.before && article.before.length > 0 && (
        <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6" aria-labelledby="before-start-heading">
          <h2 id="before-start-heading" className="font-serif text-2xl text-charcoal">Before you start</h2>
          <ul className="mt-4 space-y-3">
            {article.before.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-dune"><CheckCircle2 className="mt-1 size-4 shrink-0 text-terracotta" aria-hidden="true" /><span>{item}</span></li>)}
          </ul>
        </section>
      )}

      <section aria-labelledby="steps-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 id="steps-heading" className="font-serif text-3xl text-charcoal">Follow these steps</h2><p className="mt-1 text-sm text-dune">Complete the steps in order unless the guide says otherwise.</p></div>
          <p className="text-sm font-semibold text-dune">{article.steps.length} steps</p>
        </div>
        <ol className="mt-5 space-y-5">
          {article.steps.map((step, index) => <GuideStepCard key={`${article.id}-${step.title}`} article={article} step={step} number={index + 1} />)}
        </ol>
      </section>

      <figure className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 px-4 py-3 sm:px-5">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-terracotta">Full screen</p><p className="mt-0.5 text-sm text-dune">{article.screen}</p></div>
          <button type="button" onClick={onExpand} className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-semibold text-charcoal hover:border-terracotta/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"><Maximize2 className="size-4" aria-hidden="true" /> Enlarge</button>
        </div>
        <img src={article.screenshot} alt={article.screenshotAlt} className="block h-auto w-full" loading="lazy" />
        <figcaption className="border-t border-black/10 px-4 py-3 text-sm leading-6 text-dune sm:px-5">Use this full-page view to confirm where each step sits on the screen.</figcaption>
      </figure>

      <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6" aria-labelledby="check-work-heading">
        <h2 id="check-work-heading" className="font-serif text-2xl text-charcoal">Check your work</h2>
        <ul className="mt-4 space-y-3">
          {article.check.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-dune"><CheckCircle2 className="mt-1 size-4 shrink-0 text-terracotta" aria-hidden="true" /><span>{item}</span></li>)}
        </ul>
      </section>
    </article>
  )
}

function GuideStepCard({ article, step, number }: { article: OwnerGuideArticle; step: OwnerGuideStep; number: number }) {
  const objectPosition = step.focus === "bottom" ? "center 82%" : step.focus === "middle" ? "center 48%" : "center 12%"
  return (
    <li className="grid overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm md:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex gap-4 p-5 sm:p-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-charcoal text-sm font-semibold text-white" aria-hidden="true">{number}</span>
        <div><h3 className="font-serif text-xl text-charcoal">{step.title}</h3><p className="mt-2 text-sm leading-6 text-dune">{step.detail}</p>{step.outsideAdmin && <p className="mt-3 inline-flex rounded-full bg-warm-sand/45 px-3 py-1 text-xs font-semibold text-charcoal">This step happens in Vagaro</p>}</div>
      </div>
      <div className="relative min-h-48 overflow-hidden border-t border-black/10 bg-cream md:border-l md:border-t-0">
        <img src={article.screenshot} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition }} loading="lazy" />
        <span className="absolute inset-x-0 bottom-0 bg-charcoal/85 px-3 py-2 text-xs font-medium text-white">Where to look for step {number}</span>
      </div>
    </li>
  )
}

function ImageLightbox({ article, onClose }: { article: OwnerGuideArticle; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/90 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${article.screen} enlarged screenshot`} onMouseDown={onClose}>
      <div className="relative max-h-full w-full max-w-6xl overflow-auto rounded-xl bg-white p-2 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} autoFocus className="sticky right-3 top-3 z-10 ml-auto flex size-11 items-center justify-center rounded-full bg-charcoal text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta" aria-label="Close enlarged screenshot"><X className="size-5" aria-hidden="true" /></button>
        <img src={article.screenshot} alt={article.screenshotAlt} className="mx-auto -mt-11 h-auto w-full" />
      </div>
    </div>
  )
}
