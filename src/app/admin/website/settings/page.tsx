"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Save,
  Check,
  RefreshCw,
  Building2,
  Search,
  Share2,
  BarChart3,
  MapPin,
  Clock,
  Quote,
  AlertCircle,
  Plus,
  X
} from 'lucide-react'
import {
  getSiteSettings,
  updateSiteSettings,
  type BusinessInfo,
  type SeoSettings,
  type SocialLinks,
  type AnalyticsSettings,
  type ServiceAreas,
  type OpeningHours,
  type ProudlyServingText
} from '@/actions/site-settings'

type TabType = 'business' | 'seo' | 'social' | 'analytics' | 'service-areas' | 'hours' | 'proudly-serving'

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export default function SiteSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('business')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  // Business Information - matches BusinessInfo type
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    latitude: 0,
    longitude: 0
  })

  // SEO Settings - matches SeoSettings type
  const [seoSettings, setSeoSettings] = useState<SeoSettings>({
    metaTitle: '',
    metaDescription: '',
    ogTitle: '',
    ogDescription: ''
  })

  // Social Links - matches SocialLinks type
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: '',
    facebook: '',
    tiktok: '',
    yelp: '',
    google: ''
  })

  // Analytics - matches AnalyticsSettings type
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings>({
    ga4MeasurementId: '',
    metaPixelId: ''
  })

  // Service Areas - matches ServiceAreas type
  const [serviceAreas, setServiceAreas] = useState<ServiceAreas>({ cities: [] })
  const [newCity, setNewCity] = useState('')

  // Opening Hours - matches OpeningHours type
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '08:00',
    closes: '19:30'
  })

  // Proudly Serving - matches ProudlyServingText type
  const [proudlyServing, setProudlyServing] = useState<ProudlyServingText>({ text: '' })

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const settings = await getSiteSettings()
      setBusinessInfo(settings.businessInfo)
      setSeoSettings(settings.seoSettings)
      setSocialLinks(settings.socialLinks)
      setAnalyticsSettings(settings.analyticsSettings)
      setServiceAreas(settings.serviceAreas)
      setOpeningHours(settings.openingHours)
      setProudlyServing(settings.proudlyServingText)
    } catch (error) {
      console.error('Error loading settings:', error)
      showToast('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleSave = async (section: string, data: Record<string, unknown>) => {
    setSaving(prev => ({ ...prev, [section]: true }))
    try {
      const result = await updateSiteSettings(section, data)
      if (result.success) {
        showToast('Settings saved successfully!', 'success')
      } else {
        showToast(result.error || 'Failed to save settings', 'error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }))
    }
  }

  const tabs = [
    { id: 'business' as TabType, label: 'Business Info', icon: Building2 },
    { id: 'seo' as TabType, label: 'SEO', icon: Search },
    { id: 'social' as TabType, label: 'Social Links', icon: Share2 },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'service-areas' as TabType, label: 'Service Areas', icon: MapPin },
    { id: 'hours' as TabType, label: 'Opening Hours', icon: Clock },
    { id: 'proudly-serving' as TabType, label: 'Proudly Serving', icon: Quote }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-lg border ${
              toast.type === 'success'
                ? 'bg-ocean-mist/90 border-ocean-mist text-dune backdrop-blur-sm'
                : 'bg-terracotta/90 border-terracotta text-cream backdrop-blur-sm'
            }`}>
              <div className="flex items-center gap-3">
                {toast.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{toast.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta/30 to-dusty-rose/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-terracotta" />
          </div>
          <div>
            <h1 className="h2 text-dune">Site Settings</h1>
            <p className="text-sm text-dune/60">Manage site-wide configuration and content</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 overflow-x-auto"
      >
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-dusty-rose to-terracotta text-cream shadow-md'
                    : 'bg-cream/60 text-dune/70 hover:bg-cream hover:text-dune border border-sage/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Business Information */}
          {activeTab === 'business' && (
            <div className="glass rounded-3xl p-8 border border-sage/20">
              <h2 className="font-serif text-2xl text-dune mb-6">Business Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="LashPop Studios"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="+1-760-212-0448"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="hello@lashpopstudios.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={businessInfo.streetAddress}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, streetAddress: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="429 S Coast Hwy"
                  />
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      City
                    </label>
                    <input
                      type="text"
                      value={businessInfo.city}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="Oceanside"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      State
                    </label>
                    <input
                      type="text"
                      value={businessInfo.state}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="CA"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={businessInfo.postalCode}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, postalCode: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="92054"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      Country
                    </label>
                    <input
                      type="text"
                      value={businessInfo.country}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, country: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="US"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={businessInfo.latitude}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="33.1959"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={businessInfo.longitude}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="-117.3795"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSave('business_info', businessInfo)}
                  disabled={saving.business_info}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.business_info ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.business_info ? 'Saving...' : 'Save Business Info'}
                </button>
              </div>
            </div>
          )}

          {/* SEO Settings */}
          {activeTab === 'seo' && (
            <div className="glass rounded-3xl p-8 border border-sage/20">
              <h2 className="font-serif text-2xl text-dune mb-6">SEO Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={seoSettings.metaTitle}
                    onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="LashPop Studios | Premier Lash Extensions in Oceanside"
                  />
                  <p className="text-xs text-dune/50 mt-1">Recommended: 50-60 characters</p>
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Meta Description
                  </label>
                  <textarea
                    value={seoSettings.metaDescription}
                    onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose resize-none"
                    placeholder="Experience luxury lash extensions at LashPop Studios..."
                  />
                  <p className="text-xs text-dune/50 mt-1">Recommended: 150-160 characters</p>
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Open Graph Title
                  </label>
                  <input
                    type="text"
                    value={seoSettings.ogTitle}
                    onChange={(e) => setSeoSettings({ ...seoSettings, ogTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="LashPop Studios - Elevate Your Lash Game"
                  />
                  <p className="text-xs text-dune/50 mt-1">For social media sharing</p>
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Open Graph Description
                  </label>
                  <textarea
                    value={seoSettings.ogDescription}
                    onChange={(e) => setSeoSettings({ ...seoSettings, ogDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose resize-none"
                    placeholder="Premium lash extensions by certified experts..."
                  />
                </div>

                <button
                  onClick={() => handleSave('seo_settings', seoSettings)}
                  disabled={saving.seo_settings}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.seo_settings ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.seo_settings ? 'Saving...' : 'Save SEO Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Social Links */}
          {activeTab === 'social' && (
            <div className="glass rounded-3xl p-8 border border-sage/20">
              <h2 className="font-serif text-2xl text-dune mb-6">Social Media Links</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.instagram || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://instagram.com/lashpopstudios"
                  />
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.facebook || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://facebook.com/lashpopstudios"
                  />
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    TikTok URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.tiktok || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://tiktok.com/@lashpopstudios"
                  />
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Yelp URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.yelp || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, yelp: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://yelp.com/biz/lashpop-studios"
                  />
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Google Business URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.google || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, google: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://g.page/lashpop-studios"
                  />
                </div>

                <button
                  onClick={() => handleSave('social_links', socialLinks)}
                  disabled={saving.social_links}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.social_links ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.social_links ? 'Saving...' : 'Save Social Links'}
                </button>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            <div className="glass rounded-3xl p-8 border border-sage/20">
              <h2 className="font-serif text-2xl text-dune mb-6">Analytics Settings</h2>
              <div className="space-y-6">
                <div className="p-4 bg-terracotta/10 rounded-2xl border border-terracotta/20">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-dune/70">
                      <strong>Important:</strong> Analytics IDs entered here are stored in the database.
                      Make sure to also configure the corresponding environment variables
                      (<code className="bg-dune/10 px-1 rounded">NEXT_PUBLIC_GA4_ID</code> and
                      <code className="bg-dune/10 px-1 rounded ml-1">NEXT_PUBLIC_META_PIXEL_ID</code>)
                      for tracking to work properly.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Google Analytics 4 Measurement ID
                  </label>
                  <input
                    type="text"
                    value={analyticsSettings.ga4MeasurementId || ''}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, ga4MeasurementId: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose font-mono text-sm"
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-dune/50 mt-1">Format: G-XXXXXXXXXX</p>
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Meta (Facebook) Pixel ID
                  </label>
                  <input
                    type="text"
                    value={analyticsSettings.metaPixelId || ''}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, metaPixelId: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose font-mono text-sm"
                    placeholder="123456789012345"
                  />
                  <p className="text-xs text-dune/50 mt-1">Format: 15-digit number</p>
                </div>

                <button
                  onClick={() => handleSave('analytics', analyticsSettings)}
                  disabled={saving.analytics}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.analytics ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.analytics ? 'Saving...' : 'Save Analytics Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Service Areas */}
          {activeTab === 'service-areas' && (
            <div className="glass rounded-3xl p-8 border border-sage/20">
              <h2 className="font-serif text-2xl text-dune mb-6">Service Areas</h2>
              <div className="space-y-6">
                <p className="text-sm text-dune/70">
                  Manage the list of cities and areas where you provide services.
                </p>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newCity.trim()) {
                        setServiceAreas({ cities: [...serviceAreas.cities, newCity.trim()] })
                        setNewCity('')
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="Enter city name..."
                  />
                  <button
                    onClick={() => {
                      if (newCity.trim()) {
                        setServiceAreas({ cities: [...serviceAreas.cities, newCity.trim()] })
                        setNewCity('')
                      }
                    }}
                    className="btn btn-primary px-4"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {serviceAreas.cities.length === 0 ? (
                    <div className="p-6 bg-terracotta/10 rounded-2xl border border-terracotta/20 text-center">
                      <MapPin className="w-8 h-8 text-terracotta mx-auto mb-2 opacity-70" />
                      <p className="text-sm text-dune/70">No service areas added yet</p>
                    </div>
                  ) : (
                    serviceAreas.cities.map((city, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-4 bg-white border border-sage/20 rounded-xl group hover:border-dusty-rose/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-dune/40" />
                          <span className="text-dune">{city}</span>
                        </div>
                        <button
                          onClick={() => setServiceAreas({ cities: serviceAreas.cities.filter((_, i) => i !== index) })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-terracotta/10 rounded-lg"
                        >
                          <X className="w-4 h-4 text-terracotta" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => handleSave('service_areas', serviceAreas)}
                  disabled={saving.service_areas}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.service_areas ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.service_areas ? 'Saving...' : 'Save Service Areas'}
                </button>
              </div>
            </div>
          )}

          {/* Opening Hours */}
          {activeTab === 'hours' && (
            <div className="glass rounded-3xl p-8 border border-sage/20">
              <h2 className="font-serif text-2xl text-dune mb-6">Opening Hours</h2>
              <div className="space-y-6">
                <p className="text-sm text-dune/70">
                  Set your standard opening and closing times. This applies to all selected days.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      Opens At
                    </label>
                    <input
                      type="time"
                      value={openingHours.opens}
                      onChange={(e) => setOpeningHours({ ...openingHours, opens: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      Closes At
                    </label>
                    <input
                      type="time"
                      value={openingHours.closes}
                      onChange={(e) => setOpeningHours({ ...openingHours, closes: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-3 block">
                    Days Open
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          const isSelected = openingHours.dayOfWeek.includes(day)
                          setOpeningHours({
                            ...openingHours,
                            dayOfWeek: isSelected
                              ? openingHours.dayOfWeek.filter(d => d !== day)
                              : [...openingHours.dayOfWeek, day]
                          })
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          openingHours.dayOfWeek.includes(day)
                            ? 'bg-gradient-to-r from-dusty-rose to-terracotta text-cream'
                            : 'bg-white border border-sage/20 text-dune/70 hover:border-dusty-rose/30'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSave('opening_hours', openingHours)}
                  disabled={saving.opening_hours}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.opening_hours ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.opening_hours ? 'Saving...' : 'Save Opening Hours'}
                </button>
              </div>
            </div>
          )}

          {/* Proudly Serving */}
          {activeTab === 'proudly-serving' && (
            <div className="glass rounded-3xl p-8 border border-sage/20">
              <h2 className="font-serif text-2xl text-dune mb-6">Proudly Serving</h2>
              <div className="space-y-6">
                <p className="text-sm text-dune/70">
                  This text appears in the footer to showcase the areas you serve.
                </p>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Footer Text
                  </label>
                  <textarea
                    value={proudlyServing.text}
                    onChange={(e) => setProudlyServing({ text: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose resize-none"
                    placeholder="Lash Extensions Oceanside • Lash Extensions Carlsbad • Lash Extensions Vista..."
                  />
                </div>

                <div className="p-4 bg-ocean-mist/10 rounded-2xl border border-ocean-mist/20">
                  <p className="text-xs text-dune/70">
                    <strong>Preview:</strong>
                  </p>
                  <p className="text-sm text-dune mt-2 italic">{proudlyServing.text || 'Enter text above to see preview...'}</p>
                </div>

                <button
                  onClick={() => handleSave('proudly_serving_text', proudlyServing)}
                  disabled={saving.proudly_serving_text}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.proudly_serving_text ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.proudly_serving_text ? 'Saving...' : 'Save Proudly Serving Text'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
