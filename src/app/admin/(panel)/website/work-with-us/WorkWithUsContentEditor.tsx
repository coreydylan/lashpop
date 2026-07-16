'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, Save } from 'lucide-react'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'
import {
  DEFAULT_WORK_WITH_US_CONTENT,
  type WorkWithUsContent,
  type WorkWithUsPathCardContent,
} from '@/types/work-with-us-content'

type Status = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

export function WorkWithUsContentEditor() {
  const [content, setContent] = useState<WorkWithUsContent>(DEFAULT_WORK_WITH_US_CONTENT)
  const [savedContent, setSavedContent] = useState<WorkWithUsContent>(DEFAULT_WORK_WITH_US_CONTENT)
  const [version, setVersion] = useState(0)
  const [sourceOwner, setSourceOwner] = useState('system')
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setMessage('')
    const response = await fetch('/api/admin/website/work-with-us-content', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error ?? 'Could not load careers content')
    setContent(data.content)
    setSavedContent(data.content)
    setVersion(data.version ?? 0)
    setSourceOwner(data.sourceOwner ?? 'system')
    setStatus('idle')
  }, [])

  useEffect(() => {
    load().catch((error) => {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Could not load careers content')
    })
  }, [load])

  const save = useCallback(async () => {
    setStatus('saving')
    setMessage('')
    const response = await fetch('/api/admin/website/work-with-us-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, baseVersion: version }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const conflictMessage = response.status === 409
        ? 'Another admin published this section after you opened it. Reload before publishing your draft.'
        : data.error ?? 'Could not publish careers content'
      setStatus('error')
      setMessage(conflictMessage)
      throw new Error(conflictMessage)
    }
    setContent(data.content)
    setSavedContent(data.content)
    setVersion(data.version)
    setSourceOwner(data.sourceOwner)
    setStatus('saved')
    setMessage('Careers content is live.')
    window.setTimeout(() => setStatus('idle'), 2200)
  }, [content, version])

  const discard = useCallback(() => {
    setContent(savedContent)
    setStatus('idle')
    setMessage('Draft discarded.')
  }, [savedContent])

  const dirty = JSON.stringify(content) !== JSON.stringify(savedContent)
  useDirtyBlock({
    id: 'work-with-us-content',
    label: 'Work With Us content',
    dirty,
    save,
    discard,
  })

  const updateCard = (key: 'employee' | 'booth' | 'training', patch: Partial<WorkWithUsPathCardContent>) => {
    setContent((current) => ({ ...current, [key]: { ...current[key], ...patch } }))
  }

  if (status === 'loading') {
    return <div className="mb-8 h-40 animate-pulse rounded-2xl border border-[#ddd1ca] bg-white" aria-label="Loading careers content" />
  }

  return (
    <section className="mb-8 rounded-2xl border border-[#d9cec7] bg-white p-5 md:p-6" aria-labelledby="careers-content-title">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h2 id="careers-content-title" className="font-serif text-2xl text-[#2d2926]">Careers page content</h2>
            <span className="rounded-full border border-[#d9cec7] bg-[#fbf7f4] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#6d625c]">
              {sourceOwner}
            </span>
          </div>
          <p className="max-w-2xl text-sm text-[#6d625c]">
            These headings and path summaries publish directly to the Work With Us page. Benefits, pricing logic, forms, and photography remain system-owned.
          </p>
        </div>
        <button
          type="button"
          onClick={() => save().catch(() => undefined)}
          disabled={!dirty || status === 'saving'}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b5563d] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : status === 'saved' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {status === 'saving' ? 'Publishing…' : 'Publish content'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-[#eee5df] bg-[#fbf7f4] p-4 md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7d75]">Page introduction</p>
          <Field label="Eyebrow" value={content.heroEyebrow} onChange={(heroEyebrow) => setContent({ ...content, heroEyebrow })} />
          <Field label="Headline" value={content.heroTitle} onChange={(heroTitle) => setContent({ ...content, heroTitle })} />
          <Field label="Description" multiline value={content.heroDescription} onChange={(heroDescription) => setContent({ ...content, heroDescription })} />
        </div>
        {(['employee', 'booth', 'training'] as const).map((key) => (
          <div key={key} className="space-y-4 rounded-xl border border-[#eee5df] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7d75]">{key} path</p>
            <Field label="Title" value={content[key].title} onChange={(title) => updateCard(key, { title })} />
            <Field label="Summary" multiline value={content[key].description} onChange={(description) => updateCard(key, { description })} />
          </div>
        ))}
      </div>

      <div className="mt-4 min-h-5 text-sm" role="status" aria-live="polite">
        {message && <p className={status === 'error' ? 'text-[#a43f2b]' : 'text-[#557064]'}>{message}</p>}
      </div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  const classes = 'mt-1 w-full rounded-lg border border-[#d9cec7] bg-white px-3 py-2.5 text-sm text-[#2d2926] outline-none focus:border-[#b5563d] focus:ring-2 focus:ring-[#b5563d]/15'
  return (
    <label className="block text-xs font-medium text-[#5f554f]">
      {label}
      {multiline ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={classes} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={classes} />
      )}
    </label>
  )
}
