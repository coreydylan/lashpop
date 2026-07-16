"use client"

import { useCallback, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Instagram, RefreshCw, Settings, AlertCircle, ExternalLink, Heart, MessageCircle, Save, Check } from 'lucide-react'
import Link from 'next/link'
import { useDirtyBlock } from '@/components/admin-shell/useDirtyBlock'

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
      if (!response.ok) throw new Error(data?.error ?? `Failed to load settings (${response.status})`)
      if (data.settings) {
        setSettings(data.settings)
        setSavedSettings(data.settings)
        setBaseVersion(data.version)
        setSourceOwner(data.sourceOwner)
        setConflict(false)
      }
    } catch (error) {
      console.error('Error fetching Instagram settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to load Instagram settings')
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
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Failed to save settings')
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta/30 to-dusty-rose/20 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <h1 className="h2 text-dune">Instagram Carousel</h1>
              <p className="text-sm text-dune/60">Social media feed display settings</p>
              <p className="text-xs text-dune/45">
                {baseVersion === 0 ? 'Not published yet' : `Version ${baseVersion}`} · Source: {sourceOwner}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchInstagramPosts}
              className="btn btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Posts
            </button>
            <button
              onClick={() => void save().catch(() => undefined)}
              disabled={saving || !dirty}
              className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} ${!dirty && !saved ? 'opacity-50' : ''}`}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-terracotta/25 bg-terracotta/10 p-4 text-sm text-terracotta" role="alert">
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
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-dune/60" />
              <h3 className="font-serif text-lg text-dune">Display Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Max Posts */}
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Number of Posts
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
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
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Scroll Speed
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
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
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-dune/70 group-hover:text-dune transition-colors">
                    Auto-scroll
                  </span>
                  <div 
                    onClick={() => updateSetting('autoScroll', !settings.autoScroll)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                      settings.autoScroll ? 'bg-terracotta' : 'bg-sage/30'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings.autoScroll ? 'left-6' : 'left-1'
                    }`} />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-4 bg-terracotta/10 rounded-2xl border border-terracotta/20">
            <p className="text-xs text-dune/70">
              <strong>Note:</strong> Instagram posts are synced automatically via the DAM. 
              Posts tagged with <code className="bg-dune/10 px-1 rounded">Source: Instagram</code> 
              will appear in this carousel.
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
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-dune">Instagram Posts</h3>
              <span className="text-sm text-dune/50">
                Showing {Math.min(posts.length, settings.maxPosts)} of {posts.length}
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="p-8 bg-terracotta/10 rounded-2xl border border-terracotta/20 text-center">
                <AlertCircle className="w-10 h-10 text-terracotta mx-auto mb-3 opacity-70" />
                <p className="text-sm text-dune font-medium">No Instagram posts found</p>
                <p className="text-xs text-dune/60 mt-1">
                  Sync your Instagram posts in the DAM to display them here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {posts.slice(0, settings.maxPosts).filter(p => p.url && p.url.length > 0).map((post, index) => (
                  <div
                    key={post.id}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <Image
                      src={post.url}
                      alt={post.caption || `Instagram post ${index + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
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
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
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
