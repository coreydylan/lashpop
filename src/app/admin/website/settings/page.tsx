"use client"

import { useState, useEffect } from 'react'
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
import { getSiteSettings, updateSiteSettings } from '@/actions/site-settings'

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

  // Business Information
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      coordinates: { lat: 0, lng: 0 }
    }
  })

  // SEO Settings
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: '',
    metaDescription: '',
    ogTitle: '',
    ogDescription: ''
  })

  // Social Links
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    facebook: '',
    tiktok: '',
    yelp: '',
    google: ''
  })

  // Analytics
  const [analyticsSettings, setAnalyticsSettings] = useState({
    ga4MeasurementId: '',
    metaPixelId: ''
  })

  // Service Areas
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [newCity, setNewCity] = useState('')

  // Opening Hours
  const [openingHours, setOpeningHours] = useState({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true }
  })

  // Proudly Serving
  const [proudlyServing, setProudlyServing] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const settings = await getSiteSettings()
      if (settings.businessInfo) setBusinessInfo(settings.businessInfo)
      if (settings.seoSettings) setSeoSettings(settings.seoSettings)
      if (settings.socialLinks) setSocialLinks(settings.socialLinks)
      if (settings.analyticsSettings) setAnalyticsSettings(settings.analyticsSettings)
      if (settings.serviceAreas) setServiceAreas(settings.serviceAreas)
      if (settings.openingHours) setOpeningHours(settings.openingHours)
      if (settings.proudlyServing) setProudlyServing(settings.proudlyServing)
    } catch (error) {
      console.error('Error loading settings:', error)
      showToast('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleSave = async (section: string, data: any) => {
    setSaving(prev => ({ ...prev, [section]: true }))
    try {
      await updateSiteSettings(section, data)
      showToast('Settings saved successfully!', 'success')
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
                    placeholder="LashPop Studio"
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
                      placeholder="(555) 123-4567"
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
                      placeholder="hello@lashpop.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={businessInfo.address.street}
                    onChange={(e) => setBusinessInfo({
                      ...businessInfo,
                      address: { ...businessInfo.address, street: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      City
                    </label>
                    <input
                      type="text"
                      value={businessInfo.address.city}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: { ...businessInfo.address, city: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="San Diego"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      State
                    </label>
                    <input
                      type="text"
                      value={businessInfo.address.state}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: { ...businessInfo.address, state: e.target.value }
                      })}
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
                      value={businessInfo.address.zip}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: { ...businessInfo.address, zip: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="92101"
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
                      value={businessInfo.address.coordinates.lat}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: {
                          ...businessInfo.address,
                          coordinates: {
                            ...businessInfo.address.coordinates,
                            lat: parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="32.715736"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={businessInfo.address.coordinates.lng}
                      onChange={(e) => setBusinessInfo({
                        ...businessInfo,
                        address: {
                          ...businessInfo.address,
                          coordinates: {
                            ...businessInfo.address.coordinates,
                            lng: parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                      placeholder="-117.161087"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSave('businessInfo', businessInfo)}
                  disabled={saving.businessInfo}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.businessInfo ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.businessInfo ? 'Saving...' : 'Save Business Info'}
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
                    placeholder="LashPop - Premium Lash Extensions in San Diego"
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
                    placeholder="Experience luxury lash extensions at LashPop Studio. Expert technicians, premium products, and stunning results."
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
                    placeholder="LashPop - Elevate Your Lash Game"
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
                    placeholder="Premium lash extensions by certified experts. Book your appointment today and experience the LashPop difference."
                  />
                </div>

                <button
                  onClick={() => handleSave('seoSettings', seoSettings)}
                  disabled={saving.seoSettings}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.seoSettings ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.seoSettings ? 'Saving...' : 'Save SEO Settings'}
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
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://instagram.com/lashpop"
                  />
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.facebook}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://facebook.com/lashpop"
                  />
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    TikTok URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.tiktok}
                    onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://tiktok.com/@lashpop"
                  />
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Yelp URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.yelp}
                    onChange={(e) => setSocialLinks({ ...socialLinks, yelp: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://yelp.com/biz/lashpop-studio"
                  />
                </div>

                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    Google Business URL
                  </label>
                  <input
                    type="url"
                    value={socialLinks.google}
                    onChange={(e) => setSocialLinks({ ...socialLinks, google: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="https://g.page/lashpop-studio"
                  />
                </div>

                <button
                  onClick={() => handleSave('socialLinks', socialLinks)}
                  disabled={saving.socialLinks}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.socialLinks ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.socialLinks ? 'Saving...' : 'Save Social Links'}
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
                      <strong>Important:</strong> Analytics IDs entered here are for display purposes.
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
                    value={analyticsSettings.ga4MeasurementId}
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
                    value={analyticsSettings.metaPixelId}
                    onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, metaPixelId: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose font-mono text-sm"
                    placeholder="123456789012345"
                  />
                  <p className="text-xs text-dune/50 mt-1">Format: 15-digit number</p>
                </div>

                <button
                  onClick={() => handleSave('analyticsSettings', analyticsSettings)}
                  disabled={saving.analyticsSettings}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.analyticsSettings ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.analyticsSettings ? 'Saving...' : 'Save Analytics Settings'}
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
                        setServiceAreas([...serviceAreas, newCity.trim()])
                        setNewCity('')
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose"
                    placeholder="Enter city name..."
                  />
                  <button
                    onClick={() => {
                      if (newCity.trim()) {
                        setServiceAreas([...serviceAreas, newCity.trim()])
                        setNewCity('')
                      }
                    }}
                    className="btn btn-primary px-4"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {serviceAreas.length === 0 ? (
                    <div className="p-6 bg-terracotta/10 rounded-2xl border border-terracotta/20 text-center">
                      <MapPin className="w-8 h-8 text-terracotta mx-auto mb-2 opacity-70" />
                      <p className="text-sm text-dune/70">No service areas added yet</p>
                    </div>
                  ) : (
                    serviceAreas.map((city, index) => (
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
                          onClick={() => setServiceAreas(serviceAreas.filter((_, i) => i !== index))}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-terracotta/10 rounded-lg"
                        >
                          <X className="w-4 h-4 text-terracotta" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => handleSave('serviceAreas', serviceAreas)}
                  disabled={saving.serviceAreas}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.serviceAreas ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.serviceAreas ? 'Saving...' : 'Save Service Areas'}
                </button>
              </div>
            </div>
          )}

          {/* Opening Hours */}
          {activeTab === 'hours' && (
            <div className="glass rounded-3xl p-8 border border-sage/20">
              <h2 className="font-serif text-2xl text-dune mb-6">Opening Hours</h2>
              <div className="space-y-4">
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day} className="p-4 bg-white border border-sage/20 rounded-xl">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-dune font-medium capitalize min-w-[100px]">{day}</span>

                        {!hours.closed ? (
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => setOpeningHours({
                                ...openingHours,
                                [day]: { ...hours, open: e.target.value }
                              })}
                              className="px-3 py-2 bg-cream/50 border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose text-sm"
                            />
                            <span className="text-dune/40">to</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => setOpeningHours({
                                ...openingHours,
                                [day]: { ...hours, close: e.target.value }
                              })}
                              className="px-3 py-2 bg-cream/50 border border-sage/20 rounded-lg focus:outline-none focus:border-dusty-rose text-sm"
                            />
                          </div>
                        ) : (
                          <span className="text-dune/40 italic">Closed</span>
                        )}
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) => setOpeningHours({
                            ...openingHours,
                            [day]: { ...hours, closed: e.target.checked }
                          })}
                          className="w-4 h-4 text-terracotta border-sage/30 rounded focus:ring-dusty-rose"
                        />
                        <span className="text-sm text-dune/70">Closed</span>
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleSave('openingHours', openingHours)}
                  disabled={saving.openingHours}
                  className="btn btn-primary w-full md:w-auto mt-4"
                >
                  {saving.openingHours ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.openingHours ? 'Saving...' : 'Save Opening Hours'}
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
                    value={proudlyServing}
                    onChange={(e) => setProudlyServing(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-sage/20 rounded-xl focus:outline-none focus:border-dusty-rose resize-none"
                    placeholder="Proudly serving San Diego, La Jolla, Del Mar, Encinitas, and surrounding areas with premium lash services."
                  />
                </div>

                <div className="p-4 bg-ocean-mist/10 rounded-2xl border border-ocean-mist/20">
                  <p className="text-xs text-dune/70">
                    <strong>Preview:</strong>
                  </p>
                  <p className="text-sm text-dune mt-2 italic">{proudlyServing || 'Enter text above to see preview...'}</p>
                </div>

                <button
                  onClick={() => handleSave('proudlyServing', proudlyServing)}
                  disabled={saving.proudlyServing}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {saving.proudlyServing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving.proudlyServing ? 'Saving...' : 'Save Proudly Serving Text'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
