"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Search,
  Globe,
  Home,
  Sparkles,
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

// ============================================
// Main Component
// ============================================

export default function SEOSettingsEditor() {
  // Data state
  const [settings, setSettings] = useState<SEOSettings>(DEFAULT_SEO_SETTINGS)

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('site')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/website/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      if (!response.ok) throw new Error('Failed to save settings')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-mist/30 to-sage/20 flex items-center justify-center">
              <Search className="w-6 h-6 text-ocean-mist" />
            </div>
            <div>
              <h1 className="h2 text-dune">SEO Settings</h1>
              <p className="text-sm text-dune/60">Configure site metadata, social sharing, and search optimization</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'}`}
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

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-terracotta/10 border border-terracotta/20 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-terracotta flex-shrink-0" />
          <p className="text-sm text-terracotta">{error}</p>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="glass rounded-2xl p-2 inline-flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('site')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'site'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Site Settings
          </button>
          <button
            onClick={() => setActiveTab('homepage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'homepage'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <Home className="w-4 h-4" />
            Homepage
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'services'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Services
          </button>
          <button
            onClick={() => setActiveTab('workWithUs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'workWithUs'
                ? 'bg-dusty-rose/20 text-dune border border-dusty-rose/30'
                : 'text-dune/60 hover:text-dune hover:bg-cream/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Work With Us
          </button>
        </div>
      </motion.div>

      {/* Tab Content */}
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
        {activeTab === 'services' && (
          <PageSEOTab
            key="services"
            page="services"
            label="Services"
            seo={settings.pages.services}
            updatePage={(updates) => updatePage('services', updates)}
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
      className="space-y-6"
    >
      {/* Business Information */}
      <div className="glass rounded-3xl p-6 border border-sage/20">
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
              value={site.businessName}
              onChange={(e) => updateSite({ businessName: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              placeholder="LashPop Studios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Business Type (Schema.org)
            </label>
            <select
              value={site.businessType}
              onChange={(e) => updateSite({ businessType: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
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
              value={site.businessDescription}
              onChange={(e) => updateSite({ businessDescription: e.target.value })}
              rows={3}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 resize-none"
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
              value={site.siteUrl}
              onChange={(e) => updateSite({ siteUrl: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
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
              value={site.siteName}
              onChange={(e) => updateSite({ siteName: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
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
              value={site.phone || ''}
              onChange={(e) => updateSite({ phone: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
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
              value={site.email || ''}
              onChange={(e) => updateSite({ email: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              placeholder="hello@lashpopstudios.com"
            />
          </div>
        </div>
      </div>

      {/* Social Profiles */}
      <div className="glass rounded-3xl p-6 border border-sage/20">
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
              value={site.socialProfiles.instagram || ''}
              onChange={(e) => updateSocialProfiles({ instagram: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
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
              value={site.socialProfiles.facebook || ''}
              onChange={(e) => updateSocialProfiles({ facebook: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              placeholder="https://facebook.com/lashpopstudios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">TikTok</label>
            <input
              type="url"
              value={site.socialProfiles.tiktok || ''}
              onChange={(e) => updateSocialProfiles({ tiktok: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              placeholder="https://tiktok.com/@lashpopstudios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">Yelp</label>
            <input
              type="url"
              value={site.socialProfiles.yelp || ''}
              onChange={(e) => updateSocialProfiles({ yelp: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              placeholder="https://yelp.com/biz/lashpop-studios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">Pinterest</label>
            <input
              type="url"
              value={site.socialProfiles.pinterest || ''}
              onChange={(e) => updateSocialProfiles({ pinterest: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              placeholder="https://pinterest.com/lashpopstudios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">Twitter / X</label>
            <input
              type="url"
              value={site.socialProfiles.twitter || ''}
              onChange={(e) => updateSocialProfiles({ twitter: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
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
      <div className="glass rounded-3xl p-6 border border-sage/20">
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
      <div className="glass rounded-3xl p-6 border border-sage/20">
        <h3 className="font-serif text-lg text-dune mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          llms.txt Introduction
        </h3>
        <p className="text-sm text-dune/60 mb-4">
          Optional custom introduction for your llms.txt file. This helps AI assistants understand your business.
          Leave blank to use the auto-generated content based on your services and business info.
        </p>

        <textarea
          value={site.llmsTxtIntro || ''}
          onChange={(e) => updateSite({ llmsTxtIntro: e.target.value })}
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 resize-none font-mono text-sm"
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
      className="space-y-6"
    >
      {/* Basic Meta */}
      <div className="glass rounded-3xl p-6 border border-sage/20">
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
              value={seo.title || ''}
              onChange={(e) => updatePage({ title: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              placeholder="Page Title | LashPop Studios"
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">
              Meta Description
              <span className="ml-2 text-dune/30">({(seo.metaDescription || '').length}/160 characters)</span>
            </label>
            <textarea
              value={seo.metaDescription || ''}
              onChange={(e) => updatePage({ metaDescription: e.target.value })}
              rows={3}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 resize-none"
              placeholder="Describe this page in 160 characters or less..."
            />
          </div>

          <div>
            <label className="text-xs text-dune/50 uppercase tracking-wider">
              Canonical URL (optional)
            </label>
            <input
              type="url"
              value={seo.canonicalUrl || ''}
              onChange={(e) => updatePage({ canonicalUrl: e.target.value })}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              placeholder="Leave empty to use default URL"
            />
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={seo.noIndex || false}
                onChange={(e) => updatePage({ noIndex: e.target.checked })}
                className="w-5 h-5 rounded border-sage/30 text-dusty-rose focus:ring-dusty-rose"
              />
              <span className="text-sm text-dune">No Index</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
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
      <div className="glass rounded-3xl p-6 border border-sage/20">
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
                value={seo.ogTitle || ''}
                onChange={(e) => updatePage({ ogTitle: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
                placeholder="Override title for social sharing"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">OG Description</label>
              <textarea
                value={seo.ogDescription || ''}
                onChange={(e) => updatePage({ ogDescription: e.target.value })}
                rows={3}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 resize-none"
                placeholder="Override description for social sharing"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">OG Type</label>
              <select
                value={seo.ogType || 'website'}
                onChange={(e) => updatePage({ ogType: e.target.value as PageSEO['ogType'] })}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
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
      <div className="glass rounded-3xl p-6 border border-sage/20">
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
                value={seo.twitterTitle || ''}
                onChange={(e) => updatePage({ twitterTitle: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
                placeholder="Override title for Twitter"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">Twitter Description</label>
              <textarea
                value={seo.twitterDescription || ''}
                onChange={(e) => updatePage({ twitterDescription: e.target.value })}
                rows={3}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 resize-none"
                placeholder="Override description for Twitter"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider">Card Type</label>
              <select
                value={seo.twitterCard || 'summary_large_image'}
                onChange={(e) => updatePage({ twitterCard: e.target.value as PageSEO['twitterCard'] })}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-cream/50 border border-sage/20 text-dune focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
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
      <label className="text-xs text-dune/50 uppercase tracking-wider">{label}</label>
      <p className="text-xs text-dune/40">{description}</p>

      {image?.url ? (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-sage/20 group">
          <Image
            src={image.url}
            alt={image.alt || label}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-dune/0 group-hover:bg-dune/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={onSelect}
              className="p-2 rounded-lg bg-cream/90 hover:bg-cream transition-colors"
            >
              <Folder className="w-4 h-4 text-dune" />
            </button>
            <button
              onClick={onRemove}
              className="p-2 rounded-lg bg-terracotta/90 hover:bg-terracotta transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-dune/60 text-xs text-white truncate">
            {image.fileName}
          </p>
        </div>
      ) : (
        <button
          onClick={onSelect}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-sage/30 hover:border-dusty-rose/50 bg-cream/30 flex flex-col items-center justify-center gap-2 transition-colors"
        >
          <ImageIcon className="w-8 h-8 text-dune/30" />
          <span className="text-xs text-dune/50">Click to select</span>
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
    <div className="glass rounded-3xl p-6 border border-ocean-mist/20">
      <div className="flex items-center justify-between mb-4">
        <div>
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
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ocean-mist/10 text-ocean-mist rounded-full hover:bg-ocean-mist/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
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
                  <div className="text-sm font-medium text-dune/80">
                    {credential.name}
                  </div>
                  {credential.issuer && (
                    <div className="text-xs text-dune/50">
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
                  onClick={() => handleRemove(index)}
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-dune/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
            <div className="p-4 bg-ocean-mist/5 border border-ocean-mist/20 rounded-xl space-y-3">
              {/* Type Selector */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(CREDENTIAL_TYPES).map(([key, info]) => {
                  const Icon = info.icon
                  const isSelected = newCredential.type === key
                  return (
                    <button
                      key={key}
                      onClick={() => setNewCredential({ ...newCredential, type: key as CredentialType })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-ocean-mist text-white'
                          : 'bg-white text-dune/70 hover:bg-ocean-mist/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {info.label}
                    </button>
                  )
                })}
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Credential name (e.g., Cosmetology Establishment License)*"
                  value={newCredential.name}
                  onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                  autoFocus
                />

                <input
                  type="text"
                  placeholder="Issuing organization (e.g., California Board of Cosmetology)"
                  value={newCredential.issuer || ''}
                  onChange={(e) => setNewCredential({ ...newCredential, issuer: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="License/cert number"
                    value={newCredential.licenseNumber || ''}
                    onChange={(e) => setNewCredential({ ...newCredential, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                  />
                  <input
                    type="text"
                    placeholder="Date issued (YYYY-MM-DD)"
                    value={newCredential.dateIssued || ''}
                    onChange={(e) => setNewCredential({ ...newCredential, dateIssued: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                  />
                </div>

                <input
                  type="url"
                  placeholder="Verification URL (optional)"
                  value={newCredential.url || ''}
                  onChange={(e) => setNewCredential({ ...newCredential, url: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <button
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
                  className="px-4 py-2 text-sm text-dune/60 hover:text-dune transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newCredential.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ocean-mist text-white rounded-lg hover:bg-ocean-mist/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
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
