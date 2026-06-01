"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw, Save, Check, ChevronUp, ChevronDown, Eye, EyeOff, Plus, Trash2, ExternalLink } from 'lucide-react'
import type { HomepageServiceCard, HomepageServicesContent } from '@/types/homepage-services'

export default function HomepageServicesAdminPage() {
  const [cards, setCards] = useState<HomepageServiceCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/website/homepage-services')
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      const data: { content: HomepageServicesContent } = await res.json()
      setCards(data.content.cards)
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

  const removeCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/website/homepage-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Save failed (${res.status})`)
      }
      const data: { content: HomepageServicesContent } = await res.json()
      setCards(data.content.cards)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-dune/50">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
        Loading homepage cards…
      </div>
    )
  }

  const enabledCount = cards.filter((c) => c.enabled).length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dusty-rose/30 to-dusty-rose/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-dusty-rose" />
          </div>
          <div>
            <h1 className="h2 text-dune">Homepage Service Cards</h1>
            <p className="text-sm text-dune/60">{enabledCount} of {cards.length} shown in the &quot;Choose a Service&quot; section</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <button onClick={save} disabled={saving} className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'}`}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      <div className="mb-6 p-4 bg-dusty-rose/10 rounded-2xl border border-dusty-rose/20 text-sm text-dune/70">
        These cards are the marketing tiles in the homepage <strong>Choose a Service</strong> section. They are separate from the Vagaro
        booking catalog. The <code className="text-xs">slug</code> controls where a card links (e.g. <code className="text-xs">injectables</code> opens
        Naturtox, <code className="text-xs">lash-lifts</code> opens the lashes booking drawer) — leave it unchanged unless you know the behavior you want.
      </div>

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div key={card.id} className={`glass rounded-2xl border p-4 ${card.enabled ? 'border-sage/20' : 'border-dune/10 opacity-70'}`}>
            <div className="flex gap-4">
              {/* Icon preview */}
              <div className="flex-shrink-0 w-16 flex flex-col items-center gap-2">
                <div className="relative w-14 h-14 rounded-xl bg-white/60 border border-warm-sand/30 flex items-center justify-center overflow-hidden">
                  {card.icon ? (
                    <Image src={card.icon} alt="" fill className="object-contain p-2" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-dune/30" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => move(index, -1)} disabled={index === 0} className="text-dune/40 hover:text-dune disabled:opacity-20" aria-label="Move up">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(index, 1)} disabled={index === cards.length - 1} className="text-dune/40 hover:text-dune disabled:opacity-20" aria-label="Move down">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={card.title}
                    onChange={(e) => updateCard(index, { title: e.target.value })}
                    placeholder="TITLE"
                    className="flex-1 px-3 py-2 rounded-lg border border-warm-sand/40 bg-white/70 text-sm font-display tracking-wide text-dune"
                  />
                  <button
                    onClick={() => updateCard(index, { enabled: !card.enabled })}
                    className="p-2 rounded-lg border border-warm-sand/40 bg-white/60 text-dune/60 hover:text-dune"
                    title={card.enabled ? 'Visible — click to hide' : 'Hidden — click to show'}
                  >
                    {card.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => removeCard(index)}
                    className="p-2 rounded-lg border border-warm-sand/40 bg-white/60 text-dune/40 hover:text-red-600"
                    title="Remove card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={card.tagline}
                  onChange={(e) => updateCard(index, { tagline: e.target.value })}
                  placeholder="Tagline (e.g. Wake up ready.)"
                  className="w-full px-3 py-2 rounded-lg border border-warm-sand/40 bg-white/70 text-sm text-dune"
                />
                <textarea
                  value={card.description}
                  onChange={(e) => updateCard(index, { description: e.target.value })}
                  placeholder="Description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-warm-sand/40 bg-white/70 text-sm text-dune resize-y"
                />
                <div className="flex items-center gap-2">
                  <input
                    value={card.icon}
                    onChange={(e) => updateCard(index, { icon: e.target.value })}
                    placeholder="/lashpop-images/services/thin/...-icon.svg"
                    className="flex-1 px-3 py-2 rounded-lg border border-warm-sand/40 bg-white/70 text-xs font-mono text-dune/70"
                  />
                  <span className="text-[11px] text-dune/40 whitespace-nowrap flex items-center gap-1">
                    slug: <code className="font-mono">{card.slug || '—'}</code>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={addCard} className="btn btn-secondary">
          <Plus className="w-4 h-4" /> Add Card
        </button>
        <a href="https://lashpop.vercel.app/#services" target="_blank" rel="noopener noreferrer" className="text-sm text-dune/50 hover:text-dune flex items-center gap-1">
          Preview on site <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
