'use client'

import { useState } from 'react'
import { FileText, Save, Check, AlertCircle, Plus, X, MoveUp, MoveDown } from 'lucide-react'
import type { FounderLetterContent } from '@/types/founder-letter'

interface FounderLetterEditorProps {
  initialContent: FounderLetterContent
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function FounderLetterEditor({ initialContent }: FounderLetterEditorProps) {
  const [content, setContent] = useState<FounderLetterContent>(initialContent)
  const [savedState, setSavedState] = useState<FounderLetterContent>(initialContent)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isDirty = JSON.stringify(content) !== JSON.stringify(savedState)

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/website/founder-letter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? `Save failed (${res.status})`)
      }
      const data = await res.json()
      setSavedState(data.content)
      setContent(data.content)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  function updateParagraph(i: number, value: string) {
    setContent({
      ...content,
      paragraphs: content.paragraphs.map((p, idx) => (idx === i ? value : p)),
    })
  }

  function addParagraph() {
    setContent({ ...content, paragraphs: [...content.paragraphs, ''] })
  }

  function removeParagraph(i: number) {
    setContent({ ...content, paragraphs: content.paragraphs.filter((_, idx) => idx !== i) })
  }

  function moveParagraph(i: number, direction: 'up' | 'down') {
    const next = [...content.paragraphs]
    const target = direction === 'up' ? i - 1 : i + 1
    if (target < 0 || target >= next.length) return
    ;[next[i], next[target]] = [next[target], next[i]]
    setContent({ ...content, paragraphs: next })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-cream" />
            </div>
            <h1 className="font-serif text-2xl text-dune font-semibold">Founder Letter</h1>
          </div>
          <p className="text-sm text-dune/70 max-w-2xl leading-relaxed">
            The letter rendered on the homepage&apos;s founder section. Previously hardcoded
            in <span className="font-mono text-xs">FounderLetterSection.tsx</span>; now
            edited here.
          </p>
        </div>
        <SaveButton isDirty={isDirty} status={status} errorMsg={errorMsg} onSave={handleSave} />
      </div>

      {/* Editor */}
      <section className="bg-white/70 backdrop-blur-sm border border-sage/15 rounded-2xl p-6 shadow-sm space-y-5">
        <Field
          label="Heading"
          value={content.heading}
          onChange={v => setContent({ ...content, heading: v })}
          help='Section H2, e.g. "Welcome to LashPop Studios"'
        />
        <Field
          label="Greeting"
          value={content.greeting}
          onChange={v => setContent({ ...content, greeting: v })}
          help='Opening line, italic, e.g. "I&apos;m so glad you&apos;re here."'
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dune/70 uppercase tracking-wide">Paragraphs</span>
            <button
              type="button"
              onClick={addParagraph}
              className="inline-flex items-center gap-1.5 text-xs text-terracotta hover:text-terracotta/80"
            >
              <Plus className="w-3.5 h-3.5" />
              Add paragraph
            </button>
          </div>
          <div className="space-y-3">
            {content.paragraphs.map((p, i) => (
              <div key={i} className="relative group">
                <textarea
                  value={p}
                  onChange={e => updateParagraph(i, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-sage/25 bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 text-sm text-dune resize-y"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveParagraph(i, 'up')}
                    disabled={i === 0}
                    className="p-1 rounded bg-cream border border-sage/20 text-dune/60 hover:text-dune disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveParagraph(i, 'down')}
                    disabled={i === content.paragraphs.length - 1}
                    className="p-1 rounded bg-cream border border-sage/20 text-dune/60 hover:text-dune disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <MoveDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeParagraph(i)}
                    disabled={content.paragraphs.length === 1}
                    className="p-1 rounded bg-cream border border-sage/20 text-red-700/70 hover:text-red-700 disabled:opacity-30"
                    aria-label="Delete paragraph"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Sign-off"
            value={content.signOff}
            onChange={v => setContent({ ...content, signOff: v })}
            help='e.g. "Xo,"'
          />
          <Field
            label="Signature"
            value={content.signature}
            onChange={v => setContent({ ...content, signature: v })}
            help='Name printed below the sign-off'
          />
        </div>
      </section>

      {/* Preview */}
      <section className="bg-white/70 backdrop-blur-sm border border-sage/15 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-medium text-dune/70 uppercase tracking-wide mb-4">Preview</h2>
        <div className="space-y-3 italic text-charcoal">
          <h3 className="text-2xl font-serif not-italic text-dune">{content.heading}</h3>
          <p>{content.greeting}</p>
          {content.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="not-italic">
            {content.signOff} <span className="font-serif text-lg">{content.signature}</span>
          </p>
        </div>
      </section>

      {/* Sticky save bar */}
      {(isDirty || status === 'saved' || status === 'error') && (
        <div className="sticky bottom-4 z-30 flex justify-end">
          <div className="bg-cream/95 backdrop-blur-xl border border-sage/20 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
            {status === 'error' && (
              <span className="text-sm text-red-700 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errorMsg ?? 'Save failed'}
              </span>
            )}
            {isDirty && status !== 'saving' && (
              <span className="text-xs text-dune/60">Unsaved changes</span>
            )}
            <SaveButton isDirty={isDirty} status={status} errorMsg={errorMsg} onSave={handleSave} />
          </div>
        </div>
      )}
    </div>
  )
}

function SaveButton({
  isDirty,
  status,
  errorMsg: _errorMsg,
  onSave,
}: {
  isDirty: boolean
  status: SaveStatus
  errorMsg: string | null
  onSave: () => void
}) {
  const disabled = (!isDirty && status !== 'error') || status === 'saving'
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'Saved'
        : status === 'error'
          ? 'Retry'
          : 'Save'
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        status === 'saved'
          ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
          : 'bg-terracotta text-cream hover:bg-terracotta/90 disabled:opacity-40 disabled:cursor-not-allowed'
      }`}
    >
      {status === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {label}
    </button>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  help?: string
}

function Field({ label, value, onChange, help }: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-dune/70 uppercase tracking-wide mb-1.5 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-sage/25 bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 text-sm text-dune"
      />
      {help && <span className="block text-xs text-dune/50 mt-1">{help}</span>}
    </label>
  )
}
