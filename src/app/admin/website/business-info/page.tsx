"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Save,
  Check,
  RefreshCw,
  Instagram,
  Facebook,
  ExternalLink
} from 'lucide-react'
import {
  BusinessContactSettings,
  BusinessLocationSettings,
  BusinessHoursSettings,
  SocialMediaSettings
} from '@/db/schema/site_settings'

export default function BusinessInfoEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'contact' | 'location' | 'hours' | 'social'>('contact')

  // Form state
  const [contact, setContact] = useState<BusinessContactSettings>({
    phone: '+17602120448',
    phoneDisplay: '+1 (760) 212-0448',
    email: 'hello@lashpopstudios.com'
  })

  const [location, setLocation] = useState<BusinessLocationSettings>({
    streetAddress: '429 S Coast Hwy',
    city: 'Oceanside',
    state: 'CA',
    zipCode: '92054',
    fullAddress: '429 S Coast Hwy, Oceanside, CA 92054',
    coordinates: { lat: 33.1959, lng: -117.3795 },
    googleMapsUrl: 'https://maps.app.goo.gl/mozm5VjGqw8qCuzL8'
  })

  const [hours, setHours] = useState<BusinessHoursSettings>({
    regularHours: '8a-7:30p every day',
    appointmentOnly: true,
    specialNote: 'by appointment only'
  })

  const [social, setSocial] = useState<SocialMediaSettings>({
    instagram: 'https://instagram.com/lashpopstudios',
    facebook: 'https://facebook.com/lashpopstudios'
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
        if (data.business) {
          if (data.business.contact) setContact(data.business.contact)
          if (data.business.location) setLocation(data.business.location)
          if (data.business.hours) setHours(data.business.hours)
          if (data.business.social) setSocial(data.business.social)
        }
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
      const response = await fetch('/api/admin/website/site-settings/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, location, hours, social })
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

  const updateContact = <K extends keyof BusinessContactSettings>(key: K, value: BusinessContactSettings[K]) => {
    setContact(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateLocation = <K extends keyof BusinessLocationSettings>(key: K, value: BusinessLocationSettings[K]) => {
    setLocation(prev => {
      const updated = { ...prev, [key]: value }
      // Auto-update full address when individual fields change
      if (['streetAddress', 'city', 'state', 'zipCode'].includes(key)) {
        updated.fullAddress = `${updated.streetAddress}, ${updated.city}, ${updated.state} ${updated.zipCode}`
      }
      return updated
    })
    setHasChanges(true)
  }

  const updateHours = <K extends keyof BusinessHoursSettings>(key: K, value: BusinessHoursSettings[K]) => {
    setHours(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateSocial = <K extends keyof SocialMediaSettings>(key: K, value: SocialMediaSettings[K]) => {
    setSocial(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const tabs = [
    { id: 'contact' as const, label: 'Contact', icon: Phone },
    { id: 'location' as const, label: 'Location', icon: MapPin },
    { id: 'hours' as const, label: 'Hours', icon: Clock },
    { id: 'social' as const, label: 'Social Media', icon: Globe }
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-mist/30 to-sage/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-ocean-mist" />
            </div>
            <div>
              <h1 className="h2 text-dune">Business Information</h1>
              <p className="text-sm text-dune/60">Contact details, location, hours, and social media</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} ${!hasChanges && !saved ? 'opacity-50' : ''}`}
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
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-ocean-mist/20 text-dune border border-ocean-mist/30'
                : 'bg-cream/50 text-dune/60 border border-sage/10 hover:border-sage/20'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content Panels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-3xl p-6 border border-sage/20"
      >
        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-ocean-mist" />
              <h3 className="font-serif text-lg text-dune">Contact Information</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Phone Number (Raw)
                </label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => updateContact('phone', e.target.value)}
                  placeholder="+17602120448"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
                <p className="text-xs text-dune/40 mt-1">Used for tel: links</p>
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Phone Display Format
                </label>
                <input
                  type="text"
                  value={contact.phoneDisplay || ''}
                  onChange={(e) => updateContact('phoneDisplay', e.target.value)}
                  placeholder="+1 (760) 212-0448"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
                <p className="text-xs text-dune/40 mt-1">How it appears on the site</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                  placeholder="hello@lashpopstudios.com"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-ocean-mist" />
              <h3 className="font-serif text-lg text-dune">Location & Address</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Street Address
                </label>
                <input
                  type="text"
                  value={location.streetAddress}
                  onChange={(e) => updateLocation('streetAddress', e.target.value)}
                  placeholder="429 S Coast Hwy"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  City
                </label>
                <input
                  type="text"
                  value={location.city}
                  onChange={(e) => updateLocation('city', e.target.value)}
                  placeholder="Oceanside"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    State
                  </label>
                  <input
                    type="text"
                    value={location.state}
                    onChange={(e) => updateLocation('state', e.target.value)}
                    placeholder="CA"
                    className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={location.zipCode}
                    onChange={(e) => updateLocation('zipCode', e.target.value)}
                    placeholder="92054"
                    className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                  />
                </div>
              </div>

              <div className="md:col-span-2 p-4 bg-sage/10 rounded-xl border border-sage/20">
                <p className="text-sm text-dune/70 mb-2">
                  <strong>Full Address:</strong>
                </p>
                <p className="font-medium text-dune">{location.fullAddress}</p>
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={location.coordinates.lat}
                  onChange={(e) => updateLocation('coordinates', { ...location.coordinates, lat: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={location.coordinates.lng}
                  onChange={(e) => updateLocation('coordinates', { ...location.coordinates, lng: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Google Maps URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={location.googleMapsUrl}
                    onChange={(e) => updateLocation('googleMapsUrl', e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="flex-1 px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                  />
                  <a
                    href={location.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs text-dune/40 mt-1">Share link from Google Maps for directions</p>
              </div>
            </div>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-ocean-mist" />
              <h3 className="font-serif text-lg text-dune">Hours of Operation</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Regular Hours
                </label>
                <input
                  type="text"
                  value={hours.regularHours}
                  onChange={(e) => updateHours('regularHours', e.target.value)}
                  placeholder="8a-7:30p every day"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
                <p className="text-xs text-dune/40 mt-1">Displayed as the main hours text</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-cream/50 border border-sage/20 rounded-xl">
                <div>
                  <p className="text-sm text-dune font-medium">By Appointment Only</p>
                  <p className="text-xs text-dune/50">Show "by appointment only" notice</p>
                </div>
                <div
                  onClick={() => updateHours('appointmentOnly', !hours.appointmentOnly)}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                    hours.appointmentOnly ? 'bg-ocean-mist' : 'bg-sage/30'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    hours.appointmentOnly ? 'left-6' : 'left-1'
                  }`} />
                </div>
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Special Note
                </label>
                <input
                  type="text"
                  value={hours.specialNote || ''}
                  onChange={(e) => updateHours('specialNote', e.target.value)}
                  placeholder="by appointment only"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
                <p className="text-xs text-dune/40 mt-1">Additional note shown with hours</p>
              </div>

              {/* Preview */}
              <div className="p-4 bg-sage/10 rounded-xl border border-sage/20">
                <p className="text-sm text-dune/70 mb-2">
                  <strong>Preview:</strong>
                </p>
                <p className="font-medium text-dune">
                  {hours.regularHours}
                  {hours.appointmentOnly && hours.specialNote && (
                    <span className="text-dune/60"> — {hours.specialNote}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-ocean-mist" />
              <h3 className="font-serif text-lg text-dune">Social Media Links</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={social.instagram || ''}
                  onChange={(e) => updateSocial('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={social.facebook || ''}
                  onChange={(e) => updateSocial('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  TikTok
                </label>
                <input
                  type="url"
                  value={social.tiktok || ''}
                  onChange={(e) => updateSocial('tiktok', e.target.value)}
                  placeholder="https://tiktok.com/@yourusername"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Yelp
                </label>
                <input
                  type="url"
                  value={social.yelp || ''}
                  onChange={(e) => updateSocial('yelp', e.target.value)}
                  placeholder="https://yelp.com/biz/yourbusiness"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Google Business
                </label>
                <input
                  type="url"
                  value={social.google || ''}
                  onChange={(e) => updateSocial('google', e.target.value)}
                  placeholder="https://g.page/yourbusiness"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-ocean-mist transition-colors"
                />
              </div>
            </div>

            <div className="p-4 bg-ocean-mist/10 rounded-xl border border-ocean-mist/20">
              <p className="text-xs text-dune/70">
                <strong>Tip:</strong> Only filled links will be displayed on your website.
                Leave fields empty to hide that social platform.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
