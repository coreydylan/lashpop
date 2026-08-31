'use client'

import { useCallback, useState } from 'react'
import { FileText, Save, Check, AlertCircle, Plus, X, MoveUp, MoveDown, RefreshCw } from 'lucide-react'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'
import { websiteSettingStatusLabel } from '@/lib/admin/settings-copy'
import type { FounderLetterContent } from '@/types/founder-letter'

interface FounderLetterEditorProps {
  initialContent: FounderLetterContent
  initialVersion: number
  initialSourceOwner: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function FounderLetterEditor({ initialContent, initialVersion, initialSourceOwner }: FounderLetterEditorProps) {
  const [content, setContent] = useState<FounderLetterContent>(initialContent)
  const [savedState, setSavedState] = useState<FounderLetterContent>(initialContent)
  const [baseVersion, setBaseVersion] = useState(initialVersion)
  const [sourceOwner, setSourceOwner] = useState(initialSourceOwner)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)

  const isDirty = JSON.stringify(content) !== JSON.stringify(savedState)

  const save = useCallback(async () => {
    setStatus('saving')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/website/founder-letter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, baseVersion }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409 && data?.conflict) {
          setConflict(true)
          throw new Error('Someone saved a newer version while this page was open. Load the latest version to replace your unsaved changes.')
        }
        throw new Error(data?.error ?? 'Could not save the founder letter. Try again.')
      }
      setSavedState(data.content)
      setContent(data.content)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Could not save the founder letter. Try again.')
      setStatus('error')
      setErrorMsg(error.message)
      throw error
    }
  }, [baseVersion, content])

  async function reloadLatest() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/website/founder-letter')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Could not load the latest founder letter. Try again.')
      setContent(data.content)
      setSavedState(data.content)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Could not load the latest founder letter. Try again.')
    }
  }

  const discard = useCallback(() => {
    setContent(savedState)
    setStatus('idle')
    setErrorMsg(null)
    setConflict(false)
  }, [savedState])

  useDirtyBlock({
    id: 'founder-letter',
    label: 'Founder letter',
    dirty: isDirty,
    save,
    discard,
  })

  async function handleSave() {
    if (conflict) {
      await reloadLatest()
      return
    }
    await save().catch(() => undefined)
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
      <div className="grid gap-4 sm:flex sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-dusty-rose to-terracotta shadow-sm sm:flex">
              <FileText className="w-5 h-5 text-cream" />
            </div>
            <h1 className="font-serif text-2xl text-dune font-semibold">Founder letter</h1>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-dune/70">
            Update the welcome letter customers read in the homepage founder section.
          </p>
          <p className="mt-1 text-xs text-dune/50">
            {websiteSettingStatusLabel(sourceOwner, baseVersion)}
          </p>
        </div>
        <SaveButton isDirty={isDirty} status={status} conflict={conflict} onSave={handleSave} />
      </div>

      {status === 'error' && errorMsg ? (
        <div className="flex items-start gap-2 border-l-2 border-terracotta bg-terracotta/10 px-3 py-2 text-sm text-terracotta" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0">{errorMsg}</p>
        </div>
      ) : null}

      {/* Editor */}
      <section className="space-y-5 rounded-lg border border-sage/15 bg-white/70 p-4 shadow-sm sm:p-6">
        <Field
          label="Heading"
          value={content.heading}
          onChange={v => setContent({ ...content, heading: v })}
          help='Main heading for this section, for example “Welcome to LashPop Studios”.'
        />
        <Field
          label="Greeting"
          value={content.greeting}
          onChange={v => setContent({ ...content, greeting: v })}
          help='Opening line shown in italics, for example “I&apos;m so glad you&apos;re here.”'
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
              <div key={i} className="group">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor={`founder-paragraph-${i}`} className="text-xs font-medium text-dune/65">
                    Paragraph {i + 1}
                  </label>
                  <div className="grid grid-cols-3 gap-1 sm:flex">
                    <button
                      type="button"
                      onClick={() => moveParagraph(i, 'up')}
                      disabled={i === 0}
                      className="flex size-11 items-center justify-center rounded-md border border-sage/20 bg-cream text-dune/60 hover:text-dune disabled:opacity-30"
                      aria-label={`Move paragraph ${i + 1} up`}
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveParagraph(i, 'down')}
                      disabled={i === content.paragraphs.length - 1}
                      className="flex size-11 items-center justify-center rounded-md border border-sage/20 bg-cream text-dune/60 hover:text-dune disabled:opacity-30"
                      aria-label={`Move paragraph ${i + 1} down`}
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeParagraph(i)}
                      disabled={content.paragraphs.length === 1}
                      className="flex size-11 items-center justify-center rounded-md border border-sage/20 bg-cream text-red-700/70 hover:text-red-700 disabled:opacity-30"
                      aria-label={`Delete paragraph ${i + 1}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <textarea
                  id={`founder-paragraph-${i}`}
                  value={p}
                  onChange={e => updateParagraph(i, e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-sage/25 bg-white px-3 py-2 text-sm text-dune focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Sign-off"
            value={content.signOff}
            onChange={v => setContent({ ...content, signOff: v })}
            help='For example, “Xo,”'
          />
          <Field
            label="Signature"
            value={content.signature}
            onChange={v => setContent({ ...content, signature: v })}
            help='Alternative text for screen readers and search engines. The page shows a handwritten signature image.'
          />
        </div>
      </section>

      {/* Preview */}
      <section className="rounded-lg border border-sage/15 bg-white/70 p-4 shadow-sm sm:p-6">
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

    </div>
  )
}

function SaveButton({
  isDirty,
  status,
  conflict,
  onSave,
}: {
  isDirty: boolean
  status: SaveStatus
  conflict: boolean
  onSave: () => void
}) {
  const disabled = (!isDirty && status !== 'error') || status === 'saving'
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'Saved'
        : conflict
          ? 'Load latest'
        : status === 'error'
          ? 'Retry'
          : 'Save'
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={disabled}
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto ${
        status === 'saved'
          ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
          : 'bg-terracotta text-cream hover:bg-terracotta/90 disabled:opacity-40 disabled:cursor-not-allowed'
      }`}
    >
      {status === 'saved'
        ? <Check className="w-4 h-4" />
        : conflict
          ? <RefreshCw className="w-4 h-4" />
          : <Save className="w-4 h-4" />}
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
        className="w-full rounded-lg border border-sage/25 bg-white px-3 py-2 text-sm text-dune focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
      />
      {help && <span className="block text-xs text-dune/50 mt-1">{help}</span>}
    </label>
  )
}
