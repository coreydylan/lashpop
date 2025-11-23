"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, ExternalLink, Instagram as InstagramIcon, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface InstagramAsset {
  id: string
  fileName: string
  filePath: string
  caption: string | null
  source: string
  sourceMetadata: any
  uploadedAt: Date
}

interface InstagramConfig {
  maxImages: number
  autoScrollSpeed: number
  damTagFilter: string
  settings: {
    enableAutoplay: boolean
    enableLoop: boolean
    enableDots: boolean
    transitionDuration: number
  }
}

export default function InstagramCarouselManager() {
  const [config, setConfig] = useState<InstagramConfig>({
    maxImages: 10,
    autoScrollSpeed: 3000,
    damTagFilter: "ig_carousel",
    settings: {
      enableAutoplay: true,
      enableLoop: true,
      enableDots: false,
      transitionDuration: 500
    }
  })

  const [assets, setAssets] = useState<InstagramAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchInstagramAssets()
  }, [config.damTagFilter])

  const fetchInstagramAssets = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dam/assets?tag=${config.damTagFilter}`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error("Error fetching Instagram assets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/landing-v2/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        alert("Instagram carousel settings saved successfully!")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving Instagram config:", error)
      alert("Failed to save Instagram carousel settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-dune">Instagram Carousel Manager</h2>
          <p className="text-sm text-dune/60 mt-1">Configure the Instagram feed carousel section</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dam"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-dune/10 text-dune border border-dune/30 rounded-full hover:bg-dune/20 transition-all font-light text-sm"
          >
            <span>Open DAM</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="col-span-1 space-y-6">
          {/* DAM Configuration */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4 flex items-center gap-2">
              <InstagramIcon className="w-5 h-5" />
              Content Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dune/80 mb-2">
                  DAM Tag Filter
                  <span className="block text-xs text-dune/50 mt-1">
                    Images with this tag will appear in the carousel
                  </span>
                </label>
                <input
                  type="text"
                  value={config.damTagFilter}
                  onChange={(e) => setConfig({ ...config, damTagFilter: e.target.value })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all font-mono text-sm"
                  placeholder="ig_carousel"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span>Maximum Images</span>
                  <span className="font-mono text-xs text-dune/60">{config.maxImages}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={config.maxImages}
                  onChange={(e) => setConfig({ ...config, maxImages: Number(e.target.value) })}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Carousel Settings */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4">Carousel Behavior</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-dune/80">Autoplay</label>
                <button
                  onClick={() => setConfig({
                    ...config,
                    settings: { ...config.settings, enableAutoplay: !config.settings.enableAutoplay }
                  })}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    config.settings.enableAutoplay ? "bg-ocean-mist" : "bg-dune/20"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    config.settings.enableAutoplay ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>

              {config.settings.enableAutoplay && (
                <div>
                  <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                    <span>Scroll Speed (ms)</span>
                    <span className="font-mono text-xs text-dune/60">{config.autoScrollSpeed}</span>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    value={config.autoScrollSpeed}
                    onChange={(e) => setConfig({ ...config, autoScrollSpeed: Number(e.target.value) })}
                    className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-sm text-dune/80">Loop Carousel</label>
                <button
                  onClick={() => setConfig({
                    ...config,
                    settings: { ...config.settings, enableLoop: !config.settings.enableLoop }
                  })}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    config.settings.enableLoop ? "bg-ocean-mist" : "bg-dune/20"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    config.settings.enableLoop ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-dune/80">Show Dots</label>
                <button
                  onClick={() => setConfig({
                    ...config,
                    settings: { ...config.settings, enableDots: !config.settings.enableDots }
                  })}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    config.settings.enableDots ? "bg-ocean-mist" : "bg-dune/20"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    config.settings.enableDots ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span>Transition Duration (ms)</span>
                  <span className="font-mono text-xs text-dune/60">{config.settings.transitionDuration}</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  step="100"
                  value={config.settings.transitionDuration}
                  onChange={(e) => setConfig({
                    ...config,
                    settings: { ...config.settings, transitionDuration: Number(e.target.value) }
                  })}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Images Grid Column */}
        <div className="col-span-2">
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-light text-dune">Selected Images</h3>
                <p className="text-xs text-dune/60 mt-1">
                  {assets.length} image{assets.length !== 1 ? "s" : ""} tagged with "{config.damTagFilter}"
                </p>
              </div>
              <button
                onClick={fetchInstagramAssets}
                className="px-4 py-2 bg-dusty-rose/10 text-dusty-rose border border-dusty-rose/30 rounded-full hover:bg-dusty-rose/20 transition-all font-light text-sm"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-20">
                <InstagramIcon className="w-16 h-16 mx-auto mb-4 text-dune/20" />
                <p className="text-dune/60 mb-2">No images found with tag "{config.damTagFilter}"</p>
                <p className="text-sm text-dune/40">
                  Add this tag to images in the DAM to display them here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {assets.slice(0, config.maxImages).map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="relative aspect-square bg-dune/5 rounded-xl overflow-hidden border border-sage/10 hover:border-dusty-rose/30 transition-all group"
                  >
                    <Image
                      src={asset.filePath}
                      alt={asset.caption || asset.fileName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dune/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {asset.caption && (
                          <p className="text-xs text-white font-light line-clamp-2 mb-1">
                            {asset.caption}
                          </p>
                        )}
                        <p className="text-xs text-white/60 truncate">
                          {asset.fileName}
                        </p>
                      </div>
                    </div>
                    {asset.source === "instagram" && (
                      <div className="absolute top-2 right-2 p-1.5 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg shadow-lg">
                        <InstagramIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {assets.length > config.maxImages && (
              <div className="mt-4 p-3 bg-golden/10 border border-golden/20 rounded-xl">
                <p className="text-xs text-dune/70">
                  <strong>Note:</strong> Showing {config.maxImages} of {assets.length} images.
                  Increase the "Maximum Images" setting to show more.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="glass border border-golden/20 rounded-2xl p-4 bg-golden/10">
        <p className="text-sm text-dune/70">
          <strong>Managing Instagram Content:</strong> Use the DAM to upload and tag images.
          Images with the tag "{config.damTagFilter}" will automatically appear in the carousel.
          You can sync posts directly from Instagram using the DAM's Instagram integration.
        </p>
      </div>
    </div>
  )
}
