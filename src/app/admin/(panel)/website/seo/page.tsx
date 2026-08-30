"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Search,
  Globe,
  Home,
  Briefcase,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Folder,
  Image as ImageIcon,
  Link as LinkIcon,
  Hash,
  Type,
  FileText,
  Instagram,
  Facebook,
  AtSign,
  Phone,
  Mail,
  X
} from 'lucide-react'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'
import type {
  SEOSettings,
  SiteSEO,
  PageSEO,
  SEOImage,
  BusinessCredential
} from '@/types/seo'
import {
  DEFAULT_SEO_SETTINGS,
  BUSINESS_TYPES
} from '@/types/seo'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'
import {
  Award,
  FileCheck,
  GraduationCap,
  Trophy,
  Building2,
  Shield,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react'

// ============================================
// Types
// ============================================

type TabType = 'site' | 'homepage' | 'services' | 'workWithUs'
type ImagePickerContext = {
  type: 'site'
  field: 'defaultOgImage' | 'defaultTwitterImage' | 'logo'
} | {
  type: 'page'
  page: 'homepage' | 'services' | 'workWithUs'
  field: 'ogImage' | 'twitterImage'
}

const SEO_TABS = [
  { id: 'site', label: 'Site Settings', phoneLabel: 'Site', icon: Globe },
  { id: 'homepage', label: 'Homepage', phoneLabel: 'Home', icon: Home },
  { id: 'workWithUs', label: 'Work With Us', phoneLabel: 'Careers', icon: Briefcase },
] as const satisfies ReadonlyArray<{
  id: TabType
  label: string
  phoneLabel: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}>

const SEO_PANEL_CLASS = 'glass rounded-xl border border-sage/20 p-4 md:rounded-2xl md:p-6'
const SEO_FIELD_CLASS = 'mt-1 min-h-11 w-full min-w-0 rounded-lg border border-sage/20 bg-cream/50 px-3 py-2.5 text-sm text-dune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-rose/30 md:rounded-xl md:px-4'
const SEO_LABEL_CLASS = 'flex items-center gap-1 text-xs uppercase tracking-wider text-dune/50'

function handleSeoTabKeyDown(
  event: React.KeyboardEvent<HTMLButtonElement>,
  currentIndex: number,
  onSelect: (tab: TabType) => void,
) {
  let nextIndex: number | null = null
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % SEO_TABS.length
  if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + SEO_TABS.length) % SEO_TABS.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = SEO_TABS.length - 1
  if (nextIndex === null) return

  event.preventDefault()
  const nextTab = SEO_TABS[nextIndex]
  onSelect(nextTab.id)
  window.requestAnimationFrame(() => document.getElementById(`seo-tab-${nextTab.id}`)?.focus())
}

// ============================================
// Main Component
// ============================================

export default function SEOSettingsEditor() {
  // Data state
  const [settings, setSettings] = useState<SEOSettings>(DEFAULT_SEO_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<SEOSettings>(DEFAULT_SEO_SETTINGS)

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('site')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [baseVersion, setBaseVersion] = useState(0)
  const [sourceOwner, setSourceOwner] = useState('admin')

  // Image picker state
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerContext, setImagePickerContext] = useState<ImagePickerContext | null>(null)

  // ============================================
  // Data Fetching
  // ============================================

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/website/seo')
      if (!response.ok) throw new Error('Failed to fetch SEO settings')
      const data = await response.json()
      setSettings(data.settings)
      setSavedSettings(data.settings)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
    } catch (err) {
      console.error('Error fetching SEO settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // ============================================
  // Save Handler
  // ============================================

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/website/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, baseVersion })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 409 && data?.conflict) {
          setConflict(true)
          throw new Error(`Another admin published a newer version. Reload latest to discard this draft and continue from version ${data.currentVersion ?? 'the newest version'}.`)
        }
        throw new Error(data?.error ?? `Failed to save settings (${response.status})`)
      }
      setSettings(data.settings)
      setSavedSettings(data.settings)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save')
      setError(error.message)
      throw error
    } finally {
      setSaving(false)
    }
  }, [baseVersion, settings])

  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)
  const discard = useCallback(() => {
    setSettings(savedSettings)
    setError(null)
    setConflict(false)
    setSaved(false)
  }, [savedSettings])

  useDirtyBlock({
    id: 'seo-settings',
    label: 'SEO settings',
    dirty,
    save,
    discard,
  })

  // ============================================
  // Update Handlers
  // ============================================

  const updateSite = (updates: Partial<SiteSEO>) => {
    setSettings(prev => ({
      ...prev,
      site: { ...prev.site, ...updates }
    }))
  }

  const updateSocialProfiles = (updates: Partial<SiteSEO['socialProfiles']>) => {
    setSettings(prev => ({
      ...prev,
      site: {
        ...prev.site,
        socialProfiles: { ...prev.site.socialProfiles, ...updates }
      }
    }))
  }

  const updatePage = (page: 'homepage' | 'services' | 'workWithUs', updates: Partial<PageSEO>) => {
    setSettings(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [page]: { ...prev.pages[page], ...updates }
      }
    }))
  }

  // ============================================
  // Image Selection Handler
  // ============================================

  const openImagePicker = (context: ImagePickerContext) => {
    setImagePickerContext(context)
    setShowImagePicker(true)
  }

  const handleImageSelect = (asset: Asset) => {
    if (!imagePickerContext) return

    const newImage: SEOImage = {
      id: crypto.randomUUID(),
      assetId: asset.id,
      url: asset.filePath,
      fileName: asset.fileName,
      alt: asset.fileName,
      position: { x: 50, y: 50 }
    }

    if (imagePickerContext.type === 'site') {
      updateSite({ [imagePickerContext.field]: newImage })
    } else {
      updatePage(imagePickerContext.page, { [imagePickerContext.field]: newImage })
    }

    setShowImagePicker(false)
    setImagePickerContext(null)
  }

  const removeImage = (context: ImagePickerContext) => {
    if (context.type === 'site') {
      updateSite({ [context.field]: null })
    } else {
      updatePage(context.page, { [context.field]: null })
    }
  }

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center" role="status" aria-label="Loading SEO settings">
        <div className="size-12 animate-spin rounded-full border-4 border-dusty-rose border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="mx-auto min-w-0 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 sm:mb-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ocean-mist/30 to-sage/20 md:size-12 md:rounded-xl">
              <Search className="size-5 text-ocean-mist md:size-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold leading-tight text-dune md:text-3xl">SEO Settings</h1>
              <p className="mt-0.5 text-sm leading-5 text-dune/60">Manage search details and social sharing previews.</p>
              <p className="text-xs text-dune/45">
                {baseVersion === 0 ? 'Not published yet' : `Version ${baseVersion}`} · Source: {sourceOwner}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void save().catch(() => undefined)}
            disabled={saving}
            className={`btn min-h-11 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 sm:w-auto ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'}`}
          >
            {saving ? (
              <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : saved ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex flex-col items-stretch gap-3 rounded-lg border border-terracotta/20 bg-terracotta/10 p-4 sm:mb-6 sm:flex-row sm:items-center md:rounded-xl"
          role="alert"
        >
          <AlertCircle className="size-5 shrink-0 text-terracotta" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm text-terracotta">{error}</p>
          {conflict && (
            <button type="button" onClick={() => void fetchSettings()} className="btn btn-secondary min-h-11 w-full text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta sm:w-auto">
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Discard edits &amp; load latest
            </button>
          )}
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="glass grid w-full grid-cols-3 gap-1 rounded-lg p-1 sm:inline-flex sm:w-auto sm:gap-2 sm:p-2 md:rounded-xl" role="tablist" aria-label="SEO sections">
          {SEO_TABS.map((tab, tabIndex) => {
            const Icon = tab.icon
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`seo-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`seo-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleSeoTabKeyDown(event, tabIndex, setActiveTab)}
                className={`flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta sm:gap-2 sm:rounded-lg sm:px-4 sm:text-sm ${
                  selected
                    ? 'border border-dusty-rose/30 bg-dusty-rose/20 text-dune'
                    : 'text-dune/60 hover:bg-cream/50 hover:text-dune'
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate sm:hidden">{tab.phoneLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <div
        id={`seo-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`seo-tab-${activeTab}`}
        className="min-w-0"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'site' && (
            <SiteSettingsTab
              key="site"
              site={settings.site}
              updateSite={updateSite}
              updateSocialProfiles={updateSocialProfiles}
              openImagePicker={openImagePicker}
              removeImage={removeImage}
            />
          )}
          {activeTab === 'homepage' && (
            <PageSEOTab
              key="homepage"
              page="homepage"
              label="Homepage"
              seo={settings.pages.homepage}
              updatePage={(updates) => updatePage('homepage', updates)}
              openImagePicker={openImagePicker}
              removeImage={removeImage}
            />
          )}
          {activeTab === 'workWithUs' && (
            <PageSEOTab
              key="workWithUs"
              page="workWithUs"
              label="Work With Us"
              seo={settings.pages.workWithUs}
              updatePage={(updates) => updatePage('workWithUs', updates)}
              openImagePicker={openImagePicker}
              removeImage={removeImage}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mini DAM Explorer Modal */}
      <MiniDamExplorer
        isOpen={showImagePicker}
        onClose={() => {
          setShowImagePicker(false)
          setImagePickerContext(null)
        }}
        onSelect={handleImageSelect}
        title="Select Social Image"
        subtitle="Choose an image for social sharing (1200x630 recommended)"
      />
    </div>
  )
}

// ============================================
// Site Settings Tab
// ============================================

interface SiteSettingsTabProps {
  site: SiteSEO
  updateSite: (updates: Partial<SiteSEO>) => void
  updateSocialProfiles: (updates: Partial<SiteSEO['socialProfiles']>) => void
  openImagePicker: (context: ImagePickerContext) => void
  removeImage: (context: ImagePickerContext) => void
}

function SiteSettingsTab({ site, updateSite, updateSocialProfiles, openImagePicker, removeImage }: SiteSettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-w-0 space-y-4 md:space-y-6"
    >
      {/* Business Information */}
      <div className={SEO_PANEL_CLASS}>
        <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Business Information
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <Type className="w-3 h-3" />
              Business Name
            </label>
            <input
              type="text"
              aria-label="Business name"
              value={site.businessName}
              onChange={(e) => updateSite({ businessName: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="LashPop Studios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Business Type (Schema.org)
            </label>
            <select
              aria-label="Business type"
              value={site.businessType}
              onChange={(e) => updateSite({ businessType: e.target.value })}
              className={SEO_FIELD_CLASS}
            >
              {BUSINESS_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Business Description
            </label>
            <textarea
              aria-label="Business description"
              value={site.businessDescription}
              onChange={(e) => updateSite({ businessDescription: e.target.value })}
              rows={3}
              className={`${SEO_FIELD_CLASS} resize-none`}
              placeholder="Describe your business..."
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              Site URL
            </label>
            <input
              type="url"
              aria-label="Site URL"
              value={site.siteUrl}
              onChange={(e) => updateSite({ siteUrl: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="https://lashpopstudios.com"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <Type className="w-3 h-3" />
              Site Name
            </label>
            <input
              type="text"
              aria-label="Site name"
              value={site.siteName}
              onChange={(e) => updateSite({ siteName: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="LashPop Studios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Phone
            </label>
            <input
              type="tel"
              aria-label="Business phone"
              value={site.phone || ''}
              onChange={(e) => updateSite({ phone: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="+1 (858) 555-0123"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Email
            </label>
            <input
              type="email"
              aria-label="Business email"
              value={site.email || ''}
              onChange={(e) => updateSite({ email: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="lashpopstudios@gmail.com"
            />
          </div>
        </div>
      </div>

      {/* Social Profiles */}
      <div className={SEO_PANEL_CLASS}>
        <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
          <AtSign className="w-5 h-5" />
          Social Profiles
        </h3>
        <p className="text-sm text-dune/60 mb-4">
          These will be included in your Schema.org structured data for better search visibility.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <Instagram className="w-3 h-3" />
              Instagram
            </label>
            <input
              type="url"
              aria-label="Instagram profile URL"
              value={site.socialProfiles.instagram || ''}
              onChange={(e) => updateSocialProfiles({ instagram: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="https://instagram.com/lashpopstudios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <Facebook className="w-3 h-3" />
              Facebook
            </label>
            <input
              type="url"
              aria-label="Facebook profile URL"
              value={site.socialProfiles.facebook || ''}
              onChange={(e) => updateSocialProfiles({ facebook: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="https://facebook.com/lashpopstudios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">TikTok</label>
            <input
              type="url"
              aria-label="TikTok profile URL"
              value={site.socialProfiles.tiktok || ''}
              onChange={(e) => updateSocialProfiles({ tiktok: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="https://tiktok.com/@lashpopstudios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">Yelp</label>
            <input
              type="url"
              aria-label="Yelp profile URL"
              value={site.socialProfiles.yelp || ''}
              onChange={(e) => updateSocialProfiles({ yelp: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="https://yelp.com/biz/lashpop-studios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">Pinterest</label>
            <input
              type="url"
              aria-label="Pinterest profile URL"
              value={site.socialProfiles.pinterest || ''}
              onChange={(e) => updateSocialProfiles({ pinterest: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="https://pinterest.com/lashpopstudios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">Twitter / X</label>
            <input
              type="url"
              aria-label="Twitter or X profile URL"
              value={site.socialProfiles.twitter || ''}
              onChange={(e) => updateSocialProfiles({ twitter: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="https://twitter.com/lashpopstudios"
            />
          </div>
        </div>
      </div>

      {/* Business Credentials */}
      <BusinessCredentialsEditor
        credentials={site.credentials || []}
        onChange={(credentials) => updateSite({ credentials })}
      />

      {/* Default Social Images */}
      <div className={SEO_PANEL_CLASS}>
        <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Default Social Images
        </h3>
        <p className="text-sm text-dune/60 mb-4">
          These images are used as fallbacks when pages don&apos;t have their own social images set.
          Recommended size: 1200x630 pixels for OG, 1200x628 for Twitter.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Logo */}
          <ImageSelector
            label="Logo"
            description="Square logo for Schema"
            image={site.logo}
            onSelect={() => openImagePicker({ type: 'site', field: 'logo' })}
            onRemove={() => removeImage({ type: 'site', field: 'logo' })}
          />

          {/* Default OG Image */}
          <ImageSelector
            label="Default OG Image"
            description="Facebook, LinkedIn sharing"
            image={site.defaultOgImage}
            onSelect={() => openImagePicker({ type: 'site', field: 'defaultOgImage' })}
            onRemove={() => removeImage({ type: 'site', field: 'defaultOgImage' })}
          />

          {/* Default Twitter Image */}
          <ImageSelector
            label="Default Twitter Image"
            description="Twitter/X card image"
            image={site.defaultTwitterImage}
            onSelect={() => openImagePicker({ type: 'site', field: 'defaultTwitterImage' })}
            onRemove={() => removeImage({ type: 'site', field: 'defaultTwitterImage' })}
          />
        </div>
      </div>

      {/* LLMs.txt Intro */}
      <div className={SEO_PANEL_CLASS}>
        <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          llms.txt Introduction
        </h3>
        <p className="text-sm text-dune/60 mb-4">
          Optional custom introduction for your llms.txt file. This helps AI assistants understand your business.
          Leave blank to use the auto-generated content based on your services and business info.
        </p>

        <textarea
          aria-label="llms.txt introduction"
          value={site.llmsTxtIntro || ''}
          onChange={(e) => updateSite({ llmsTxtIntro: e.target.value })}
          rows={4}
          className={`${SEO_FIELD_CLASS} resize-none font-mono`}
          placeholder="# LashPop Studios

Premium lash extension services in Oceanside, CA..."
        />
      </div>
    </motion.div>
  )
}

// ============================================
// Page SEO Tab
// ============================================

interface PageSEOTabProps {
  page: 'homepage' | 'services' | 'workWithUs'
  label: string
  seo: PageSEO
  updatePage: (updates: Partial<PageSEO>) => void
  openImagePicker: (context: ImagePickerContext) => void
  removeImage: (context: ImagePickerContext) => void
}

function PageSEOTab({ page, label, seo, updatePage, openImagePicker, removeImage }: PageSEOTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-w-0 space-y-4 md:space-y-6"
    >
      {/* Basic Meta */}
      <div className={SEO_PANEL_CLASS}>
        <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
          <Type className="w-5 h-5" />
          Meta Tags - {label}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">
              Page Title
              <span className="ml-2 text-dune/30">({(seo.title || '').length}/60 characters)</span>
            </label>
            <input
              type="text"
              aria-label={`${label} page title`}
              value={seo.title || ''}
              onChange={(e) => updatePage({ title: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="Page Title | LashPop Studios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">
              Meta Description
              <span className="ml-2 text-dune/30">({(seo.metaDescription || '').length}/160 characters)</span>
            </label>
            <textarea
              aria-label={`${label} meta description`}
              value={seo.metaDescription || ''}
              onChange={(e) => updatePage({ metaDescription: e.target.value })}
              rows={3}
              className={`${SEO_FIELD_CLASS} resize-none`}
              placeholder="Describe this page in 160 characters or less..."
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">
              Canonical URL (optional)
            </label>
            <input
              type="url"
              aria-label={`${label} canonical URL`}
              value={seo.canonicalUrl || ''}
              onChange={(e) => updatePage({ canonicalUrl: e.target.value })}
              className={SEO_FIELD_CLASS}
              placeholder="Leave empty to use default URL"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-6">
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                aria-label={`Prevent ${label} from appearing in search results`}
                checked={seo.noIndex || false}
                onChange={(e) => updatePage({ noIndex: e.target.checked })}
                className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
              />
              <span className="text-sm text-dune">No Index</span>
            </label>

            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                aria-label={`Prevent search engines from following links on ${label}`}
                checked={seo.noFollow || false}
                onChange={(e) => updatePage({ noFollow: e.target.checked })}
                className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
              />
              <span className="text-sm text-dune">No Follow</span>
            </label>
          </div>
        </div>
      </div>

      {/* OpenGraph */}
      <div className={SEO_PANEL_CLASS}>
        <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
          <Facebook className="w-5 h-5" />
          OpenGraph (Facebook, LinkedIn)
        </h3>
        <p className="text-sm text-dune/60 mb-4">
          Leave blank to use the meta title/description as fallbacks.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">OG Title</label>
              <input
                type="text"
                aria-label={`${label} OpenGraph title`}
                value={seo.ogTitle || ''}
                onChange={(e) => updatePage({ ogTitle: e.target.value })}
                className={SEO_FIELD_CLASS}
                placeholder="Override title for social sharing"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">OG Description</label>
              <textarea
                aria-label={`${label} OpenGraph description`}
                value={seo.ogDescription || ''}
                onChange={(e) => updatePage({ ogDescription: e.target.value })}
                rows={3}
                className={`${SEO_FIELD_CLASS} resize-none`}
                placeholder="Override description for social sharing"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">OG Type</label>
              <select
                aria-label={`${label} OpenGraph type`}
                value={seo.ogType || 'website'}
                onChange={(e) => updatePage({ ogType: e.target.value as PageSEO['ogType'] })}
                className={SEO_FIELD_CLASS}
              >
                <option value="website">Website</option>
                <option value="article">Article</option>
                <option value="profile">Profile</option>
              </select>
            </div>
          </div>

          <ImageSelector
            label="OG Image"
            description="1200x630 recommended"
            image={seo.ogImage}
            onSelect={() => openImagePicker({ type: 'page', page, field: 'ogImage' })}
            onRemove={() => removeImage({ type: 'page', page, field: 'ogImage' })}
          />
        </div>
      </div>

      {/* Twitter Card */}
      <div className={SEO_PANEL_CLASS}>
        <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
          <AtSign className="w-5 h-5" />
          Twitter Card
        </h3>
        <p className="text-sm text-dune/60 mb-4">
          Leave blank to use OG or meta tags as fallbacks.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">Twitter Title</label>
              <input
                type="text"
                aria-label={`${label} Twitter title`}
                value={seo.twitterTitle || ''}
                onChange={(e) => updatePage({ twitterTitle: e.target.value })}
                className={SEO_FIELD_CLASS}
                placeholder="Override title for Twitter"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">Twitter Description</label>
              <textarea
                aria-label={`${label} Twitter description`}
                value={seo.twitterDescription || ''}
                onChange={(e) => updatePage({ twitterDescription: e.target.value })}
                rows={3}
                className={`${SEO_FIELD_CLASS} resize-none`}
                placeholder="Override description for Twitter"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">Card Type</label>
              <select
                aria-label={`${label} Twitter card type`}
                value={seo.twitterCard || 'summary_large_image'}
                onChange={(e) => updatePage({ twitterCard: e.target.value as PageSEO['twitterCard'] })}
                className={SEO_FIELD_CLASS}
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
              </select>
            </div>
          </div>

          <ImageSelector
            label="Twitter Image"
            description="1200x628 recommended"
            image={seo.twitterImage}
            onSelect={() => openImagePicker({ type: 'page', page, field: 'twitterImage' })}
            onRemove={() => removeImage({ type: 'page', page, field: 'twitterImage' })}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// Image Selector Component
// ============================================

interface ImageSelectorProps {
  label: string
  description: string
  image: SEOImage | null | undefined
  onSelect: () => void
  onRemove: () => void
}

function ImageSelector({ label, description, image, onSelect, onRemove }: ImageSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-dune/50">{label}</p>
      <p className="text-xs text-dune/40">{description}</p>

      {image?.url ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-sage/20 md:rounded-xl">
          <Image
            src={image.url}
            alt={image.alt || label}
            fill
            className="object-cover"
          />
          <div className="absolute right-2 top-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onSelect}
              className="flex size-11 items-center justify-center rounded-lg bg-cream/90 text-dune shadow-sm transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
              aria-label={`Replace ${label}`}
            >
              <Folder className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex size-11 items-center justify-center rounded-lg bg-terracotta/90 text-white shadow-sm transition-colors hover:bg-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
              aria-label={`Remove ${label}`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <p className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-dune/60 text-xs text-white truncate">
            {image.fileName}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="flex min-h-11 w-full aspect-video flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-sage/30 bg-cream/30 transition-colors hover:border-dusty-rose/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta md:rounded-xl"
          aria-label={`Select ${label}`}
        >
          <ImageIcon className="size-8 text-dune/30" aria-hidden="true" />
          <span className="text-xs text-dune/50">Select image</span>
        </button>
      )}
    </div>
  )
}

// ============================================
// Business Credentials Editor
// ============================================

const CREDENTIAL_TYPES = {
  license: { label: "License", icon: FileCheck, description: "Business license" },
  certification: { label: "Certification", icon: Award, description: "Business certification" },
  accreditation: { label: "Accreditation", icon: Building2, description: "Industry accreditation" },
  membership: { label: "Membership", icon: Shield, description: "Professional association" },
  award: { label: "Award", icon: Trophy, description: "Business award" },
} as const

type CredentialType = keyof typeof CREDENTIAL_TYPES

interface BusinessCredentialsEditorProps {
  credentials: BusinessCredential[]
  onChange: (credentials: BusinessCredential[]) => void
}

function BusinessCredentialsEditor({ credentials, onChange }: BusinessCredentialsEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newCredential, setNewCredential] = useState<BusinessCredential>({
    type: 'license',
    name: '',
    issuer: '',
    dateIssued: '',
    licenseNumber: '',
    url: ''
  })

  const handleAdd = () => {
    if (!newCredential.name.trim()) return

    const cleanedCredential = {
      ...newCredential,
      name: newCredential.name.trim(),
      issuer: newCredential.issuer?.trim() || undefined,
      licenseNumber: newCredential.licenseNumber?.trim() || undefined,
      url: newCredential.url?.trim() || undefined,
      dateIssued: newCredential.dateIssued || undefined,
    }

    onChange([...credentials, cleanedCredential])
    setNewCredential({
      type: 'license',
      name: '',
      issuer: '',
      dateIssued: '',
      licenseNumber: '',
      url: ''
    })
    setIsAdding(false)
  }

  const handleRemove = (index: number) => {
    onChange(credentials.filter((_, i) => i !== index))
  }

  const getTypeInfo = (type: string) => {
    return CREDENTIAL_TYPES[type as CredentialType] || CREDENTIAL_TYPES.license
  }

  return (
    <div className="glass rounded-xl border border-ocean-mist/20 p-4 md:rounded-2xl md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-dune flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Business Credentials
          </h3>
          <p className="text-sm text-dune/60 mt-1">
            Licenses, certifications, and accreditations for search engine structured data.
            <br />
            <span className="text-xs text-ocean-mist">These appear in JSON-LD but not publicly on the website.</span>
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-ocean-mist/10 px-3 py-2 text-xs font-medium text-ocean-mist transition-colors hover:bg-ocean-mist/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist sm:w-auto md:rounded-xl"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add Credential
          </button>
        )}
      </div>

      {/* Existing Credentials */}
      {credentials.length > 0 && (
        <div className="space-y-2 mb-4">
          {credentials.map((credential, index) => {
            const typeInfo = getTypeInfo(credential.type)
            const Icon = typeInfo.icon

            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-cream/50 border border-sage/10 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className="w-4 h-4 text-ocean-mist" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-dune/50">
                    {typeInfo.label}
                  </div>
                  <div className="break-words text-sm font-medium text-dune/80">
                    {credential.name}
                  </div>
                  {credential.issuer && (
                    <div className="break-words text-xs text-dune/50">
                      {credential.issuer}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {credential.licenseNumber && (
                      <span className="text-[10px] px-2 py-0.5 bg-sage/10 rounded-full text-dune/60">
                        #{credential.licenseNumber}
                      </span>
                    )}
                    {credential.dateIssued && (
                      <span className="text-[10px] px-2 py-0.5 bg-sage/10 rounded-full text-dune/60 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {credential.dateIssued}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg text-dune/50 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                  aria-label={`Remove ${credential.name}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {credentials.length === 0 && !isAdding && (
        <div className="text-center py-6 text-dune/40 text-sm border border-dashed border-sage/20 rounded-xl">
          No business credentials yet.
          <p className="text-xs mt-1 text-dune/30">
            Add licenses and certifications to boost E-E-A-T signals for search engines
          </p>
        </div>
      )}

      {/* Add New Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 rounded-lg border border-ocean-mist/20 bg-ocean-mist/5 p-3 md:rounded-xl md:p-4">
              {/* Type Selector */}
              <div className="flex flex-wrap gap-2" role="group" aria-label="Credential type">
                {Object.entries(CREDENTIAL_TYPES).map(([key, info]) => {
                  const Icon = info.icon
                  const isSelected = newCredential.type === key
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setNewCredential({ ...newCredential, type: key as CredentialType })}
                      className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist md:rounded-xl ${
                        isSelected
                          ? 'bg-ocean-mist text-white'
                          : 'bg-white text-dune/70 hover:bg-ocean-mist/10'
                      }`}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {info.label}
                    </button>
                  )
                })}
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <label className="block">
                  <span className={SEO_LABEL_CLASS}>Credential name</span>
                  <input
                    type="text"
                    value={newCredential.name}
                    onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                    className={SEO_FIELD_CLASS}
                    placeholder="Cosmetology Establishment License"
                    autoComplete="off"
                  />
                </label>

                <label className="block">
                  <span className={SEO_LABEL_CLASS}>Issuing organization</span>
                  <input
                    type="text"
                    value={newCredential.issuer || ''}
                    onChange={(e) => setNewCredential({ ...newCredential, issuer: e.target.value })}
                    className={SEO_FIELD_CLASS}
                    placeholder="California Board of Cosmetology"
                    autoComplete="off"
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className={SEO_LABEL_CLASS}>License or certificate number</span>
                    <input
                      type="text"
                      value={newCredential.licenseNumber || ''}
                      onChange={(e) => setNewCredential({ ...newCredential, licenseNumber: e.target.value })}
                      className={SEO_FIELD_CLASS}
                      autoComplete="off"
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className={SEO_LABEL_CLASS}>Date issued</span>
                    <input
                      type="text"
                      value={newCredential.dateIssued || ''}
                      onChange={(e) => setNewCredential({ ...newCredential, dateIssued: e.target.value })}
                      className={SEO_FIELD_CLASS}
                      placeholder="YYYY-MM-DD"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={SEO_LABEL_CLASS}>Verification URL (optional)</span>
                  <input
                    type="url"
                    value={newCredential.url || ''}
                    onChange={(e) => setNewCredential({ ...newCredential, url: e.target.value })}
                    className={SEO_FIELD_CLASS}
                    placeholder="https://…"
                    autoComplete="off"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false)
                    setNewCredential({
                      type: 'license',
                      name: '',
                      issuer: '',
                      dateIssued: '',
                      licenseNumber: '',
                      url: ''
                    })
                  }}
                  className="min-h-11 w-full rounded-lg px-4 py-2 text-sm text-dune/60 transition-colors hover:text-dune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newCredential.name.trim()}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ocean-mist px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ocean-mist/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add Credential
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
