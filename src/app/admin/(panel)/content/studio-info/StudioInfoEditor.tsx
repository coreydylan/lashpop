'use client'

import { useState } from 'react'
import { Building2, Save, Check, AlertCircle, Phone, Mail, MapPin, Clock, Calendar, ExternalLink } from 'lucide-react'
import type { StudioSettings } from '@/types/studio'

interface StudioInfoEditorProps {
  initialSettings: StudioSettings
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function StudioInfoEditor({ initialSettings }: StudioInfoEditorProps) {
  const [s, setS] = useState<StudioSettings>(initialSettings)
  const [savedState, setSavedState] = useState<StudioSettings>(initialSettings)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isDirty = JSON.stringify(s) !== JSON.stringify(savedState)

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/website/studio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? `Save failed (${res.status})`)
      }
      const data = await res.json()
      setSavedState(data.settings)
      setS(data.settings)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="space-y-8">
      <Header isDirty={isDirty} status={status} errorMsg={errorMsg} onSave={handleSave} />

      <Section
        icon={Building2}
        title="Identity"
        description="Used in the site header, footer, schema.org markup, and llms.txt."
      >
        <Field label="Business name" value={s.name} onChange={v => setS({ ...s, name: v })} />
        <Field
          label="Tagline"
          value={s.tagline}
          onChange={v => setS({ ...s, tagline: v })}
          help="Short phrase under the brand name in the footer."
        />
      </Section>

      <Section icon={MapPin} title="Address & Map" description="Drives the footer, map section, and LocalBusiness schema.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Street" value={s.address.street} onChange={v => setS({ ...s, address: { ...s.address, street: v } })} />
          <Field label="City" value={s.address.city} onChange={v => setS({ ...s, address: { ...s.address, city: v } })} />
          <Field label="State" value={s.address.state} onChange={v => setS({ ...s, address: { ...s.address, state: v } })} />
          <Field label="ZIP" value={s.address.zip} onChange={v => setS({ ...s, address: { ...s.address, zip: v } })} />
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

      <Section icon={Phone} title="Contact" description="Used by every tel:/mailto: link and the contact card in the footer.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Phone (display)"
            value={s.phone}
            onChange={v => setS({ ...s, phone: v })}
            help="As shown to the user, e.g. (760) 212-0448"
            icon={Phone}
          />
          <Field
            label="Phone (E.164)"
            value={s.phoneE164}
            onChange={v => setS({ ...s, phoneE164: v })}
            help="For tel:/sms: links, e.g. +17602120448"
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
            label="Inbound email"
            value={s.inboundEmail}
            onChange={v => setS({ ...s, inboundEmail: v })}
            help="Where work-with-us applications + newsletter signups get forwarded."
            type="email"
            className="sm:col-span-2"
          />
        </div>
      </Section>

      <Section icon={Clock} title="Hours" description="Displayed in the footer and used in LocalBusiness schema.">
        <Field
          label="Hours (short)"
          value={s.hoursShort}
          onChange={v => setS({ ...s, hoursShort: v })}
          help="One-line summary, e.g. “8a–7:30p every day, by appointment only”."
        />
      </Section>

      <Section icon={Calendar} title="Booking" description="Vagaro booking URL used by every booking CTA on the site.">
        <Field
          label="Vagaro booking URL"
          value={s.vagaroBookingUrl}
          onChange={v => setS({ ...s, vagaroBookingUrl: v })}
          icon={ExternalLink}
          help="e.g. https://www.vagaro.com/lashpop32"
        />
      </Section>

      <Section icon={ExternalLink} title="Social profiles" description="Shown in footer + reviews carousel + LocalBusiness sameAs.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Instagram" value={s.social.instagram ?? ''} onChange={v => setS({ ...s, social: { ...s.social, instagram: v } })} />
          <Field label="Facebook" value={s.social.facebook ?? ''} onChange={v => setS({ ...s, social: { ...s.social, facebook: v } })} />
          <Field label="TikTok" value={s.social.tiktok ?? ''} onChange={v => setS({ ...s, social: { ...s.social, tiktok: v } })} />
          <Field label="Yelp" value={s.social.yelp ?? ''} onChange={v => setS({ ...s, social: { ...s.social, yelp: v } })} />
          <Field label="Google Maps" value={s.social.google ?? ''} onChange={v => setS({ ...s, social: { ...s.social, google: v } })} />
          <Field label="Pinterest" value={s.social.pinterest ?? ''} onChange={v => setS({ ...s, social: { ...s.social, pinterest: v } })} />
          <Field label="Twitter/X" value={s.social.twitter ?? ''} onChange={v => setS({ ...s, social: { ...s.social, twitter: v } })} />
        </div>
      </Section>

      <StickySaveBar isDirty={isDirty} status={status} errorMsg={errorMsg} onSave={handleSave} />
    </div>
  )
}

function Header({
  isDirty,
  status,
  errorMsg,
  onSave,
}: {
  isDirty: boolean
  status: SaveStatus
  errorMsg: string | null
  onSave: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-6 flex-wrap">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-cream" />
          </div>
          <h1 className="font-serif text-2xl text-dune font-semibold">Studio Info</h1>
        </div>
        <p className="text-sm text-dune/70 max-w-2xl leading-relaxed">
          One source of truth for the studio&apos;s identity. Changes here propagate to every
          place the site renders the name, address, phone, email, hours, social URLs, or
          Vagaro booking link. Replaces ~30 hardcoded values across the codebase.
        </p>
      </div>
      <SaveButton isDirty={isDirty} status={status} errorMsg={errorMsg} onSave={onSave} />
    </div>
  )
}

function StickySaveBar({
  isDirty,
  status,
  errorMsg,
  onSave,
}: {
  isDirty: boolean
  status: SaveStatus
  errorMsg: string | null
  onSave: () => void
}) {
  if (!isDirty && status !== 'saved' && status !== 'error') return null
  return (
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
        <SaveButton isDirty={isDirty} status={status} errorMsg={errorMsg} onSave={onSave} />
      </div>
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
  type?: string
  step?: string
  help?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

function Field({ label, value, onChange, type = 'text', step, help, icon: Icon, className }: FieldProps) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="text-xs font-medium text-dune/70 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-sage/25 bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 text-sm text-dune placeholder:text-dune/40"
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
    <section className="bg-white/70 backdrop-blur-sm border border-sage/15 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-dusty-rose/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-terracotta" />
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
