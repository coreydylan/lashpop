"use client"

import { useCallback, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Instagram, RefreshCw, Settings, AlertCircle, ExternalLink, Heart, MessageCircle, Save, Check } from 'lucide-react'
import Link from 'next/link'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'
import { websiteSettingStatusLabel } from '@/lib/admin/settings-copy'

interface InstagramPost {
  id: string
  url: string
  caption?: string
  likes?: number
  comments?: number
  timestamp?: string
}

interface InstagramDamAsset {
  id: string
  filePath: string
  caption?: string
  sourceMetadata?: {
    likeCount?: number
    commentCount?: number
    timestamp?: string
  }
}

interface InstagramSettings {
  maxPosts: number
  showCaptions: boolean
  autoScroll: boolean
  scrollSpeed: number
}

const DEFAULT_INSTAGRAM_SETTINGS: InstagramSettings = {
  maxPosts: 12,
  showCaptions: false,
  autoScroll: true,
  scrollSpeed: 20,
}

export default function InstagramCarouselEditor() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [baseVersion, setBaseVersion] = useState(0)
  const [sourceOwner, setSourceOwner] = useState('admin')
  const [settings, setSettings] = useState<InstagramSettings>(DEFAULT_INSTAGRAM_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<InstagramSettings>(DEFAULT_INSTAGRAM_SETTINGS)

  useEffect(() => {
    fetchInstagramSettings()
    fetchInstagramPosts()
  }, [])

  const fetchInstagramSettings = async () => {
    setError(null)
    try {
      const response = await fetch('/api/admin/website/instagram')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error ?? 'Could not load the Instagram settings. Refresh the page and try again.')
      if (data.settings) {
        setSettings(data.settings)
        setSavedSettings(data.settings)
        setBaseVersion(data.version)
        setSourceOwner(data.sourceOwner)
        setConflict(false)
      }
    } catch (error) {
      console.error('Error fetching Instagram settings:', error)
      setError(error instanceof Error ? error.message : 'Could not load the Instagram settings. Refresh the page and try again.')
    }
  }

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/website/instagram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, baseVersion })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 409 && data?.conflict) {
          setConflict(true)
          throw new Error('Someone saved a newer version while this page was open. Load the latest version to replace your unsaved changes.')
        }
        throw new Error(data?.error ?? 'Could not save the Instagram settings. Try again.')
      }
      setSettings(data.settings)
      setSavedSettings(data.settings)
      setBaseVersion(data.version)
      setSourceOwner(data.sourceOwner)
      setConflict(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Could not save the Instagram settings. Try again.')
      console.error('Error saving settings:', saveError)
      setError(saveError.message)
      throw saveError
    } finally {
      setSaving(false)
    }
  }, [baseVersion, settings])

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)
  const discard = useCallback(() => {
    setSettings(savedSettings)
    setError(null)
    setConflict(false)
    setSaved(false)
  }, [savedSettings])

  useDirtyBlock({
    id: 'instagram-settings',
    label: 'Instagram carousel settings',
    dirty,
    save,
    discard,
  })

  const fetchInstagramPosts = async () => {
    setLoading(true)
    try {
      // Fetch images tagged as Instagram posts from DAM
      const response = await fetch('/api/dam/assets?tag=source:instagram')
      if (response.ok) {
        const data = await response.json()
        const assets = Array.isArray(data.assets) ? data.assets as InstagramDamAsset[] : []
        setPosts(assets.map((asset) => ({
          id: asset.id,
          url: asset.filePath,
          caption: asset.caption,
          likes: asset.sourceMetadata?.likeCount || 0,
          comments: asset.sourceMetadata?.commentCount || 0,
          timestamp: asset.sourceMetadata?.timestamp
        })))
      }
    } catch (error) {
      console.error('Error fetching Instagram posts:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="grid gap-4 sm:flex sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta/30 to-dusty-rose/20 sm:flex">
              <Instagram className="w-6 h-6 text-terracotta" />
            </div>
            <div className="min-w-0">
              <h1 className="h2 text-dune">Instagram posts</h1>
              <p className="text-sm text-dune/60">Choose how imported Instagram posts appear on the homepage.</p>
              <p className="text-xs text-dune/45">
                {websiteSettingStatusLabel(sourceOwner, baseVersion)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <button
              onClick={fetchInstagramPosts}
              className="btn btn-secondary min-w-0 w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh posts
            </button>
            <button
              onClick={() => void save().catch(() => undefined)}
              disabled={saving || !dirty}
              className={`btn min-w-0 w-full sm:w-auto ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} ${!dirty && !saved ? 'opacity-50' : ''}`}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-terracotta/25 bg-terracotta/10 p-4 text-sm text-terracotta sm:flex-row sm:items-center" role="alert">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="min-w-0 flex-1">{error}</p>
          {conflict && (
            <button type="button" onClick={() => void fetchInstagramSettings()} className="btn btn-secondary text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Discard edits &amp; load latest
            </button>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="glass rounded-lg border border-sage/20 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-dune/60" />
              <h3 className="font-serif text-lg text-dune">Display settings</h3>
            </div>

            <div className="space-y-6">
              {/* Max Posts */}
              <div>
                <label htmlFor="instagram-max-posts" className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Posts shown
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="instagram-max-posts"
                    min="4"
                    max="24"
                    value={settings.maxPosts}
                    onChange={(e) => updateSetting('maxPosts', parseInt(e.target.value))}
                    className="flex-1 accent-terracotta"
                  />
                  <span className="text-sm text-dune w-8 text-right">{settings.maxPosts}</span>
                </div>
              </div>

              {/* Scroll Speed */}
              <div>
                <label htmlFor="instagram-scroll-speed" className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Automatic scroll speed (higher is faster)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="instagram-scroll-speed"
                    min="10"
                    max="40"
                    value={settings.scrollSpeed}
                    onChange={(e) => updateSetting('scrollSpeed', parseInt(e.target.value))}
                    className="flex-1 accent-terracotta"
                  />
                  <span className="text-sm text-dune w-12 text-right">{settings.scrollSpeed}</span>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3 pt-2">
                <SettingToggle
                  label="Auto-scroll"
                  description="Move the gallery automatically until a visitor interacts with it."
                  checked={settings.autoScroll}
                  onChange={(checked) => updateSetting('autoScroll', checked)}
                />
                <SettingToggle
                  label="Show captions"
                  description="Show Instagram captions on gallery cards and in the photo viewer."
                  checked={settings.showCaptions}
                  onChange={(checked) => updateSetting('showCaptions', checked)}
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 rounded-lg border border-terracotta/20 bg-terracotta/10 p-4">
            <p className="text-xs text-dune/70">
              Instagram posts imported into Media appear here automatically. Refresh this page after an import.
            </p>
          </div>
        </motion.div>

        {/* Posts Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="glass rounded-lg border border-sage/20 p-4 sm:p-6">
            <div className="mb-6 grid gap-1 sm:flex sm:items-center sm:justify-between">
              <h3 className="font-serif text-lg text-dune">Imported posts</h3>
              <span className="text-sm text-dune/50">
                Showing {Math.min(posts.length, settings.maxPosts)} of {posts.length}
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-lg border border-terracotta/20 bg-terracotta/10 p-8 text-center">
                <AlertCircle className="w-10 h-10 text-terracotta mx-auto mb-3 opacity-70" />
                <p className="text-sm text-dune font-medium">No Instagram posts found</p>
                <p className="text-xs text-dune/60 mt-1">
                  Import Instagram posts in Media, then refresh this page.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
                {posts.slice(0, settings.maxPosts).filter(p => p.url && p.url.length > 0).map((post, index) => (
                  <div
                    key={post.id}
                    className="group relative aspect-square overflow-hidden rounded-md sm:rounded-lg"
                  >
                    <Image
                      src={post.url}
                      alt={post.caption || `Instagram post ${index + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-black/55 px-2 py-2 text-white opacity-100 transition-opacity sm:inset-0 sm:gap-4 sm:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100">
                      {post.likes !== undefined && (
                        <div className="flex items-center gap-1 text-white text-sm">
                          <Heart className="w-4 h-4" />
                          {post.likes}
                        </div>
                      )}
                      {post.comments !== undefined && (
                        <div className="flex items-center gap-1 text-white text-sm">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments}
                        </div>
                      )}
                    </div>

                    {/* Index Badge */}
                    <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-sage/15 bg-white/40 p-3">
      <div>
        <p className="text-sm font-medium text-dune/75">{label}</p>
        <p className="mt-1 text-xs leading-5 text-dune/50">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-11 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-rose/50 ${
          checked ? 'bg-terracotta' : 'bg-sage/30'
        }`}
      >
        <span className={`absolute top-2.5 size-6 rounded-full bg-white shadow-sm transition-transform ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )
}
