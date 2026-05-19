"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Save,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings as SettingsIcon,
  Play,
} from "lucide-react"

interface ReviewSettings {
  homepage_capacity: number
  editor_pass_interval_days: number
  auto_promote_min_quality_score: number
  auto_promote_min_text_length: number
  auto_promote_recency_months: number
  diversity_cap_per_source: number
  diversity_cap_per_stylist: number
  highlights_per_stylist: number
  editor_pass_enabled: boolean
  recency_decay_days_per_point: number
}

interface FieldDef {
  key: keyof ReviewSettings
  label: string
  description: string
  kind: "int" | "bool"
  min?: number
  max?: number
  step?: number
}

const FIELDS: FieldDef[] = [
  {
    key: "homepage_capacity",
    label: "Homepage carousel size",
    description: "Total reviews shown on the homepage. Admin pins + auto-rotating slots combined.",
    kind: "int",
    min: 3,
    max: 20,
  },
  {
    key: "auto_promote_min_quality_score",
    label: "Min quality score for auto-promote",
    description: "Reviews must score at least this to be eligible for the carousel. Unscored (null) reviews still qualify so fresh content can land.",
    kind: "int",
    min: 1,
    max: 10,
  },
  {
    key: "auto_promote_min_text_length",
    label: "Min review text length (chars)",
    description: "Filters out one-liners. 80 chars ≈ a couple of sentences.",
    kind: "int",
    min: 0,
    max: 500,
    step: 10,
  },
  {
    key: "auto_promote_recency_months",
    label: "Recency window (months)",
    description: "Reviews older than this can't be auto-promoted. Pinned reviews bypass this.",
    kind: "int",
    min: 1,
    max: 60,
  },
  {
    key: "recency_decay_days_per_point",
    label: "Recency decay (days per point)",
    description:
      "Newer reviews win unless older ones score meaningfully higher. Every N days of age subtract 1 point from a review's quality score for sort purposes. 180 = a 12-month-old 10/10 ties with a brand-new 8/10. Lower = sharper bias toward fresh.",
    kind: "int",
    min: 30,
    max: 9999,
    step: 30,
  },
  {
    key: "diversity_cap_per_source",
    label: "Max auto-picks per source",
    description: "Caps Google, Yelp, or Vagaro from dominating the carousel.",
    kind: "int",
    min: 1,
    max: 9,
  },
  {
    key: "diversity_cap_per_stylist",
    label: "Max auto-picks per stylist",
    description: "Caps any single stylist from monopolizing the carousel.",
    kind: "int",
    min: 1,
    max: 9,
  },
  {
    key: "highlights_per_stylist",
    label: "Highlights per stylist (profile pages)",
    description: "Number of curated reviews to show on each team member's profile.",
    kind: "int",
    min: 1,
    max: 10,
  },
  {
    key: "editor_pass_interval_days",
    label: "Editor pass interval (days)",
    description: "How often Claude re-scores reviews, re-checks ex-staff hides, and rebuilds highlight reels.",
    kind: "int",
    min: 1,
    max: 30,
  },
  {
    key: "editor_pass_enabled",
    label: "Editor pass enabled",
    description: "When off, the LLM editor never runs. Auto-promote still rotates fresh reviews; quality scores stay frozen.",
    kind: "bool",
  },
]

export default function ReviewSettingsPage() {
  const [settings, setSettings] = useState<ReviewSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [triggering, setTriggering] = useState(false)
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/website/review-settings")
      const data = await res.json()
      setSettings(data.settings as ReviewSettings)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/website/review-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSavedAt(Date.now())
      setTimeout(() => setSavedAt(null), 2200)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleTrigger() {
    setTriggering(true)
    setTriggerMessage(null)
    try {
      const res = await fetch("/api/admin/website/review-settings", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "trigger failed")
      setTriggerMessage(data.note ?? "Editor pass triggered.")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setTriggering(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex items-center gap-3 text-dune/60">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading settings…
      </div>
    )
  }
  if (!settings) {
    return (
      <div className="p-12 text-red-600">
        Failed to load. {error ? <>Reason: {error}</> : null}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 mb-8"
      >
        <SettingsIcon className="w-8 h-8 text-golden mt-1" />
        <div>
          <h1 className="text-3xl font-semibold text-dune">Review pipeline</h1>
          <p className="text-sm text-dune/60 mt-1 max-w-xl">
            Controls how reviews flow into the homepage carousel and the per-stylist
            highlight reels. Saved values take effect on the next Worker tick (every 6h).
          </p>
        </div>
      </motion.header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <section className="space-y-6">
        {FIELDS.map(f => (
          <div key={f.key} className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4 items-start">
            <div>
              <label htmlFor={`field-${f.key}`} className="block text-sm font-medium text-dune">
                {f.label}
              </label>
              <p className="text-xs text-dune/60 mt-1">{f.description}</p>
            </div>
            <div className="flex justify-end">
              {f.kind === "int" ? (
                <input
                  id={`field-${f.key}`}
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
                  value={settings[f.key] as number}
                  onChange={e =>
                    setSettings({ ...settings, [f.key]: Number(e.target.value) })
                  }
                  className="w-32 px-3 py-2 border border-sage/40 rounded-lg text-right focus:outline-none focus:border-golden"
                />
              ) : (
                <label className="inline-flex items-center cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    checked={settings[f.key] as boolean}
                    onChange={e =>
                      setSettings({ ...settings, [f.key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-golden focus:ring-golden"
                  />
                  <span className="text-sm text-dune">{settings[f.key] ? "On" : "Off"}</span>
                </label>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3 items-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-golden text-white rounded-lg font-medium hover:bg-golden/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save settings
        </button>

        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-sage/50 text-dune rounded-lg hover:bg-sage/10 disabled:opacity-60"
        >
          {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Trigger editor pass now
        </button>

        {savedAt && (
          <span className="inline-flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
        {triggerMessage && (
          <span className="text-sm text-dune/70 flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-dune/40" />
            {triggerMessage}
          </span>
        )}
      </div>
    </div>
  )
}
