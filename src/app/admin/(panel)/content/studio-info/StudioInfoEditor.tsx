'use client'

import { useCallback, useState } from 'react'
import { Building2, Save, Check, AlertCircle, Phone, Mail, MapPin, Clock, Calendar, ExternalLink, RefreshCw } from 'lucide-react'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'
import { websiteSettingStatusLabel } from '@/lib/admin/settings-copy'
import type { StudioSettings } from '@/types/studio'

interface StudioInfoEditorProps {
  initialSettings: StudioSettings
  initialVersion: number
  initialSourceOwner: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function StudioInfoEditor({ initialSettings, initialVersion, initialSourceOwner }: StudioInfoEditorProps) {
  const [s, setS] = useState<StudioSettings>(initialSettings)
  const [savedState, setSavedState] = useState<StudioSettings>(initialSettings)
  const [baseVersion, setBaseVersion] = useState(initialVersion)
  const [sourceOwner, setSourceOwner] = useState(initialSourceOwner)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)

  const isDirty = JSON.stringify(s) !== JSON.stringify(savedState)

  const save = useCallback(async () => {
    setStatus('saving')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/website/studio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s, baseVersion }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 409 && data?.conflict) {
          setConflict(true)
          throw new Error('Someone saved a newer version while this page was open. Load the latest version to replace your unsaved changes.')
        }
        throw new Error(data?.error ?? 'Could not save the studio information. Try again.')
      }
      setSavedState(data.settings)
      setS(data.settings)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Could not save the studio information. Try again.')
      setStatus('error')
      setErrorMsg(error.message)
      throw error
    }
  }, [baseVersion, s])

  async function reloadLatest() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/website/studio')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Could not load the latest studio information. Try again.')
      setS(data.settings)
      setSavedState(data.settings)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Could not load the latest studio information. Try again.')
    }
  }

  const discard = useCallback(() => {
    setS(savedState)
    setStatus('idle')
    setErrorMsg(null)
    setConflict(false)
  }, [savedState])

  useDirtyBlock({
    id: 'studio-info',
    label: 'Studio information',
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

  return (
    <div className="min-w-0 space-y-5 sm:space-y-8">
      <Header
        isDirty={isDirty}
        status={status}
        conflict={conflict}
        version={baseVersion}
        sourceOwner={sourceOwner}
        onSave={handleSave}
      />

      {status === 'error' && errorMsg ? (
        <div className="flex items-start gap-2 border-l-2 border-terracotta bg-terracotta/10 px-3 py-2 text-sm text-terracotta" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0">{errorMsg}</p>
        </div>
      ) : null}

      <Section
        icon={Building2}
        title="Identity"
        description="The business name and tagline shown across the website."
      >
        <Field label="Business name" value={s.name} onChange={v => setS({ ...s, name: v })} />
        <Field
          label="Tagline"
          value={s.tagline}
          onChange={v => setS({ ...s, tagline: v })}
          help="Short phrase under the brand name in the footer."
        />
      </Section>

      <Section icon={MapPin} title="Address and map" description="The studio address and map location shown to customers.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Street" value={s.address.street} onChange={v => setS({ ...s, address: { ...s.address, street: v } })} />
          <Field label="City" value={s.address.city} onChange={v => setS({ ...s, address: { ...s.address, city: v } })} />
          <Field label="State" value={s.address.state} onChange={v => setS({ ...s, address: { ...s.address, state: v } })} />
          <Field label="ZIP code" value={s.address.zip} onChange={v => setS({ ...s, address: { ...s.address, zip: v } })} />
          <Field
            label="Latitude"
            value={String(s.coordinates.lat)}
            onChange={v => setS({ ...s, coordinates: { ...s.coordinates, lat: Number(v) || 0 } })}
            type="number"
            step="0.0001"
          />
          <Field
            label="Longitude"
            value={String(s.coordinates.lng)}
            onChange={v => setS({ ...s, coordinates: { ...s.coordinates, lng: Number(v) || 0 } })}
            type="number"
            step="0.0001"
          />
        </div>
      </Section>

      <Section icon={Phone} title="Contact" description="Public contact details and the reserved notification address.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Phone shown on website"
            value={s.phone}
            onChange={v => setS({ ...s, phone: v })}
            help="As shown to customers, for example (760) 212-0448."
            icon={Phone}
          />
          <Field
            label="Phone for links"
            value={s.phoneE164}
            onChange={v => setS({ ...s, phoneE164: v })}
            help="Include the country code and numbers only, for example +17602120448."
          />
          <Field
            label="Public email"
            value={s.email}
            onChange={v => setS({ ...s, email: v })}
            icon={Mail}
            type="email"
            className="sm:col-span-2"
          />
          <Field
            label="Notification email"
            value={s.inboundEmail}
            onChange={v => setS({ ...s, inboundEmail: v })}
            help="Reserved for future Admin notifications. Applications and signups are stored in Inbox."
            type="email"
            className="sm:col-span-2"
          />
        </div>
      </Section>

      <Section icon={Clock} title="Opening hours" description="The short hours summary shown to customers.">
        <Field
          label="Hours summary"
          value={s.hoursShort}
          onChange={v => setS({ ...s, hoursShort: v })}
          help="One-line summary, e.g. “8a–7:30p every day, by appointment only”."
        />
      </Section>

      <Section icon={Calendar} title="Booking" description="Booking buttons open this Vagaro page.">
        <Field
          label="Vagaro booking URL"
          value={s.vagaroBookingUrl}
          onChange={v => setS({ ...s, vagaroBookingUrl: v })}
          icon={ExternalLink}
          help="e.g. https://www.vagaro.com/lashpop32"
        />
      </Section>

      <Section icon={ExternalLink} title="Social profiles" description="Public profile links shown across the website.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Instagram" value={s.social.instagram ?? ''} onChange={v => setS({ ...s, social: { ...s.social, instagram: v } })} />
          <Field label="Facebook" value={s.social.facebook ?? ''} onChange={v => setS({ ...s, social: { ...s.social, facebook: v } })} />
          <Field label="TikTok" value={s.social.tiktok ?? ''} onChange={v => setS({ ...s, social: { ...s.social, tiktok: v } })} />
          <Field label="Yelp" value={s.social.yelp ?? ''} onChange={v => setS({ ...s, social: { ...s.social, yelp: v } })} />
          <Field label="Google Maps" value={s.social.google ?? ''} onChange={v => setS({ ...s, social: { ...s.social, google: v } })} />
          <Field label="Pinterest" value={s.social.pinterest ?? ''} onChange={v => setS({ ...s, social: { ...s.social, pinterest: v } })} />
          <Field label="Twitter/X" value={s.social.twitter ?? ''} onChange={v => setS({ ...s, social: { ...s.social, twitter: v } })} />
        </div>
      </Section>

    </div>
  )
}

function Header({
  isDirty,
  status,
  conflict,
  version,
  sourceOwner,
  onSave,
}: {
  isDirty: boolean
  status: SaveStatus
  conflict: boolean
  version: number
  sourceOwner: string
  onSave: () => void
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-dusty-rose to-terracotta shadow-sm md:rounded-xl">
            <Building2 className="size-5 text-cream" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-dune">Studio information</h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-dune/70">
          Edit the contact details, address, hours, booking link, and social profiles shown on the website.
        </p>
        <p className="mt-1 text-xs text-dune/50">
          {websiteSettingStatusLabel(sourceOwner, version)}
        </p>
      </div>
      <div className="w-full sm:w-auto">
        <SaveButton isDirty={isDirty} status={status} conflict={conflict} onSave={onSave} />
      </div>
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
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 sm:w-auto md:rounded-xl ${
        status === 'saved'
          ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
          : 'bg-terracotta text-cream hover:bg-terracotta/90 disabled:opacity-40 disabled:cursor-not-allowed'
      }`}
    >
      {status === 'saved'
        ? <Check className="size-4" aria-hidden="true" />
        : conflict
          ? <RefreshCw className="size-4" aria-hidden="true" />
          : <Save className="size-4" aria-hidden="true" />}
      {label}
    </button>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  step?: string
  help?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

function Field({ label, value, onChange, type = 'text', step, help, icon: Icon, className }: FieldProps) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dune/70">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-h-11 w-full min-w-0 rounded-lg border border-sage/25 bg-white px-3 py-2 text-sm text-dune placeholder:text-dune/40 focus-visible:border-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/20 md:rounded-xl"
      />
      {help && <span className="block text-xs text-dune/50 mt-1">{help}</span>}
    </label>
  )
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-sage/15 bg-white/70 p-4 shadow-sm backdrop-blur-sm md:rounded-2xl md:p-6">
      <div className="mb-4 flex items-start gap-3 md:mb-5">
        <div className="w-8 h-8 rounded-lg bg-dusty-rose/15 flex items-center justify-center flex-shrink-0">
          <Icon className="size-4 text-terracotta" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-serif text-lg text-dune font-medium leading-tight">{title}</h2>
          <p className="text-xs text-dune/60 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
