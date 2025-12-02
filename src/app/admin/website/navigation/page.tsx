"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Navigation,
  Menu,
  Link as LinkIcon,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  Check,
  RefreshCw,
  FileText,
  Mail
} from 'lucide-react'
import {
  NavigationSettings,
  FooterSettings,
  NavLinkItem
} from '@/db/schema/site_settings'

export default function NavigationFooterEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'header' | 'footer' | 'policies' | 'newsletter'>('header')

  const [navigation, setNavigation] = useState<NavigationSettings>({
    headerLinks: [
      { id: 'about', label: 'About', href: '#about', enabled: true, order: 0 },
      { id: 'services', label: 'Services', href: '#services', enabled: true, order: 1 },
      { id: 'team', label: 'Team', href: '#team', enabled: true, order: 2 },
      { id: 'contact', label: 'Contact', href: '#contact', enabled: true, order: 3 }
    ],
    footerServiceLinks: [
      { id: 'classic', label: 'Classic Lashes', href: '#services', enabled: true, order: 0 },
      { id: 'volume', label: 'Volume Lashes', href: '#services', enabled: true, order: 1 },
      { id: 'hybrid', label: 'Hybrid Lashes', href: '#services', enabled: true, order: 2 },
      { id: 'lift', label: 'Lash Lift & Tint', href: '#services', enabled: true, order: 3 },
      { id: 'brows', label: 'Brow Services', href: '#services', enabled: true, order: 4 }
    ],
    ctaButtonText: 'Book Now'
  })

  const [footer, setFooter] = useState<FooterSettings>({
    showNewsletter: true,
    newsletterTitle: 'Stay Connected',
    newsletterDescription: 'Subscribe for exclusive offers and beauty tips',
    copyrightText: '© {year} LashPop Studios. All rights reserved.',
    policyLinks: {
      privacyPolicy: '#',
      termsOfService: '#',
      cancellationPolicy: '#'
    }
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
        if (data.navigation) setNavigation(data.navigation)
        if (data.footer) setFooter(data.footer)
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
      const response = await fetch('/api/admin/website/site-settings/navigation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navigation, footer })
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

  const updateNavigation = <K extends keyof NavigationSettings>(key: K, value: NavigationSettings[K]) => {
    setNavigation(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateFooter = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    setFooter(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Link management functions
  const addLink = (type: 'headerLinks' | 'footerServiceLinks') => {
    const links = navigation[type]
    const newLink: NavLinkItem = {
      id: `link-${Date.now()}`,
      label: 'New Link',
      href: '#',
      enabled: true,
      order: links.length
    }
    updateNavigation(type, [...links, newLink])
  }

  const removeLink = (type: 'headerLinks' | 'footerServiceLinks', index: number) => {
    const links = navigation[type].filter((_, i) => i !== index)
    updateNavigation(type, links)
  }

  const updateLink = (type: 'headerLinks' | 'footerServiceLinks', index: number, updates: Partial<NavLinkItem>) => {
    const links = [...navigation[type]]
    links[index] = { ...links[index], ...updates }
    updateNavigation(type, links)
  }

  const moveLink = (type: 'headerLinks' | 'footerServiceLinks', index: number, direction: 'up' | 'down') => {
    const links = [...navigation[type]]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < links.length) {
      [links[index], links[newIndex]] = [links[newIndex], links[index]]
      // Update order values
      links.forEach((link, i) => { link.order = i })
      updateNavigation(type, links)
    }
  }

  const tabs = [
    { id: 'header' as const, label: 'Header Nav', icon: Menu },
    { id: 'footer' as const, label: 'Footer Links', icon: LinkIcon },
    { id: 'policies' as const, label: 'Policy Pages', icon: FileText },
    { id: 'newsletter' as const, label: 'Newsletter', icon: Mail }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  const LinkEditor = ({
    links,
    type,
    title
  }: {
    links: NavLinkItem[]
    type: 'headerLinks' | 'footerServiceLinks'
    title: string
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-dune">{title}</h4>
        <button
          onClick={() => addLink(type)}
          className="text-xs text-golden hover:text-golden/80 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Link
        </button>
      </div>

      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={link.id}
            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
              link.enabled ? 'bg-cream/50 border-sage/20' : 'bg-dune/5 border-dune/10'
            }`}
          >
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveLink(type, index, 'up')}
                disabled={index === 0}
                className="text-dune/30 hover:text-dune/60 disabled:opacity-30"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <GripVertical className="w-3 h-3 text-dune/30" />
              <button
                onClick={() => moveLink(type, index, 'down')}
                disabled={index === links.length - 1}
                className="text-dune/30 hover:text-dune/60 disabled:opacity-30"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Label */}
            <input
              type="text"
              value={link.label}
              onChange={(e) => updateLink(type, index, { label: e.target.value })}
              placeholder="Link Label"
              className="flex-1 px-3 py-1.5 bg-white border border-sage/20 rounded-lg text-sm focus:outline-none focus:border-golden"
            />

            {/* URL */}
            <input
              type="text"
              value={link.href}
              onChange={(e) => updateLink(type, index, { href: e.target.value })}
              placeholder="#section"
              className="w-32 px-3 py-1.5 bg-white border border-sage/20 rounded-lg text-sm font-mono focus:outline-none focus:border-golden"
            />

            {/* Toggle */}
            <button
              onClick={() => updateLink(type, index, { enabled: !link.enabled })}
              className={`p-1.5 rounded-lg transition-colors ${
                link.enabled ? 'text-golden hover:bg-golden/10' : 'text-dune/30 hover:bg-dune/5'
              }`}
            >
              {link.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Delete */}
            <button
              onClick={() => removeLink(type, index)}
              className="p-1.5 text-terracotta/50 hover:text-terracotta hover:bg-terracotta/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-golden/30 to-terracotta/20 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-golden" />
            </div>
            <div>
              <h1 className="h2 text-dune">Navigation & Footer</h1>
              <p className="text-sm text-dune/60">Manage site navigation and footer content</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`btn ${saved ? 'btn-secondary bg-golden/20 border-golden/30' : 'btn-primary'} ${!hasChanges && !saved ? 'opacity-50' : ''}`}
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
                ? 'bg-golden/20 text-dune border border-golden/30'
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
        {/* Header Nav Tab */}
        {activeTab === 'header' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Menu className="w-5 h-5 text-golden" />
              <h3 className="font-serif text-lg text-dune">Header Navigation</h3>
            </div>

            <LinkEditor
              links={navigation.headerLinks}
              type="headerLinks"
              title="Navigation Links"
            />

            <div className="pt-4 border-t border-sage/10">
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                CTA Button Text
              </label>
              <input
                type="text"
                value={navigation.ctaButtonText}
                onChange={(e) => updateNavigation('ctaButtonText', e.target.value)}
                placeholder="Book Now"
                className="w-full max-w-xs px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-golden transition-colors"
              />
              <p className="text-xs text-dune/40 mt-1">Text on the main call-to-action button</p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-dune rounded-xl">
              <p className="text-xs text-cream/50 uppercase tracking-wider mb-3">Preview</p>
              <div className="flex items-center justify-between">
                <span className="text-cream font-serif">LashPop</span>
                <div className="flex items-center gap-6">
                  {navigation.headerLinks.filter(l => l.enabled).map(link => (
                    <span key={link.id} className="text-cream/70 text-sm">{link.label}</span>
                  ))}
                  <span className="px-4 py-1.5 bg-dusty-rose text-cream text-sm rounded-full">
                    {navigation.ctaButtonText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Links Tab */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-golden" />
              <h3 className="font-serif text-lg text-dune">Footer Service Links</h3>
            </div>

            <LinkEditor
              links={navigation.footerServiceLinks}
              type="footerServiceLinks"
              title="Quick Links in Footer"
            />

            <div className="p-4 bg-golden/10 rounded-xl border border-golden/20">
              <p className="text-xs text-dune/70">
                <strong>Tip:</strong> These links appear under &quot;Services&quot; in the footer.
                Link to specific sections or external pages.
              </p>
            </div>
          </div>
        )}

        {/* Policy Pages Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-golden" />
              <h3 className="font-serif text-lg text-dune">Policy Page Links</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Privacy Policy URL
                </label>
                <input
                  type="text"
                  value={footer.policyLinks?.privacyPolicy || ''}
                  onChange={(e) => updateFooter('policyLinks', { ...footer.policyLinks, privacyPolicy: e.target.value })}
                  placeholder="/privacy-policy or #"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-golden transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Terms of Service URL
                </label>
                <input
                  type="text"
                  value={footer.policyLinks?.termsOfService || ''}
                  onChange={(e) => updateFooter('policyLinks', { ...footer.policyLinks, termsOfService: e.target.value })}
                  placeholder="/terms or #"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-golden transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Cancellation Policy URL
                </label>
                <input
                  type="text"
                  value={footer.policyLinks?.cancellationPolicy || ''}
                  onChange={(e) => updateFooter('policyLinks', { ...footer.policyLinks, cancellationPolicy: e.target.value })}
                  placeholder="/cancellation-policy or #"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-golden transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Copyright Text
                </label>
                <input
                  type="text"
                  value={footer.copyrightText}
                  onChange={(e) => updateFooter('copyrightText', e.target.value)}
                  placeholder="© {year} Company Name. All rights reserved."
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-golden transition-colors"
                />
                <p className="text-xs text-dune/40 mt-1">Use {'{year}'} to auto-insert current year</p>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Tab */}
        {activeTab === 'newsletter' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-golden" />
              <h3 className="font-serif text-lg text-dune">Newsletter Settings</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-cream/50 border border-sage/20 rounded-xl">
              <div>
                <p className="text-sm text-dune font-medium">Show Newsletter Section</p>
                <p className="text-xs text-dune/50">Display newsletter signup in footer</p>
              </div>
              <div
                onClick={() => updateFooter('showNewsletter', !footer.showNewsletter)}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                  footer.showNewsletter ? 'bg-golden' : 'bg-sage/30'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  footer.showNewsletter ? 'left-6' : 'left-1'
                }`} />
              </div>
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                Newsletter Title
              </label>
              <input
                type="text"
                value={footer.newsletterTitle}
                onChange={(e) => updateFooter('newsletterTitle', e.target.value)}
                placeholder="Stay Connected"
                className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-golden transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                Newsletter Description
              </label>
              <textarea
                value={footer.newsletterDescription}
                onChange={(e) => updateFooter('newsletterDescription', e.target.value)}
                placeholder="Subscribe for exclusive offers and beauty tips"
                rows={2}
                className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-golden transition-colors resize-none"
              />
            </div>

            {/* Preview */}
            <div className="p-4 bg-cream rounded-xl border border-sage/20">
              <p className="text-xs text-dune/50 uppercase tracking-wider mb-3">Preview</p>
              <div className="max-w-xs">
                <h4 className="font-medium text-dune mb-1">{footer.newsletterTitle}</h4>
                <p className="text-sm text-dune/60 mb-3">{footer.newsletterDescription}</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 border border-sage/20 rounded-lg text-sm"
                    disabled
                  />
                  <button className="px-4 py-2 bg-dusty-rose text-cream text-sm rounded-lg" disabled>
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
