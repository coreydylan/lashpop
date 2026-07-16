'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, Save } from 'lucide-react'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'
import { DEFAULT_HERO_CONTENT, type HeroContent } from '@/types/hero-content'

type Status = 'loading' | 'idle' | 'saving' | 'saved' | 'error'

export function HeroContentEditor() {
  const [content, setContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT)
  const [savedContent, setSavedContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT)
  const [version, setVersion] = useState(0)
  const [sourceOwner, setSourceOwner] = useState('system')
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/admin/website/hero-content', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error ?? 'Could not load hero content')
        if (!active) return
        setContent(data.content)
        setSavedContent(data.content)
        setVersion(data.version ?? 0)
        setSourceOwner(data.sourceOwner ?? 'system')
        setStatus('idle')
      })
      .catch((error) => {
        if (!active) return
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Could not load hero content')
      })
    return () => { active = false }
  }, [])

  const save = useCallback(async () => {
    setStatus('saving')
    setMessage('')
    const response = await fetch('/api/admin/website/hero-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, baseVersion: version }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = response.status === 409
        ? 'Another admin published hero content after you opened this page. Reload before publishing your draft.'
        : data.error ?? 'Could not publish hero content'
      setStatus('error')
      setMessage(error)
      throw new Error(error)
    }
    setContent(data.content)
    setSavedContent(data.content)
    setVersion(data.version)
    setSourceOwner(data.sourceOwner)
    setStatus('saved')
    setMessage('Hero content is live.')
    window.setTimeout(() => setStatus('idle'), 2200)
  }, [content, version])

  const discard = useCallback(() => {
    setContent(savedContent)
    setStatus('idle')
    setMessage('Draft discarded.')
  }, [savedContent])

  const dirty = JSON.stringify(content) !== JSON.stringify(savedContent)
  useDirtyBlock({ id: 'hero-content', label: 'Hero content', dirty, save, discard })

  if (status === 'loading') {
    return <div className="mb-8 h-32 animate-pulse rounded-2xl border border-[#ddd1ca] bg-white" aria-label="Loading hero content" />
  }

  const fields: Array<{ key: keyof HeroContent; label: string; help: string }> = [
    { key: 'heading', label: 'Headline', help: 'Primary mobile and desktop heading' },
    { key: 'subheading', label: 'Subheading', help: 'Outlined line below the headline' },
    { key: 'primaryCta', label: 'Booking button', help: 'Scrolls to services' },
    { key: 'quizCta', label: 'Quiz button', help: 'Opens the lash quiz' },
    { key: 'careersCta', label: 'Careers button', help: 'Mobile link to Work With Us' },
    { key: 'reviewsLabel', label: 'Reviews label', help: 'Text beside the review count' },
  ]

  return (
    <section className="mb-8 rounded-2xl border border-[#d9cec7] bg-white p-5 md:p-6" aria-labelledby="hero-content-heading">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h2 id="hero-content-heading" className="font-serif text-2xl text-[#2d2926]">Hero words and actions</h2>
            <span className="rounded-full border border-[#d9cec7] bg-[#fbf7f4] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#6d625c]">{sourceOwner}</span>
          </div>
          <p className="text-sm text-[#6d625c]">Publishes the above-the-fold copy on mobile and desktop. Image and slideshow controls remain below.</p>
        </div>
        <button
          type="button"
          onClick={() => save().catch(() => undefined)}
          disabled={!dirty || status === 'saving'}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b5563d] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : status === 'saved' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {status === 'saving' ? 'Publishing…' : 'Publish copy'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <label key={field.key} className="block text-xs font-medium text-[#5f554f]">
            {field.label}
            <input
              value={content[field.key]}
              onChange={(event) => setContent((current) => ({ ...current, [field.key]: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-[#d9cec7] bg-white px-3 py-2.5 text-sm text-[#2d2926] outline-none focus:border-[#b5563d] focus:ring-2 focus:ring-[#b5563d]/15"
            />
            <span className="mt-1 block font-normal text-[#8b7d75]">{field.help}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 min-h-5 text-sm" role="status" aria-live="polite">
        {message && <p className={status === 'error' ? 'text-[#a43f2b]' : 'text-[#557064]'}>{message}</p>}
      </div>
    </section>
  )
}
