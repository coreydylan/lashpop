"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Palette,
  Search,
  Type,
  Image as ImageIcon,
  Save,
  Check,
  RefreshCw,
  ExternalLink,
  Globe
} from 'lucide-react'
import { BrandingSettings, SEOSettings } from '@/db/schema/site_settings'

export default function BrandingSEOEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'branding' | 'seo'>('branding')

  const [branding, setBranding] = useState<BrandingSettings>({
    companyName: 'LashPop Studios',
    tagline: 'Where artistry meets precision in every lash application.'
  })

  const [seo, setSEO] = useState<SEOSettings>({
    metaTitle: 'LashPop Studios | Premium Lash Extensions in Oceanside, CA',
    metaDescription: 'Experience exceptional lash extensions and beauty services at LashPop Studios in Oceanside, CA. Classic, volume, and hybrid lashes by expert artists.',
    keywords: ['lash extensions', 'oceanside', 'beauty salon', 'volume lashes', 'classic lashes']
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/website/site-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.branding) setBranding(data.branding)
        if (data.seo) setSEO(data.seo)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/website/site-settings/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding, seo })
      })

      if (response.ok) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 2000)
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateBranding = <K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) => {
    setBranding(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateSEO = <K extends keyof SEOSettings>(key: K, value: SEOSettings[K]) => {
    setSEO(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const tabs = [
    { id: 'branding' as const, label: 'Branding', icon: Palette },
    { id: 'seo' as const, label: 'SEO', icon: Search }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dusty-rose/30 to-terracotta/20 flex items-center justify-center">
              <Palette className="w-6 h-6 text-dusty-rose" />
            </div>
            <div>
              <h1 className="h2 text-dune">Branding & SEO</h1>
              <p className="text-sm text-dune/60">Company identity and search optimization</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`btn ${saved ? 'btn-secondary bg-dusty-rose/20 border-dusty-rose/30' : 'btn-primary'} ${!hasChanges && !saved ? 'opacity-50' : ''}`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'bg-cream/50 text-dune/60 border border-sage/10 hover:border-sage/20'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-3xl p-6 border border-sage/20"
      >
        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-dusty-rose" />
              <h3 className="font-serif text-lg text-dune">Company Identity</h3>
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                Company Name
              </label>
              <input
                type="text"
                value={branding.companyName}
                onChange={(e) => updateBranding('companyName', e.target.value)}
                placeholder="LashPop Studios"
                className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose transition-colors font-serif text-xl"
              />
              <p className="text-xs text-dune/40 mt-1">Displayed in the header, footer, and page titles</p>
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                Tagline
              </label>
              <textarea
                value={branding.tagline}
                onChange={(e) => updateBranding('tagline', e.target.value)}
                placeholder="Where artistry meets precision..."
                rows={2}
                className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose transition-colors resize-none"
              />
              <p className="text-xs text-dune/40 mt-1">Short description shown in the footer</p>
            </div>

            {/* Preview */}
            <div className="p-6 bg-dune/5 rounded-xl border border-dune/10">
              <p className="text-xs text-dune/50 uppercase tracking-wider mb-4">Preview</p>
              <div className="flex flex-col items-center text-center">
                <h2 className="font-serif text-2xl text-dune">{branding.companyName}</h2>
                <p className="text-sm text-dune/60 mt-2 max-w-md">{branding.tagline}</p>
              </div>
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-dusty-rose" />
              <h3 className="font-serif text-lg text-dune">Search Engine Optimization</h3>
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                Meta Title
              </label>
              <input
                type="text"
                value={seo.metaTitle}
                onChange={(e) => updateSEO('metaTitle', e.target.value)}
                placeholder="LashPop Studios | Premium Lash Extensions"
                className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose transition-colors"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-dune/40">Appears in browser tab and search results</p>
                <p className={`text-xs ${seo.metaTitle.length > 60 ? 'text-terracotta' : 'text-dune/40'}`}>
                  {seo.metaTitle.length}/60
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                Meta Description
              </label>
              <textarea
                value={seo.metaDescription}
                onChange={(e) => updateSEO('metaDescription', e.target.value)}
                placeholder="Experience exceptional lash extensions..."
                rows={3}
                className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose transition-colors resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-dune/40">Description shown in search results</p>
                <p className={`text-xs ${seo.metaDescription.length > 160 ? 'text-terracotta' : 'text-dune/40'}`}>
                  {seo.metaDescription.length}/160
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={seo.keywords?.join(', ') || ''}
                onChange={(e) => updateSEO('keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                placeholder="lash extensions, oceanside, beauty salon"
                className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose transition-colors"
              />
              <p className="text-xs text-dune/40 mt-1">Helps with search ranking</p>
            </div>

            {/* Google Preview */}
            <div className="p-6 bg-white rounded-xl border border-sage/20">
              <p className="text-xs text-dune/50 uppercase tracking-wider mb-4">Google Search Preview</p>
              <div className="space-y-1">
                <p className="text-lg text-[#1a0dab] hover:underline cursor-pointer truncate">
                  {seo.metaTitle || 'Page Title'}
                </p>
                <p className="text-sm text-[#006621]">
                  lashpopstudios.com
                </p>
                <p className="text-sm text-[#545454] line-clamp-2">
                  {seo.metaDescription || 'Page description will appear here...'}
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="p-4 bg-dusty-rose/10 rounded-xl border border-dusty-rose/20">
              <p className="text-xs text-dune font-medium mb-2">SEO Tips</p>
              <ul className="text-xs text-dune/70 space-y-1">
                <li>• Keep meta title under 60 characters</li>
                <li>• Keep meta description between 120-160 characters</li>
                <li>• Include your location (Oceanside, CA) for local SEO</li>
                <li>• Use relevant keywords naturally</li>
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
