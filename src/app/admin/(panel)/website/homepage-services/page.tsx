"use client"

import { useCallback, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, RefreshCw, Save, Check, ChevronUp, ChevronDown, Eye, EyeOff, Plus, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'
import type { HomepageServiceCard, HomepageServicesContent } from '@/types/homepage-services'

export default function HomepageServicesAdminPage() {
  const [cards, setCards] = useState<HomepageServiceCard[]>([])
  const [savedCards, setSavedCards] = useState<HomepageServiceCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [baseVersion, setBaseVersion] = useState(0)
  const [sourceOwner, setSourceOwner] = useState('admin')
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/website/homepage-services')
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      const data: { content: HomepageServicesContent; version: number; sourceOwner: string } = await res.json()
      setCards(data.content.cards)
      setSavedCards(data.content.cards)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
      setPendingRemovalId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const updateCard = (index: number, patch: Partial<HomepageServiceCard>) => {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  const move = (index: number, dir: -1 | 1) => {
    setCards((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const addCard = () => {
    setCards((prev) => [
      ...prev,
      {
        id: `card-${Date.now().toString(36)}`,
        slug: '',
        title: 'NEW SERVICE',
        tagline: '',
        description: '',
        icon: '',
        enabled: true,
      },
    ])
  }

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id))
    setPendingRemovalId(null)
  }

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/website/homepage-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, baseVersion }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409 && data?.conflict) {
          setConflict(true)
          throw new Error(`Another admin published a newer version. Reload latest to discard this draft and continue from version ${data.currentVersion ?? 'the newest version'}.`)
        }
        throw new Error(data.error || `Save failed (${res.status})`)
      }
      setCards(data.content.cards)
      setSavedCards(data.content.cards)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Save failed')
      setError(error.message)
      throw error
    } finally {
      setSaving(false)
    }
  }, [baseVersion, cards])

  const dirty = JSON.stringify(cards) !== JSON.stringify(savedCards)
  const discard = useCallback(() => {
    setCards(savedCards)
    setError(null)
    setConflict(false)
    setSaved(false)
    setPendingRemovalId(null)
  }, [savedCards])

  useDirtyBlock({
    id: 'homepage-services',
    label: 'Homepage service cards',
    dirty,
    save,
    discard,
  })

  if (loading) {
    return (
      <div className="mx-auto flex min-h-64 max-w-4xl items-center justify-center border-y border-sage/20 text-sm text-dune/60" role="status">
        <RefreshCw className="mr-2 size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Loading homepage service cards…
      </div>
    )
  }

  const enabledCount = cards.filter((c) => c.enabled).length

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 border-b border-sage/20 pb-5 sm:mb-8 sm:pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">Website</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl leading-tight text-charcoal sm:text-4xl">Homepage service cards</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-dune/70">
              Edit the order and language clients see in the homepage Choose a Service section.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void save().catch(() => undefined)}
            disabled={saving || !dirty}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-terracotta px-4 text-sm font-semibold text-cream transition-colors hover:bg-rust disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : saved ? <Check className="size-4" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-1 text-xs text-dune/55 sm:flex-row sm:items-center sm:gap-2">
          <p>{enabledCount} of {cards.length} visible</p>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <p>{baseVersion === 0 ? 'Not published yet' : `Version ${baseVersion}`} · Source: {sourceOwner}</p>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <p className={error ? 'text-terracotta' : saved ? 'text-ocean-mist' : dirty ? 'text-terracotta' : ''} role="status" aria-live="polite">
            {error ? 'Save needs attention' : saving ? 'Saving changes…' : saved ? 'Changes saved' : dirty ? 'Unsaved changes' : 'All changes saved'}
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-terracotta/25 bg-terracotta/10 p-4 text-sm text-terracotta sm:flex-row sm:items-center" role="alert">
          <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">{error}</p>
          {conflict && (
            <button type="button" onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-terracotta/30 bg-white px-3 text-xs font-semibold text-terracotta">
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Discard edits &amp; load latest
            </button>
          )}
        </div>
      )}

      <div className="mb-6 border-l-2 border-dusty-rose bg-dusty-rose/10 px-4 py-3 text-sm leading-6 text-dune/70">
        <p>
          LashPop owns card copy, art, order, and visibility. Vagaro supplies the booking facts.
        </p>
        <Link href="/admin/website/services" className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-terracotta hover:text-rust">
          View synced booking services <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <ol className="space-y-4" aria-label="Homepage service cards in display order">
        {cards.map((card, index) => (
          <li key={card.id} className={`overflow-hidden rounded-lg border bg-white ${card.enabled ? 'border-sage/25' : 'border-dune/20'}`}>
            <article aria-labelledby={`service-card-${index}-title`}>
              <div className="flex items-center gap-3 border-b border-sage/15 px-3 py-3 sm:px-4">
                <span className="w-6 shrink-0 text-center font-mono text-xs tabular-nums text-dune/50" aria-label={`Position ${index + 1}`}>
                  {index + 1}
                </span>
                <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-warm-sand/40 bg-ivory">
                  {card.icon ? (
                    <Image src={card.icon} alt="" fill className="object-contain p-1.5" />
                  ) : (
                    <Sparkles className="size-4 text-dune/35" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id={`service-card-${index}-title`} className="truncate text-sm font-semibold text-charcoal">
                    {card.title.trim() || `Service card ${index + 1}`}
                  </h2>
                  <p className="mt-0.5 text-xs text-dune/55">{card.enabled ? 'Visible on homepage' : 'Hidden from homepage'}</p>
                </div>
                <div className="flex shrink-0 gap-1" aria-label={`Reorder ${card.title || `service card ${index + 1}`}`}>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="flex size-11 items-center justify-center rounded-md border border-sage/20 text-dune/60 hover:border-sage/40 hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label={`Move ${card.title || `service card ${index + 1}`} up`}
                  >
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === cards.length - 1}
                    className="flex size-11 items-center justify-center rounded-md border border-sage/20 text-dune/60 hover:border-sage/40 hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label={`Move ${card.title || `service card ${index + 1}`} down`}
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <label className="block min-w-0" htmlFor={`service-card-${index}-name`}>
                  <span className="mb-1.5 block text-xs font-semibold text-charcoal">Card title</span>
                  <input
                    id={`service-card-${index}-name`}
                    name={`service-card-${index}-name`}
                    autoComplete="off"
                    value={card.title}
                    onChange={(e) => updateCard(index, { title: e.target.value })}
                    className="min-h-11 w-full rounded-md border border-sage/30 bg-ivory px-3 text-sm text-charcoal outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                  />
                </label>

                <label className="block min-w-0" htmlFor={`service-card-${index}-tagline`}>
                  <span className="mb-1.5 block text-xs font-semibold text-charcoal">Tagline</span>
                  <input
                    id={`service-card-${index}-tagline`}
                    name={`service-card-${index}-tagline`}
                    autoComplete="off"
                    value={card.tagline}
                    onChange={(e) => updateCard(index, { tagline: e.target.value })}
                    className="min-h-11 w-full rounded-md border border-sage/30 bg-ivory px-3 text-sm text-charcoal outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                  />
                </label>

                <label className="block min-w-0 sm:col-span-2" htmlFor={`service-card-${index}-description`}>
                  <span className="mb-1.5 block text-xs font-semibold text-charcoal">Description</span>
                  <textarea
                    id={`service-card-${index}-description`}
                    name={`service-card-${index}-description`}
                    autoComplete="off"
                    value={card.description}
                    onChange={(e) => updateCard(index, { description: e.target.value })}
                    rows={3}
                    className="w-full resize-y rounded-md border border-sage/30 bg-ivory px-3 py-2 text-sm leading-6 text-charcoal outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                  />
                </label>

                <label className="block min-w-0 sm:col-span-2" htmlFor={`service-card-${index}-icon`}>
                  <span className="mb-1.5 block text-xs font-semibold text-charcoal">Icon path</span>
                  <input
                    id={`service-card-${index}-icon`}
                    name={`service-card-${index}-icon`}
                    autoComplete="off"
                    spellCheck={false}
                    value={card.icon}
                    onChange={(e) => updateCard(index, { icon: e.target.value })}
                    className="min-h-11 w-full rounded-md border border-sage/30 bg-ivory px-3 font-mono text-xs text-charcoal outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                  />
                  <span className="mt-1.5 block break-all text-xs text-dune/50">
                    Destination slug: <code className="font-mono text-dune/70">{card.slug || 'Not assigned'}</code>
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-2 border-t border-sage/15 bg-ivory/55 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <button
                  type="button"
                  onClick={() => updateCard(index, { enabled: !card.enabled })}
                  aria-label={`${card.enabled ? 'Hide' : 'Show'} ${card.title || `service card ${index + 1}`} on the homepage`}
                  aria-pressed={card.enabled}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-sage/25 bg-white px-3 text-sm font-semibold text-charcoal hover:border-sage/45 sm:w-auto"
                >
                  {card.enabled ? <Eye className="size-4 text-terracotta" aria-hidden="true" /> : <EyeOff className="size-4 text-dune/55" aria-hidden="true" />}
                  {card.enabled ? 'Visible on homepage' : 'Hidden from homepage'}
                </button>

                <button
                  type="button"
                  onClick={() => setPendingRemovalId(card.id)}
                  aria-label={`Remove ${card.title || `service card ${index + 1}`}`}
                  aria-expanded={pendingRemovalId === card.id}
                  aria-controls={`remove-service-card-confirmation-${index}`}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-terracotta hover:bg-terracotta/10 sm:w-auto"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove card
                </button>
              </div>

              {pendingRemovalId === card.id && (
                <div
                  id={`remove-service-card-confirmation-${index}`}
                  className="border-t border-terracotta/25 bg-terracotta/10 p-4"
                  role="region"
                  aria-live="polite"
                  aria-labelledby={`remove-service-card-${index}`}
                >
                  <h3 id={`remove-service-card-${index}`} className="text-sm font-semibold text-charcoal">
                    Remove {card.title.trim() || `service card ${index + 1}`}?
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-dune/70">The card leaves this draft now. The homepage changes only after you save.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setPendingRemovalId(null)}
                      className="inline-flex min-h-11 items-center justify-center rounded-md border border-sage/30 bg-white px-3 text-sm font-semibold text-charcoal"
                    >
                      Keep card
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCard(card.id)}
                      className="inline-flex min-h-11 items-center justify-center rounded-md bg-terracotta px-3 text-sm font-semibold text-cream"
                    >
                      Confirm remove
                    </button>
                  </div>
                </div>
              )}
            </article>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-col gap-2 border-t border-sage/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={addCard} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-sage/30 bg-white px-4 text-sm font-semibold text-charcoal hover:border-sage/50 sm:w-auto">
          <Plus className="size-4" aria-hidden="true" /> Add service card
        </button>
        <a href="https://lashpop.vercel.app/#services" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-1 text-sm font-semibold text-dune/65 hover:text-charcoal sm:w-auto">
          Preview homepage <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
