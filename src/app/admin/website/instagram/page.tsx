"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Instagram, RefreshCw, Settings, AlertCircle, ExternalLink, Heart, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface InstagramPost {
  id: string
  url: string
  caption?: string
  likes?: number
  comments?: number
  timestamp?: string
}

export default function InstagramCarouselEditor() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    maxPosts: 12,
    showCaptions: false,
    autoScroll: true,
    scrollSpeed: 20
  })

  useEffect(() => {
    fetchInstagramPosts()
  }, [])

  const fetchInstagramPosts = async () => {
    setLoading(true)
    try {
      // Fetch images tagged as Instagram posts from DAM
      const response = await fetch('/api/dam/assets?tag=source:instagram')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.assets?.map((asset: any) => ({
          id: asset.id,
          url: asset.filePath,
          caption: asset.caption,
          likes: asset.sourceMetadata?.likeCount || 0,
          comments: asset.sourceMetadata?.commentCount || 0,
          timestamp: asset.sourceMetadata?.timestamp
        })) || [])
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
            <Link
              href="/dam?filter=source:instagram"
              className="btn btn-primary"
            >
              <ExternalLink className="w-4 h-4" />
              View in DAM
            </Link>
          </div>
        </div>
      </motion.div>

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
                    onChange={(e) => setSettings(prev => ({ ...prev, maxPosts: parseInt(e.target.value) }))}
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
                    onChange={(e) => setSettings(prev => ({ ...prev, scrollSpeed: parseInt(e.target.value) }))}
                    className="flex-1 accent-terracotta"
                  />
                  <span className="text-sm text-dune w-12 text-right">{settings.scrollSpeed}s</span>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-dune/70 group-hover:text-dune transition-colors">
                    Auto-scroll
                  </span>
                  <div 
                    onClick={() => setSettings(prev => ({ ...prev, autoScroll: !prev.autoScroll }))}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                      settings.autoScroll ? 'bg-terracotta' : 'bg-sage/30'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings.autoScroll ? 'left-6' : 'left-1'
                    }`} />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-dune/70 group-hover:text-dune transition-colors">
                    Show captions
                  </span>
                  <div 
                    onClick={() => setSettings(prev => ({ ...prev, showCaptions: !prev.showCaptions }))}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                      settings.showCaptions ? 'bg-terracotta' : 'bg-sage/30'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings.showCaptions ? 'left-6' : 'left-1'
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

